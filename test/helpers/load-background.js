// Loads background.js into an isolated VM context with a stub `chrome` API and
// a recording `fetch`, so its top-level functions can be tested in Node.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// A stub where any property chain is callable and returns undefined, e.g.
// chrome.runtime.onStartup.addListener(fn) quietly does nothing. Calls are
// recorded so tests can inspect what background.js asked Chrome to do.
function makeChromeStub(calls, overrides = {}) {
  const make = (pathParts) => new Proxy(function () {}, {
    get(_t, prop) {
      const key = [...pathParts, String(prop)].join(".");
      if (key in overrides) return overrides[key];
      return make([...pathParts, String(prop)]);
    },
    apply(_t, _this, args) {
      calls.push({ api: pathParts.join("."), args });
      return undefined;
    }
  });
  return make(["chrome"]);
}

const ROOT = path.join(__dirname, "..", "..");

// Load one or more of the extension's plain scripts (e.g. penpal-ai-config.js)
// into a fresh VM context, as a page would with <script> tags.
function loadScripts(files, globals = {}) {
  const context = vm.createContext({ console, URL, ...globals });
  for (const f of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), context, { filename: f });
  }
  return context;
}

function loadBackground({ fetchImpl, chromeOverrides, extraGlobals = {} } = {}) {
  const chromeCalls = [];
  const fetchCalls = [];
  const fetch = async (url, init = {}) => {
    fetchCalls.push({ url, init });
    if (!fetchImpl) throw new Error("no fetch stub provided");
    return fetchImpl(url, init);
  };
  const context = vm.createContext({
    chrome: makeChromeStub(chromeCalls, chromeOverrides),
    fetch,
    console,
    setTimeout,
    clearTimeout,
    URL,
    AbortController,
    ...extraGlobals
  });
  // Service-worker importScripts: run each file in the same context.
  context.importScripts = (...files) => {
    for (const f of files) vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), context, { filename: f });
  };
  const src = fs.readFileSync(path.join(ROOT, "background.js"), "utf8");
  vm.runInContext(src, context, { filename: "background.js" });
  return { bg: context, chromeCalls, fetchCalls };
}

// Minimal Response-like object for fetch stubs.
function jsonResponse(obj, status = 200) {
  const text = JSON.stringify(obj);
  return { ok: status >= 200 && status < 300, status, text: async () => text, json: async () => obj };
}

// Copy a VM-context value into host objects/arrays so deepEqual compares values, not prototypes.
const plain = (v) => JSON.parse(JSON.stringify(v));

module.exports = { loadBackground, loadScripts, jsonResponse, plain };

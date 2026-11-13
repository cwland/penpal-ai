// Local servers like Apple Foundation Models Serve return 403 "Cross-site
// requests are not allowed" when a request carries an Origin header or
// Sec-Fetch-Site: cross-site. Chrome adds both to extension fetches, so PenPal
// strips them — but only on its own requests to loopback hosts.
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBackground } = require("./helpers/load-background");

const EXT_ID = "abcdefghijklmnopabcdefghijklmnop";

function loadWithDnr({ failHeader } = {}) {
  const updates = [];
  const updateDynamicRules = async (opts) => {
    const headers = (opts.addRules || []).flatMap(r => r.action.requestHeaders.map(h => h.header));
    if (failHeader && headers.includes(failHeader)) throw new Error(`Chrome refused ${failHeader}`);
    updates.push(opts);
  };
  const { bg } = loadBackground({
    chromeOverrides: {
      "chrome.runtime.id": EXT_ID,
      "chrome.declarativeNetRequest.updateDynamicRules": updateDynamicRules
    }
  });
  const installedRules = () => updates.flatMap(u => u.addRules || []);
  const ruleRemoving = (header) =>
    installedRules().find(r => r.action.requestHeaders.some(h => h.header === header && h.operation === "remove"));
  return { bg, installedRules, ruleRemoving };
}

function assertScopedToOwnLoopbackRequests(rule) {
  assert.equal(rule.action.type, "modifyHeaders");
  // Spread copies VM-context arrays into host arrays so deepEqual compares values, not prototypes.
  assert.deepEqual([...rule.condition.initiatorDomains], [EXT_ID]);
  assert.deepEqual([...rule.condition.requestDomains].sort(), ["127.0.0.1", "localhost"]);
}

test("removes the Origin header on PenPal's own requests to localhost/127.0.0.1", async () => {
  const { bg, ruleRemoving } = loadWithDnr();
  await bg.installLocalHeaderRules();

  const rule = ruleRemoving("origin");
  assert.ok(rule, "expected a rule removing the Origin header");
  assertScopedToOwnLoopbackRequests(rule);
});

test("removes Sec-Fetch-Site on PenPal's own requests to localhost/127.0.0.1", async () => {
  const { bg, ruleRemoving } = loadWithDnr();
  await bg.installLocalHeaderRules();

  const rule = ruleRemoving("sec-fetch-site");
  assert.ok(rule, "expected a rule removing the Sec-Fetch-Site header");
  assertScopedToOwnLoopbackRequests(rule);
});

test("the Origin rule still installs if Chrome refuses the Sec-Fetch-Site rule", async () => {
  const { bg, ruleRemoving } = loadWithDnr({ failHeader: "sec-fetch-site" });

  await assert.doesNotReject(bg.installLocalHeaderRules());
  assert.ok(ruleRemoving("origin"), "Origin rule should survive the other rule failing");
});

test("header rules are installed when the background script starts", async () => {
  const { ruleRemoving } = loadWithDnr();
  await new Promise(r => setImmediate(r));

  assert.ok(ruleRemoving("origin"));
});

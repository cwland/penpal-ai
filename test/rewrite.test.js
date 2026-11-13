// Background "rewrite": runs the user's My Models list in order, falling back
// to the next model whenever one fails, and reports which model answered.
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBackground, jsonResponse, plain } = require("./helpers/load-background");

const A = { id: "m_a", source: "builtin", provider: "anthropic", model: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" };
const B = { id: "m_b", source: "builtin", provider: "openrouter", model: "qwen/qwen3.6-flash", label: "Qwen3.6 Flash" };
const C = { id: "m_c", source: "custom", provider: "c_apple", model: "system", label: "system" };

const SYNC = {
  aiModels: [A, B, C],
  aiConnections: { c_apple: { name: "Apple", endpoint: "http://127.0.0.1:1976/v1/chat/completions", apiFormat: "openai" } },
  apiKeys: { anthropic: "sk-ant", openrouter: "sk-or" }
};

const anthropicOk = (text) => jsonResponse({ content: [{ text }] });
const openaiOk = (text) => jsonResponse({ choices: [{ message: { content: text } }] });

function setup(route, sync = SYNC) {
  const local = {};
  const { bg, fetchCalls } = loadBackground({
    fetchImpl: route,
    chromeOverrides: {
      "chrome.storage.sync.get": async () => JSON.parse(JSON.stringify(sync)),
      "chrome.storage.local.get": async (k) => ({ [k]: local[k] }),
      "chrome.storage.local.set": async (o) => { Object.assign(local, o); }
    }
  });
  return { bg, fetchCalls, local };
}

const req = { text: "me and him goes", systemPrompt: "Fix grammar.", history: { source: "popup" } };

test("rewrite: the first model answers — no notice, no fallback", async () => {
  const { bg, fetchCalls } = setup(async (url) => anthropicOk("He and I go."));
  const res = plain(await bg.rewriteWithFallback(req));
  assert.equal(res.success, true);
  assert.equal(res.result, "He and I go.");
  assert.equal(res.usedModelId, "m_a");
  assert.equal(res.notice, "");
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url, "https://api.anthropic.com/v1/messages");
});

test("rewrite: a server error on #1 falls back to #2 and the notice names both", async () => {
  const { bg } = setup(async (url) =>
    url.includes("anthropic") ? jsonResponse({ error: { message: "overloaded" } }, 529) : openaiOk("He and I go."));
  const res = plain(await bg.rewriteWithFallback(req));
  assert.equal(res.success, true);
  assert.equal(res.usedModelId, "m_b");
  assert.equal(res.usedLabel, "Qwen3.6 Flash");
  assert.match(res.notice, /^Answered by Qwen3\.6 Flash — Claude Sonnet 4\.6 didn't respond \(overloaded\)\.$/);
});

test("rewrite: a network failure falls back", async () => {
  const { bg } = setup(async (url) => { if (url.includes("anthropic")) throw new TypeError("Failed to fetch"); return openaiOk("ok"); });
  const res = plain(await bg.rewriteWithFallback(req));
  assert.equal(res.usedModelId, "m_b");
});

test("rewrite: a model that doesn't answer within the time limit falls back with reason 'timeout'", async () => {
  const { bg } = setup((url, init) => url.includes("anthropic")
    ? new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }))))
    : openaiOk("fast"));
  const res = plain(await bg.rewriteWithFallback(req, { timeoutMs: 20 }));
  assert.equal(res.result, "fast");
  assert.match(res.notice, /Claude Sonnet 4\.6 didn't respond \(timeout\)/);
});

test("rewrite: the session's preferred model is tried first", async () => {
  const { bg, fetchCalls } = setup(async () => openaiOk("local"));
  const res = plain(await bg.rewriteWithFallback({ ...req, preferredModelId: "m_c" }));
  assert.equal(res.usedModelId, "m_c");
  assert.equal(fetchCalls[0].url, "http://127.0.0.1:1976/v1/chat/completions");
  assert.equal(res.notice, "");
});

test("rewrite: when every model fails, one error lists each model and why", async () => {
  const { bg } = setup(async () => jsonResponse({ error: { message: "nope" } }, 500));
  const res = plain(await bg.rewriteWithFallback(req));
  assert.equal(res.success, false);
  assert.match(res.error, /Claude Sonnet 4\.6: nope/);
  assert.match(res.error, /Qwen3\.6 Flash: nope/);
  assert.match(res.error, /system: nope/);
});

test("rewrite: an empty list asks the user to add a model", async () => {
  const { bg } = setup(async () => openaiOk("x"), { aiModels: [] });
  const res = plain(await bg.rewriteWithFallback(req));
  assert.equal(res.success, false);
  assert.match(res.error, /add a model/i);
});

test("rewrite: pre-1.5 settings still work before migration has been saved", async () => {
  const { bg } = setup(async () => openaiOk("legacy ok"), { provider: "openai", model: "gpt-4.1", apiKeys: { openai: "sk" } });
  const res = plain(await bg.rewriteWithFallback(req));
  assert.equal(res.result, "legacy ok");
});

test("rewrite: history records the model that actually answered", async () => {
  const { bg, local } = setup(async (url) =>
    url.includes("anthropic") ? jsonResponse({}, 500) : openaiOk("He and I go."));
  await bg.rewriteWithFallback(req);
  await bg.addHistoryEntry; // ensure function exists
  await new Promise(r => setTimeout(r, 10));
  const list = local.penpalHistory || [];
  assert.equal(list.length, 1);
  assert.equal(list[0].model, "qwen/qwen3.6-flash");
});

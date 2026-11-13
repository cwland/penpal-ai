// Background "validateConnection": checks a key/endpoint by loading the
// provider's model list, returning the exact model IDs for the dropdown.
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBackground, jsonResponse, plain } = require("./helpers/load-background");

const validate = async (route, args) => {
  const { bg, fetchCalls } = loadBackground({ fetchImpl: route });
  return { res: plain(await bg.validateConnection(args)), fetchCalls };
};

test("validate: a good key returns the provider's model IDs", async () => {
  const { res, fetchCalls } = await validate(async () => jsonResponse({ data: [{ id: "gpt-4.1" }, { id: "gpt-4.1-mini" }] }),
    { provider: "openai", apiKey: "sk" });
  assert.equal(res.ok, true);
  assert.deepEqual(res.ids, ["gpt-4.1", "gpt-4.1-mini"]);
  assert.equal(fetchCalls[0].url, "https://api.openai.com/v1/models");
  assert.equal(fetchCalls[0].init.headers.Authorization, "Bearer sk");
});

test("validate: a rejected key is reported as a key problem", async () => {
  const { res } = await validate(async () => jsonResponse({ error: { message: "bad key" } }, 401), { provider: "openai", apiKey: "sk-bad" });
  assert.equal(res.ok, false);
  assert.match(res.error, /rejected this API key/i);
});

test("validate: a built-in provider needs a key", async () => {
  const { res, fetchCalls } = await validate(async () => jsonResponse({ data: [] }), { provider: "anthropic", apiKey: "" });
  assert.equal(res.ok, false);
  assert.match(res.error, /API key/);
  assert.equal(fetchCalls.length, 0);
});

test("validate: OpenRouter checks the key itself, since its model list is public", async () => {
  const { res } = await validate(async (url) => url.endsWith("/api/v1/key")
    ? jsonResponse({ error: { message: "No auth credentials found" } }, 401)
    : jsonResponse({ data: [{ id: "openai/gpt-4.1-mini" }] }),
    { provider: "openrouter", apiKey: "sk-or-bad" });
  assert.equal(res.ok, false);
  assert.match(res.error, /rejected this API key/i);
});

test("validate: OpenRouter with a good key returns the model list", async () => {
  const { res } = await validate(async (url) => url.endsWith("/api/v1/key")
    ? jsonResponse({ data: { label: "k" } })
    : jsonResponse({ data: [{ id: "openai/gpt-4.1-mini" }] }),
    { provider: "openrouter", apiKey: "sk-or" });
  assert.equal(res.ok, true);
  assert.deepEqual(res.ids, ["openai/gpt-4.1-mini"]);
});

test("validate: a local server works without a key and keeps exact model ID casing", async () => {
  const { res, fetchCalls } = await validate(async () => jsonResponse({ object: "list", data: [{ id: "Qwen2.5-7B-Instruct" }, { id: "system" }] }),
    { provider: "c_lm", endpoint: "http://localhost:1234/v1/chat/completions", apiFormat: "openai", apiKey: "" });
  assert.equal(res.ok, true);
  assert.deepEqual(res.ids, ["Qwen2.5-7B-Instruct", "system"]);
  assert.equal(fetchCalls[0].url, "http://localhost:1234/v1/models");
});

test("validate: an unreachable server says so", async () => {
  const { res } = await validate(async () => { throw new TypeError("Failed to fetch"); },
    { provider: "c_x", endpoint: "http://127.0.0.1:1976/v1/chat/completions", apiFormat: "openai" });
  assert.equal(res.ok, false);
  assert.match(res.error, /couldn't reach/i);
});

test("validate: an endpoint without a recognizable models address asks for a manual model ID", async () => {
  const { res, fetchCalls } = await validate(async () => jsonResponse({}),
    { provider: "c_x", endpoint: "http://box/generate", apiFormat: "openai" });
  assert.equal(res.ok, false);
  assert.equal(res.manualModel, true);
  assert.equal(fetchCalls.length, 0);
});

test("validate: Google model IDs lose their 'models/' prefix", async () => {
  const { res } = await validate(async () => jsonResponse({ data: [{ id: "models/gemini-2.5-flash" }] }), { provider: "google", apiKey: "g" });
  assert.deepEqual(res.ids, ["gemini-2.5-flash"]);
});

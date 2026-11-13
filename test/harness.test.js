// Smoke test: proves the harness can load background.js and drive callAIAPI.
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBackground, jsonResponse } = require("./helpers/load-background");

test("harness: callAIAPI returns the reply text from an OpenAI-style response", async () => {
  const { bg, fetchCalls } = loadBackground({
    fetchImpl: async () => jsonResponse({ choices: [{ message: { content: "Fixed text." } }] })
  });

  const result = await bg.callAIAPI("fixd text", {
    provider: "custom-local",
    model: "system",
    systemPrompt: "Fix grammar.",
    endpointOverrides: { "custom-local": "http://127.0.0.1:1976/v1/chat/completions" }
  });

  assert.equal(result, "Fixed text.");
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url, "http://127.0.0.1:1976/v1/chat/completions");
});

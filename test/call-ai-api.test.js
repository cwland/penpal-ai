const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBackground, jsonResponse } = require("./helpers/load-background");

const okReply = async () => jsonResponse({ choices: [{ message: { content: "ok" } }] });

// Some local servers (e.g. Apple Foundation Models Serve) stream SSE by default
// unless told otherwise, which breaks PenPal's JSON parsing.
test("OpenAI-format requests explicitly ask for a non-streamed response", async () => {
  const { bg, fetchCalls } = loadBackground({ fetchImpl: okReply });

  await bg.callAIAPI("hi", {
    provider: "custom-local",
    model: "system",
    systemPrompt: "Fix grammar.",
    endpointOverrides: { "custom-local": "http://127.0.0.1:1976/v1/chat/completions" }
  });

  const sent = JSON.parse(fetchCalls[0].init.body);
  assert.equal(sent.stream, false);
});

// Small models (e.g. Apple's on-device model) sometimes echo the delimiters
// PenPal wraps the user's text in. They must never reach the user.
test("echoed <text_to_edit> delimiters are stripped from the reply", async () => {
  const { bg } = loadBackground({
    fetchImpl: async () => jsonResponse({ choices: [{ message: { content: "<text_to_edit>\nYo, this is a test 😎</text_to_edit>" } }] })
  });
  const out = await bg.callAIAPI("yo this is a test", {
    provider: "custom-local", model: "system", systemPrompt: "Fix.",
    endpointOverrides: { "custom-local": "http://127.0.0.1:1976/v1/chat/completions" }
  });
  assert.equal(out, "Yo, this is a test 😎");
});

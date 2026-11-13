const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScripts, plain } = require("./helpers/load-background");

const cfg = () => loadScripts(["penpal-ai-config.js"]);

// ── Migration ───────────────────────────────────────────────────────────────

test("migrate: current built-in provider + model becomes entry #1 with its key", () => {
  const c = cfg();
  const out = plain(c.migrateLegacySettings({
    provider: "anthropic", model: "claude-sonnet-4-6", apiKeys: { anthropic: "sk-ant" }
  }));
  assert.equal(out.aiModels.length, 1);
  assert.equal(out.aiModels[0].source, "builtin");
  assert.equal(out.aiModels[0].provider, "anthropic");
  assert.equal(out.aiModels[0].model, "claude-sonnet-4-6");
  assert.equal(out.aiModels[0].label, "Claude Sonnet 4.6");
  assert.equal(out.apiKeys.anthropic, "sk-ant");
});

test("migrate: legacy single apiKey is kept for the current provider", () => {
  const out = plain(cfg().migrateLegacySettings({ provider: "openai", model: "gpt-4.1", apiKey: "sk-old" }));
  assert.equal(out.apiKeys.openai, "sk-old");
});

test("migrate: custom providers become connections and their models become entries after #1, deduped", () => {
  const out = plain(cfg().migrateLegacySettings({
    provider: "custom_apple", model: "system",
    customProviders: [{ id: "custom_apple", name: "Apple", icon: "🍎", endpoint: "http://127.0.0.1:1976/v1/chat/completions", apiFormat: "openai" }],
    customModels: { custom_apple: [{ value: "system", label: "system" }, { value: "other", label: "Other" }] }
  }));
  assert.deepEqual(out.aiModels.map(m => [m.source, m.provider, m.model]), [
    ["custom", "custom_apple", "system"],
    ["custom", "custom_apple", "other"]
  ]);
  assert.equal(out.aiConnections.custom_apple.endpoint, "http://127.0.0.1:1976/v1/chat/completions");
  assert.equal(out.aiConnections.custom_apple.name, "Apple");
});

test("migrate: a built-in endpoint override becomes a custom connection carrying the key", () => {
  const out = plain(cfg().migrateLegacySettings({
    provider: "openai", model: "gpt-4.1", apiKeys: { openai: "sk-1" },
    endpointOverrides: { openai: "https://proxy.example/v1/chat/completions" }
  }));
  const e = out.aiModels[0];
  assert.equal(e.source, "custom");
  const conn = out.aiConnections[e.provider];
  assert.equal(conn.name, "OpenAI (custom endpoint)");
  assert.equal(conn.endpoint, "https://proxy.example/v1/chat/completions");
  assert.equal(conn.apiFormat, "openai");
  assert.equal(out.apiKeys[e.provider], "sk-1");
});

test("migrate: hand-added built-in model IDs that aren't the current model are dropped", () => {
  const out = plain(cfg().migrateLegacySettings({
    provider: "openai", model: "gpt-4.1",
    customModels: { openai: [{ value: "gpt-x-custom", label: "X" }] }
  }));
  assert.deepEqual(out.aiModels.map(m => m.model), ["gpt-4.1"]);
});

test("migrate: nothing set up yields an empty list", () => {
  assert.deepEqual(plain(cfg().migrateLegacySettings({})).aiModels, []);
});

test("resolveAiModels prefers a stored list and migrates on the fly otherwise", () => {
  const c = cfg();
  const stored = [{ id: "m_1", source: "builtin", provider: "openai", model: "gpt-4.1", label: "GPT-4.1" }];
  assert.deepEqual(plain(c.resolveAiModels({ aiModels: stored, provider: "anthropic", model: "x" })), stored);
  assert.equal(plain(c.resolveAiModels({ provider: "openai", model: "gpt-4.1" }))[0].model, "gpt-4.1");
});

// ── Model lists ─────────────────────────────────────────────────────────────

test("filterChatModels drops non-chat models for built-in providers", () => {
  const ids = ["gpt-4.1", "text-embedding-3-small", "whisper-1", "tts-1", "dall-e-3",
    "omni-moderation-latest", "gpt-4o-realtime-preview", "gpt-4o-transcribe", "gpt-image-1"];
  assert.deepEqual(plain(cfg().filterChatModels(ids, "builtin")), ["gpt-4.1"]);
});

test("filterChatModels leaves custom/local lists untouched", () => {
  assert.deepEqual(plain(cfg().filterChatModels(["nomic-embed-text", "llama3.1"], "custom")), ["nomic-embed-text", "llama3.1"]);
});

test("buildModelOptions pins live recommended models first with their badge, then the rest alphabetically", () => {
  const opts = plain(cfg().buildModelOptions("anthropic", ["claude-opus-4", "claude-haiku-4-5", "claude-sonnet-4-6"], "builtin"));
  assert.deepEqual(opts.map(o => o.value), ["claude-sonnet-4-6", "claude-haiku-4-5", "claude-opus-4"]);
  assert.equal(opts[0].rec.label, "Best for writing");
  assert.equal(opts[2].rec, null);
});

test("buildModelOptions keeps the server's exact model ID casing", () => {
  const opts = plain(cfg().buildModelOptions("c_lm", ["Qwen2.5-7B-Instruct-GGUF"], "custom"));
  assert.equal(opts[0].value, "Qwen2.5-7B-Instruct-GGUF");
});

test("modelDisplayLabel uses the curated short label when known, else the raw ID", () => {
  const c = cfg();
  assert.equal(c.modelDisplayLabel("openai", "gpt-4.1-mini"), "GPT-4.1 Mini");
  assert.equal(c.modelDisplayLabel("c_x", "llama3.1:8b"), "llama3.1:8b");
});

// ── Request settings ────────────────────────────────────────────────────────

test("requestSettingsFor a built-in entry uses its provider key", () => {
  const s = plain(cfg().requestSettingsFor(
    { source: "builtin", provider: "groq", model: "llama-3.3-70b-versatile" },
    { aiConnections: {}, apiKeys: { groq: "gsk" } }));
  assert.equal(s.provider, "groq");
  assert.equal(s.apiKey, "gsk");
  assert.equal(s.model, "llama-3.3-70b-versatile");
});

test("requestSettingsFor a custom entry routes to its endpoint and format", () => {
  const s = plain(cfg().requestSettingsFor(
    { source: "custom", provider: "c_a", model: "system" },
    { aiConnections: { c_a: { endpoint: "http://127.0.0.1:1976/v1/chat/completions", apiFormat: "openai" } }, apiKeys: {} }));
  assert.deepEqual(s.endpointOverrides, { c_a: "http://127.0.0.1:1976/v1/chat/completions" });
  assert.equal(s.apiFormat, "openai");
  assert.equal(s.apiKey, "");
});

test("requestSettingsFor returns null when a custom entry's connection is missing", () => {
  assert.equal(cfg().requestSettingsFor({ source: "custom", provider: "gone", model: "m" }, { aiConnections: {}, apiKeys: {} }), null);
});

// ── List operations ─────────────────────────────────────────────────────────

const A = { id: "m_a", source: "builtin", provider: "anthropic", model: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" };
const B = { id: "m_b", source: "builtin", provider: "openrouter", model: "qwen/qwen3.6-flash", label: "Qwen3.6 Flash" };
const C = { id: "m_c", source: "custom", provider: "c_apple", model: "system", label: "system" };

test("buildFallbackChain puts the preferred model first, then the rest in order", () => {
  const c = cfg();
  assert.deepEqual(plain(c.buildFallbackChain([A, B, C], "m_c")).map(m => m.id), ["m_c", "m_a", "m_b"]);
  assert.deepEqual(plain(c.buildFallbackChain([A, B, C], "missing")).map(m => m.id), ["m_a", "m_b", "m_c"]);
  assert.deepEqual(plain(c.buildFallbackChain([A, B, C])).map(m => m.id), ["m_a", "m_b", "m_c"]);
});

test("addModelEntry appends and rejects a duplicate provider + model", () => {
  const c = cfg();
  const ok = plain(c.addModelEntry([A], B));
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.list.map(m => m.id), ["m_a", "m_b"]);
  const dup = plain(c.addModelEntry([A, B], { ...A, id: "m_z" }));
  assert.equal(dup.ok, false);
  assert.match(dup.error, /already/i);
});

test("addModelEntry can replace an entry being edited without tripping the duplicate check", () => {
  const out = plain(cfg().addModelEntry([A, B], { ...A, label: "Renamed" }, { replaceId: "m_a" }));
  assert.equal(out.ok, true);
  assert.deepEqual(out.list.map(m => [m.id, m.label]), [["m_a", "Renamed"], ["m_b", "Qwen3.6 Flash"]]);
});

test("removeModelEntry drops a provider's key and connection once nothing uses them", () => {
  const state = { aiModels: [A, B, C], aiConnections: { c_apple: { endpoint: "x" } }, apiKeys: { anthropic: "k1", openrouter: "k2", c_apple: "k3" } };
  const out = plain(cfg().removeModelEntry(state, "m_c"));
  assert.deepEqual(out.aiModels.map(m => m.id), ["m_a", "m_b"]);
  assert.equal(out.aiConnections.c_apple, undefined);
  assert.equal(out.apiKeys.c_apple, undefined);
  assert.equal(out.apiKeys.anthropic, "k1");
});

test("removeModelEntry keeps a key another entry still uses", () => {
  const A2 = { ...A, id: "m_a2", model: "claude-haiku-4-5" };
  const out = plain(cfg().removeModelEntry({ aiModels: [A, A2], aiConnections: {}, apiKeys: { anthropic: "k1" } }, "m_a"));
  assert.equal(out.apiKeys.anthropic, "k1");
});

test("moveModelEntry reorders", () => {
  assert.deepEqual(plain(cfg().moveModelEntry([A, B, C], 2, 0)).map(m => m.id), ["m_c", "m_a", "m_b"]);
  assert.deepEqual(plain(cfg().moveModelEntry([A, B, C], 0, 9)).map(m => m.id), ["m_b", "m_c", "m_a"]);
});

// ── Attribution ─────────────────────────────────────────────────────────────

test("describeAttempts names the backup that answered and why the first failed", () => {
  const s = cfg().describeAttempts([{ modelId: "m_a", label: "Claude Sonnet 4.6", error: "timeout" }], B);
  assert.equal(s, "Answered by Qwen3.6 Flash — Claude Sonnet 4.6 didn't respond (timeout).");
});

test("describeAttempts is empty when the first model answered", () => {
  assert.equal(cfg().describeAttempts([], A), "");
});

test("makeAiId produces distinct prefixed ids", () => {
  const c = cfg();
  const a = c.makeAiId("m"), b = c.makeAiId("m");
  assert.match(a, /^m_[a-z0-9]+$/);
  assert.notEqual(a, b);
});

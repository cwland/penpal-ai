// penpal-ai-config.js — shared AI model configuration logic (no DOM).
// Loaded by the service worker (importScripts), Settings, the popup, the full
// tab and the content script. Holds the "My Models" data model, migration from
// the pre-1.5 settings, model-list filtering/ordering, recommendations, and
// fallback-chain helpers. Everything here is pure so it can be unit-tested.
//
// Storage (chrome.storage.sync):
//   aiModels:      [{ id, source: "builtin"|"custom", provider, model, label, testedAt }]  (index 0 = default)
//   aiConnections: { [connectionId]: { name, icon, endpoint, apiFormat } }               (custom/local servers)
//   apiKeys:       { [provider or connectionId]: "key" }                                  (one key per provider)

const PROVIDER_NAMES = {
  openrouter: "OpenRouter", openai: "OpenAI", anthropic: "Anthropic", google: "Google Gemini",
  mistral: "Mistral", meta: "Meta (via OpenRouter)", groq: "Groq", cohere: "Cohere",
  together: "Together AI", fireworks: "Fireworks AI", deepseek: "DeepSeek", xai: "xAI"
};

// Curated labels for known model IDs (used for friendly names only — the live
// /models list is the source of truth for what's available).
const PROVIDER_MODELS = {
  openrouter: [
    // OpenAI via OpenRouter — mini/nano confirmed live; plain gpt-4.1 omitted (failed live test)
    { value: "openai/gpt-4.1-mini",          label: "GPT-4.1 Mini — fast & cheap" },
    { value: "openai/gpt-4.1-nano",          label: "GPT-4.1 Nano — fastest & cheapest" },
    // Anthropic via OpenRouter — confirmed working
    { value: "anthropic/claude-sonnet-4.6",  label: "Claude Sonnet 4.6 — best Anthropic" },
    { value: "anthropic/claude-haiku-4.5",   label: "Claude Haiku 4.5 — fast & cheap" },
    // Google via OpenRouter — confirmed working
    { value: "google/gemini-2.5-flash",      label: "Gemini 2.5 Flash — fast" },
    { value: "google/gemini-3.5-flash",      label: "Gemini 3.5 Flash — best Google" },
    // Mistral via OpenRouter — confirmed working
    { value: "mistralai/mistral-large-2512", label: "Mistral Large 3 — best Mistral" },
    { value: "mistralai/mistral-small-2603", label: "Mistral Small 4 — lightweight" },
    // Qwen via OpenRouter — confirmed live
    { value: "qwen/qwen3.6-flash",           label: "Qwen3.6 Flash — fast & very cheap" },
    // DeepSeek via OpenRouter — confirmed working
    { value: "deepseek/deepseek-chat-v3-0324", label: "DeepSeek V3 — best value" },
    // xAI via OpenRouter — confirmed working
    { value: "x-ai/grok-4.3",               label: "Grok 4.3 — xAI flagship" },
    // Meta via OpenRouter — paid
    { value: "meta-llama/llama-4-maverick",              label: "Llama 4 Maverick — paid" },
    // OpenRouter's free router — auto-picks best available free model
    { value: "openrouter/free",                          label: "Free Models Router — auto-picks best free model" },
  ],
  openai: [
    // Slugs for direct OpenAI API (not OpenRouter)
    { value: "gpt-4.1",      label: "GPT-4.1 — best quality" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 Mini — fast & cheap" },
    { value: "gpt-4.1-nano", label: "GPT-4.1 Nano — cheapest" },
    { value: "gpt-4o",       label: "GPT-4o — still available via API" },
    { value: "gpt-4o-mini",  label: "GPT-4o Mini — still available via API" },
  ],
  anthropic: [
    // Slugs for direct Anthropic API (verified: platform.claude.com/docs/models)
    { value: "claude-haiku-4-5",  label: "Claude Haiku 4.5 — fast & cheap" },
    { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 — balanced" },
    { value: "claude-opus-4-8",   label: "Claude Opus 4.8 — most capable" },
  ],
  google: [
    // Slugs for direct Google Gemini API (OpenAI-compat endpoint)
    { value: "gemini-2.5-flash-lite-preview-06-17", label: "Gemini 2.5 Flash Lite — cheapest" },
    { value: "gemini-2.5-flash",                    label: "Gemini 2.5 Flash — fast" },
    { value: "gemini-3.5-flash",                    label: "Gemini 3.5 Flash — best quality" },
  ],
  mistral: [
    // Slugs for direct Mistral API (verified: docs.mistral.ai)
    { value: "mistral-small-latest", label: "Mistral Small 4 — lightweight" },
    { value: "mistral-large-latest", label: "Mistral Large 3 — best quality" },
  ],
  meta: [
    // Meta models via OpenRouter (verified: openrouter.ai/meta-llama)
    { value: "meta-llama/llama-4-maverick",                 label: "Llama 4 Maverick — paid" },
    { value: "meta-llama/llama-3.3-70b-instruct:free",     label: "Llama 3.3 70B — free (capacity limited)" },
  ],
  groq: [
    // Slugs verified: console.groq.com/docs/models
    { value: "llama-3.1-8b-instant",                      label: "Llama 3.1 8B Instant — fastest" },
    { value: "llama-3.3-70b-versatile",                   label: "Llama 3.3 70B Versatile — best quality" },
    { value: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout" },
    { value: "openai/gpt-oss-20b",                        label: "GPT-OSS 20B — OpenAI open-source" },
    { value: "qwen/qwen3-32b",                            label: "Qwen3 32B" },
  ],
  cohere: [
    { value: "command-r-plus", label: "Command R+ — best quality" },
    { value: "command-r",      label: "Command R — balanced" },
  ],
  together: [
    { value: "meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo", label: "Llama 3.3 70B Turbo — best quality" },
    { value: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",  label: "Llama 3.1 8B Turbo — cheapest" },
    { value: "deepseek-ai/DeepSeek-V3",                       label: "DeepSeek V3" },
  ],
  fireworks: [
    { value: "accounts/fireworks/models/llama-v3p3-70b-instruct", label: "Llama 3.3 70B — best quality" },
    { value: "accounts/fireworks/models/llama-v3p1-8b-instruct",  label: "Llama 3.1 8B — fastest" },
    { value: "accounts/fireworks/models/deepseek-v3",             label: "DeepSeek V3" },
  ],
  deepseek: [
    // Slugs verified: platform.deepseek.com/api-docs
    { value: "deepseek-chat",     label: "DeepSeek V3 — best value" },
    { value: "deepseek-reasoner", label: "DeepSeek R1 — reasoning" },
  ],
  xai: [
    // Slugs verified: openrouter.ai/x-ai
    { value: "grok-4",      label: "Grok 4 — most capable" },
    { value: "grok-4.3",    label: "Grok 4.3 — fast & reliable" },
    { value: "grok-4.1-fast", label: "Grok 4.1 Fast — agentic tool calling" },
  ]
};

// Suggested models per built-in provider, shown when picking a model.
const MODEL_RECOMMENDATIONS = {
  openrouter: [
    { badge: "best",  label: "Best for writing", model: "anthropic/claude-sonnet-4.6",   note: "Claude Sonnet 4.6 — nuanced, natural prose" },
    { badge: "fast",  label: "Fast & cheap",     model: "qwen/qwen3.6-flash",            note: "Qwen3.6 Flash — very low cost with solid quality" },
    { badge: "free",  label: "Free tier",        model: "openrouter/free",               note: "Free Models Router — automatically picks the best available free model. Quality varies but it's a great way to get started at no cost." },
  ],
  openai: [
    { badge: "best",  label: "Best for writing", model: "gpt-4.1",      note: "GPT-4.1 — richest vocabulary, best at matching tone" },
    { badge: "value", label: "Best value",       model: "gpt-4.1-mini", note: "GPT-4.1 Mini — 90% of the quality at a fraction of the cost" },
  ],
  anthropic: [
    { badge: "best",  label: "Best for writing", model: "claude-sonnet-4-6", note: "Claude Sonnet 4.6 — exceptional at matching tone and voice" },
    { badge: "fast",  label: "Fast & cheap",     model: "claude-haiku-4-5",  note: "Claude Haiku 4.5 — great for quick grammar fixes" },
  ],
  google: [
    { badge: "best",  label: "Best quality", model: "gemini-3.5-flash", note: "Gemini 3.5 Flash — Google's strongest model for writing" },
    { badge: "value", label: "Best value",   model: "gemini-2.5-flash", note: "Gemini 2.5 Flash — fast and reliable" },
  ],
  mistral: [
    { badge: "best",  label: "Best for writing", model: "mistral-large-latest", note: "Mistral Large 3 — best prose quality in the Mistral family" },
    { badge: "value", label: "Best value",       model: "mistral-small-latest", note: "Mistral Small 4 — lightweight and capable" },
  ],
  meta: [
    { badge: "best",  label: "Best quality", model: "meta-llama/llama-4-maverick",              note: "Llama 4 Maverick — best open-source writing quality" },
    { badge: "free",  label: "Free tier",    model: "meta-llama/llama-3.3-70b-instruct:free",   note: "Llama 3.3 70B — free via OpenRouter, subject to capacity limits" },
  ],
  groq: [
    { badge: "best",  label: "Best quality", model: "llama-3.3-70b-versatile", note: "Llama 3.3 70B — best writing quality on Groq" },
    { badge: "fast",  label: "Fastest",      model: "llama-3.1-8b-instant",    note: "Llama 3.1 8B Instant — near-instant responses" },
  ],
  cohere: [
    { badge: "best",  label: "Best for writing", model: "command-r-plus", note: "Command R+ — Cohere's strongest model for prose" },
    { badge: "value", label: "Good value",       model: "command-r",      note: "Command R — solid for everyday corrections" },
  ],
  together: [
    { badge: "best",  label: "Best quality", model: "meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo", note: "Llama 3.3 70B Turbo — fast and high quality" },
    { badge: "value", label: "Best value",   model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",  note: "Llama 3.1 8B Turbo — cheap and quick" },
  ],
  fireworks: [
    { badge: "best",  label: "Best quality", model: "accounts/fireworks/models/llama-v3p3-70b-instruct", note: "Llama 3.3 70B — best writing results" },
    { badge: "fast",  label: "Fastest",      model: "accounts/fireworks/models/llama-v3p1-8b-instruct",  note: "Llama 3.1 8B — fastest option" },
  ],
  deepseek: [
    { badge: "value", label: "Best value",   model: "deepseek-chat",     note: "DeepSeek V3 — excellent quality for the price" },
    { badge: "best",  label: "Most capable", model: "deepseek-reasoner", note: "DeepSeek R1 — great for complex rewrites" },
  ],
  xai: [
    { badge: "best",  label: "Best available", model: "grok-4",        note: "Grok 4 — most capable xAI model" },
    { badge: "fast",  label: "Faster option",  model: "grok-4.1-fast", note: "Grok 4.1 Fast — great for agentic tool use" },
  ],
};

// ── Ids & labels ────────────────────────────────────────────────────────────

let _aiIdCounter = 0;
function makeAiId(prefix) {
  _aiIdCounter = (_aiIdCounter + 1) % 1296;
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}${_aiIdCounter.toString(36)}`;
}

function providerDisplayName(provider, aiConnections) {
  return (aiConnections && aiConnections[provider] && aiConnections[provider].name)
    || PROVIDER_NAMES[provider] || provider;
}

// Short label for a model: the curated label without its " — descriptor",
// or the raw ID when we don't know it.
function modelDisplayLabel(provider, modelId) {
  const hit = (PROVIDER_MODELS[provider] || []).find(m => m.value === modelId);
  return hit ? hit.label.split(" — ")[0] : modelId;
}

// ── Migration from pre-1.5 settings ─────────────────────────────────────────

function _legacyKeyFor(data, provider) {
  const keys = data.apiKeys || {};
  if (typeof keys[provider] === "string") return keys[provider].trim();
  if (data.apiKey && (data.provider || "openrouter") === provider) return String(data.apiKey).trim();
  return "";
}

function _formatForBuiltin(provider) {
  return provider === "anthropic" ? "anthropic" : provider === "cohere" ? "cohere" : "openai";
}

function migrateLegacySettings(data) {
  data = data || {};
  const aiModels = [];
  const aiConnections = {};
  const apiKeys = { ...(data.apiKeys || {}) };
  const customProviders = data.customProviders || [];
  const customModels = data.customModels || {};
  const overrides = data.endpointOverrides || {};

  for (const cp of customProviders) {
    aiConnections[cp.id] = { name: cp.name, icon: cp.icon || "🤖", endpoint: cp.endpoint, apiFormat: cp.apiFormat || "openai" };
  }

  const push = (entry) => {
    if (!aiModels.some(m => m.provider === entry.provider && m.model === entry.model)) aiModels.push(entry);
  };

  const provider = data.provider;
  if (provider && data.model) {
    const key = _legacyKeyFor(data, provider);
    if (aiConnections[provider]) {
      push({ id: makeAiId("m"), source: "custom", provider, model: data.model, label: data.model, testedAt: null });
    } else if (overrides[provider]) {
      const connId = `c_override_${provider}`;
      aiConnections[connId] = {
        name: `${PROVIDER_NAMES[provider] || provider} (custom endpoint)`, icon: "🔀",
        endpoint: overrides[provider], apiFormat: _formatForBuiltin(provider)
      };
      if (key) apiKeys[connId] = key;
      push({ id: makeAiId("m"), source: "custom", provider: connId, model: data.model, label: modelDisplayLabel(provider, data.model), testedAt: null });
    } else {
      if (key) apiKeys[provider] = key;
      push({ id: makeAiId("m"), source: "builtin", provider, model: data.model, label: modelDisplayLabel(provider, data.model), testedAt: null });
    }
  }

  for (const cp of customProviders) {
    for (const m of (customModels[cp.id] || [])) {
      if (m && m.value) push({ id: makeAiId("m"), source: "custom", provider: cp.id, model: m.value, label: m.value, testedAt: null });
    }
  }

  return { aiModels, aiConnections, apiKeys };
}

function resolveAiModels(data) {
  data = data || {};
  return Array.isArray(data.aiModels) ? data.aiModels : migrateLegacySettings(data).aiModels;
}

function resolveAiConnections(data) {
  data = data || {};
  return Array.isArray(data.aiModels) ? (data.aiConnections || {}) : migrateLegacySettings(data).aiConnections;
}

function resolveApiKeys(data) {
  data = data || {};
  return Array.isArray(data.aiModels) ? (data.apiKeys || {}) : migrateLegacySettings(data).apiKeys;
}

// ── Model lists ─────────────────────────────────────────────────────────────

const NON_CHAT_MODEL_PATTERN = /(embed|whisper|tts|dall-e|moderation|image|audio|realtime|transcribe|search|rerank)/i;

function filterChatModels(ids, source) {
  if (source !== "builtin") return ids.slice();
  return ids.filter(id => !NON_CHAT_MODEL_PATTERN.test(id));
}

// Dropdown options: recommended models that exist in the live list first (in
// recommendation order, with their badge), then everything else A→Z.
function buildModelOptions(provider, ids, source) {
  const live = filterChatModels(ids || [], source);
  const recs = source === "builtin" ? (MODEL_RECOMMENDATIONS[provider] || []) : [];
  const lower = new Map(live.map(id => [id.toLowerCase(), id]));
  const out = [];
  const used = new Set();
  for (const r of recs) {
    const id = lower.get(String(r.model).toLowerCase());
    if (id && !used.has(id)) {
      used.add(id);
      out.push({ value: id, label: modelDisplayLabel(provider, id), rec: { badge: r.badge, label: r.label, note: r.note } });
    }
  }
  const rest = live.filter(id => !used.has(id)).sort((a, b) => a.localeCompare(b));
  for (const id of rest) out.push({ value: id, label: modelDisplayLabel(provider, id), rec: null });
  return out;
}

// ── Request settings for one entry (shape callAIAPI expects) ────────────────

function requestSettingsFor(entry, { aiConnections, apiKeys } = {}) {
  const keys = apiKeys || {};
  const key = typeof keys[entry.provider] === "string" ? keys[entry.provider].trim() : "";
  if (entry.source === "custom") {
    const conn = (aiConnections || {})[entry.provider];
    if (!conn) return null;
    return { provider: entry.provider, apiKey: key, model: entry.model,
      endpointOverrides: { [entry.provider]: conn.endpoint }, apiFormat: conn.apiFormat || "openai" };
  }
  return { provider: entry.provider, apiKey: key, model: entry.model };
}

// ── List operations ─────────────────────────────────────────────────────────

function buildFallbackChain(aiModels, preferredId) {
  const list = (aiModels || []).slice();
  const i = preferredId ? list.findIndex(m => m.id === preferredId) : -1;
  if (i > 0) list.unshift(list.splice(i, 1)[0]);
  return list;
}

function addModelEntry(list, entry, { replaceId } = {}) {
  list = list || [];
  const dup = list.find(m => m.id !== replaceId && m.provider === entry.provider && m.model === entry.model);
  if (dup) return { ok: false, list, error: `${dup.label || entry.model} is already in your list.` };
  if (replaceId && list.some(m => m.id === replaceId)) {
    return { ok: true, list: list.map(m => (m.id === replaceId ? { ...entry, id: replaceId } : m)) };
  }
  return { ok: true, list: [...list, entry] };
}

function removeModelEntry({ aiModels, aiConnections, apiKeys }, id) {
  const models = (aiModels || []).filter(m => m.id !== id);
  const removed = (aiModels || []).find(m => m.id === id);
  const conns = { ...(aiConnections || {}) };
  const keys = { ...(apiKeys || {}) };
  if (removed && !models.some(m => m.provider === removed.provider)) {
    delete keys[removed.provider];
    delete conns[removed.provider];
  }
  return { aiModels: models, aiConnections: conns, apiKeys: keys };
}

function moveModelEntry(list, from, to) {
  const out = (list || []).slice();
  if (from < 0 || from >= out.length) return out;
  const [item] = out.splice(from, 1);
  out.splice(Math.max(0, Math.min(to, out.length)), 0, item);
  return out;
}

// ── Attribution ─────────────────────────────────────────────────────────────

function describeAttempts(attempts, usedEntry) {
  const failed = (attempts || []).filter(a => a.error);
  if (!failed.length || !usedEntry) return "";
  const why = failed.map(a => `${a.label} didn't respond (${a.error})`).join("; ");
  return `Answered by ${usedEntry.label} — ${why}.`;
}

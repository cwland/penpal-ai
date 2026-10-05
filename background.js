// Background service worker — PenPal AI Writing Assistant

// ═══════════════════════════════════════════════════════════════════════════
// GitHub-based update system (side-loaded installs only)
// ═══════════════════════════════════════════════════════════════════════════
const UPDATE_CONFIG = {
  // Flip to true for the Chrome Web Store build to disable all update checks.
  isWebStoreBuild: false,
  versionUrl: "https://raw.githubusercontent.com/cwland/penpal-ai/main/version.json",
  releasesUrl: "https://github.com/cwland/penpal-ai/releases",
  checkIntervalMs: 24 * 60 * 60 * 1000, // max once per 24h
  alarmName: "penpalUpdateCheck"
};

// Side-loaded = NOT a Web Store build AND no managed update_url in the manifest.
// (Web Store / policy-managed installs carry an update_url; unpacked/sideloaded
// builds do not.) No extra permission required.
function isSideLoadedInstall() {
  if (UPDATE_CONFIG.isWebStoreBuild) return false;
  try {
    if (chrome.runtime.getManifest().update_url) return false;
  } catch (_) {}
  return true;
}

// Numeric semver-ish comparison. Returns true if `remote` is strictly newer
// than `current`. Tolerates differing segment counts ("1.2" vs "1.2.0").
function isVersionNewer(remote, current) {
  const norm = (v) => String(v || "").trim().replace(/^v/i, "").split(".").map(n => parseInt(n, 10) || 0);
  const a = norm(remote), b = norm(current);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] || 0, y = b[i] || 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

// Fetch the remote version file and, if newer, record an "update available"
// flag in local storage for the UI surfaces to read. Rate-limited to once per
// 24h. Fails silently — never throws, never surfaces errors to the user.
async function checkForUpdate({ force = false } = {}) {
  if (!isSideLoadedInstall()) return;
  try {
    const { penpalLastUpdateCheck } = await chrome.storage.local.get("penpalLastUpdateCheck");
    const now = Date.now();
    if (!force && penpalLastUpdateCheck && (now - penpalLastUpdateCheck) < UPDATE_CONFIG.checkIntervalMs) {
      return; // checked recently — skip to avoid excessive requests
    }
    // Record the attempt up front so a failure doesn't cause repeated retries
    // before the next scheduled interval.
    await chrome.storage.local.set({ penpalLastUpdateCheck: now });

    // Cache-buster so we always see the latest file.
    const resp = await fetch(`${UPDATE_CONFIG.versionUrl}?t=${now}`, { method: "GET", cache: "no-store" });
    if (!resp.ok) return;
    const info = await resp.json().catch(() => null);
    if (!info || !info.version) return;

    const current = chrome.runtime.getManifest().version;
    if (isVersionNewer(info.version, current)) {
      await chrome.storage.local.set({
        penpalUpdate: {
          available: true,
          version: String(info.version),
          notes: info.notes ? String(info.notes) : "",
          downloadUrl: info.downloadUrl ? String(info.downloadUrl) : UPDATE_CONFIG.releasesUrl
        }
      });
    } else {
      // Up to date — clear any stale flag (e.g. after the user updates).
      await chrome.storage.local.set({ penpalUpdate: { available: false } });
    }
  } catch (_) {
    // GitHub unreachable / offline / parse error — fail silently, retry next interval.
  }
}

// Triggers: on browser startup, on install/update, and a daily alarm.
chrome.runtime.onStartup.addListener(() => checkForUpdate());
try {
  chrome.alarms.create(UPDATE_CONFIG.alarmName, { periodInMinutes: 24 * 60 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === UPDATE_CONFIG.alarmName) checkForUpdate();
  });
} catch (_) { /* alarms unavailable — startup check still runs */ }

const PROVIDER_ENDPOINTS = {
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
  openai:     "https://api.openai.com/v1/chat/completions",
  anthropic:  "https://api.anthropic.com/v1/messages",
  google:     "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  mistral:    "https://api.mistral.ai/v1/chat/completions",
  meta:       "https://openrouter.ai/api/v1/chat/completions", // route via openrouter
  groq:       "https://api.groq.com/openai/v1/chat/completions",
  cohere:     "https://api.cohere.ai/v2/chat",
  together:   "https://api.together.xyz/v1/chat/completions",
  fireworks:  "https://api.fireworks.ai/inference/v1/chat/completions",
  deepseek:   "https://api.deepseek.com/v1/chat/completions",
  xai:        "https://api.x.ai/v1/chat/completions"
};

// Allow content scripts (untrusted context) to read/write session storage so
// the docked side panel can persist its conversation state across page reloads.
try {
  chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS" });
} catch (_) { /* older Chrome without setAccessLevel — non-fatal */ }

chrome.runtime.onInstalled.addListener((details) => {
  // Open settings page automatically on first install
  if (details.reason === "install") {
    chrome.runtime.openOptionsPage();
  }

  // On install/update, clear any stale "update available" flag (the user may
  // have just updated) and run a fresh check.
  if (details.reason === "install" || details.reason === "update") {
    chrome.storage.local.set({ penpalUpdate: { available: false } });
    checkForUpdate({ force: true });
  }

  chrome.contextMenus.create({
    id: "ai-writer-fix",
    title: "✏️ Rewrite with PenPal AI",
    contexts: ["selection"]
  });

  // Right-click the toolbar icon → "Open in new tab"
  chrome.contextMenus.create({
    id: "penpal-open-tab",
    title: "🗖 Open PenPal AI in new tab",
    contexts: ["action"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "ai-writer-fix") {
    chrome.tabs.sendMessage(tab.id, {
      action: "openPanelWithSelection",
      selectedText: info.selectionText
    });
  }
  if (info.menuItemId === "penpal-open-tab") {
    chrome.tabs.create({ url: chrome.runtime.getURL("penpal-tab.html?tab=1") });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "callAI") {
    callAIAPI(request.text, request.settings, { debug: !!request.debug })
      .then(result => {
        // Only chat surfaces send `history` metadata — Settings' connection
        // tests don't, so they never land in the user's history.
        if (request.history) {
          const out = request.debug ? result.text : result;
          addHistoryEntry(request.text, out, request.history, request.settings).catch(() => {});
        }
        if (request.debug) sendResponse({ success: true, result: result.text, debug: result.debug });
        else sendResponse({ success: true, result });
      })
      .catch(err => sendResponse({ success: false, error: err.message, debug: err.debug }));
    return true;
  }
  if (request.action === "openOptions") {
    chrome.runtime.openOptionsPage(() => sendResponse({ success: !chrome.runtime.lastError }));
    return true; // keep the message channel open for the async sendResponse
  }

  // ── Full browser tab ──────────────────────────────────────────────────
  if (request.action === "openTab") {
    chrome.tabs.create({ url: chrome.runtime.getURL("penpal-tab.html?tab=1") });
    sendResponse({ success: true });
    return true;
  }

  // ── Pop-out window ────────────────────────────────────────────────────
  if (request.action === "openPopout") {
    openOrFocusPopout(request.draft).then(sendResponse);
    return true;
  }

  // ── Open a URL in a new tab (used by the update toast's "View Update") ──
  if (request.action === "openUrl" && request.url) {
    try { chrome.tabs.create({ url: request.url }); } catch (_) {}
    sendResponse({ success: true });
    return true;
  }

  // ── Manual update check trigger (from a UI surface on load) ────────────
  if (request.action === "checkForUpdate") {
    checkForUpdate().finally(() => sendResponse({ success: true }));
    return true;
  }

  // ── Live model validation ─────────────────────────────────────────────
  // Returns the set of model IDs the provider actually exposes for this key,
  // so the picker can hide presets that would error. Best-effort: on any
  // failure it returns { ok:false } and callers keep the full curated list.
  if (request.action === "listModels") {
    listProviderModels(request).then(sendResponse);
    return true;
  }

  // ── History window ────────────────────────────────────────────────────
  if (request.action === "openHistory") {
    openOrFocusHistory(request.opener || {}, sender).then(sendResponse);
    return true;
  }
  if (request.action === "historyEdit" && typeof request.text === "string") {
    deliverHistoryEdit(request.text).then(sendResponse);
    return true;
  }

  if (request.action === "getPopoutInit") {
    chrome.storage.session.get("popoutDraft", ({ popoutDraft }) => {
      sendResponse({ draft: popoutDraft || null });
    });
    return true;
  }

  // A content script reports a fresh text selection on the page — relay it
  // to the pop-out window (if one is open) for live selection sync.
  if (request.action === "selectionCaptured") {
    chrome.storage.session.get("popoutWindowId", ({ popoutWindowId }) => {
      if (!popoutWindowId) return;
      chrome.runtime.sendMessage({ action: "liveSelectionUpdate", text: request.text }).catch(() => {});
    });
    return false;
  }
});

// Open the PenPal pop-out window, or focus it if it's already open.
// `draft` carries the current popup state (input text, tone, last result,
// etc.) so the standalone window can pick up right where the popup left off.
async function openOrFocusPopout(draft) {
  try {
    await chrome.storage.session.set({ popoutDraft: draft || {} });

    const { popoutWindowId } = await chrome.storage.session.get("popoutWindowId");
    if (popoutWindowId) {
      try {
        await chrome.windows.get(popoutWindowId);
        await chrome.windows.update(popoutWindowId, { focused: true });
        // Push the latest draft (e.g. a fresh selection) to the already-open window
        chrome.runtime.sendMessage({ action: "popoutDraftUpdate", draft }).catch(() => {});
        return { success: true, focused: true };
      } catch (_) {
        // Window was closed without us hearing about it — fall through and create a new one
        await chrome.storage.session.remove("popoutWindowId");
      }
    }

    // type: "popup" gives a minimal chrome-less window. Chrome's extension
    // APIs don't expose a true "always on top" flag, so this is the closest
    // we can get — `focused: true` brings it to the front on open.
    const win = await chrome.windows.create({
      url: chrome.runtime.getURL("penpal-popup.html?standalone=1"),
      type: "popup",
      width: 420,
      height: 680,
      focused: true
    });
    await chrome.storage.session.set({ popoutWindowId: win.id });
    return { success: true, created: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Clean up tracking state when the pop-out or history window is closed by the user.
chrome.windows.onRemoved.addListener((windowId) => {
  chrome.storage.session.get(["popoutWindowId", "historyWindowId"], ({ popoutWindowId, historyWindowId }) => {
    if (popoutWindowId === windowId) {
      chrome.storage.session.remove(["popoutWindowId", "popoutDraft"]);
    }
    if (historyWindowId === windowId) {
      chrome.storage.session.remove(["historyWindowId"]);
    }
  });
});

// ── Rewrite history ──────────────────────────────────────────────────────
// Every successful rewrite from a chat surface (full tab, pop-out, side panel)
// is kept in chrome.storage.local under HISTORY_KEY, oldest first. Local only —
// never synced, never sent anywhere.
const HISTORY_KEY = "penpalHistory";
const HISTORY_DEFAULT_LIMIT = 100;   // Settings → AI Models & Settings → History
const HISTORY_HARD_MAX      = 1000;  // safety cap regardless of setting

async function getHistoryLimit() {
  try {
    const { historyLimit } = await chrome.storage.sync.get("historyLimit");
    const n = Number(historyLimit);
    if (!Number.isFinite(n) || n < 0) return HISTORY_DEFAULT_LIMIT;
    return Math.min(Math.floor(n), HISTORY_HARD_MAX);
  } catch (_) {
    return HISTORY_DEFAULT_LIMIT;
  }
}

let _historyWrite = Promise.resolve();
function addHistoryEntry(input, output, meta, settings) {
  if (!input || !output) return Promise.resolve();
  // Serialize writes so two rewrites finishing together can't clobber each other.
  _historyWrite = _historyWrite.then(async () => {
    const limit = await getHistoryLimit();
    if (limit === 0) return; // user turned history off
    const { [HISTORY_KEY]: list = [] } = await chrome.storage.local.get(HISTORY_KEY);
    list.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      ts: Date.now(),
      input,
      output,
      tone: meta.tone || "",
      toneLabel: meta.toneLabel || "",
      language: meta.language || "",
      model: settings?.model || "",
      source: meta.source || ""
    });
    if (list.length > limit) list.splice(0, list.length - limit);
    await chrome.storage.local.set({ [HISTORY_KEY]: list });
  }).catch(() => {});
  return _historyWrite;
}

// Lowering the limit in Settings trims older entries right away.
function trimHistoryToLimit() {
  _historyWrite = _historyWrite.then(async () => {
    const limit = await getHistoryLimit();
    const { [HISTORY_KEY]: list } = await chrome.storage.local.get(HISTORY_KEY);
    if (!Array.isArray(list) || list.length <= limit) return;
    if (limit === 0) await chrome.storage.local.remove(HISTORY_KEY);
    else await chrome.storage.local.set({ [HISTORY_KEY]: list.slice(list.length - limit) });
  }).catch(() => {});
  return _historyWrite;
}
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.historyLimit) trimHistoryToLimit();
});

// Open the History pop-out window (or focus it), remembering which PenPal
// view opened it so "Edit" can send text back to that view's input box.
async function openOrFocusHistory(opener, sender) {
  try {
    const target = {
      source: opener.source || "",
      instanceId: opener.instanceId || "",
      tabId: sender?.tab?.id ?? null,
      windowId: sender?.tab?.windowId ?? null
    };
    await chrome.storage.session.set({ historyOpener: target });

    const { historyWindowId } = await chrome.storage.session.get("historyWindowId");
    if (historyWindowId) {
      try {
        await chrome.windows.get(historyWindowId);
        await chrome.windows.update(historyWindowId, { focused: true });
        return { success: true, focused: true };
      } catch (_) {
        await chrome.storage.session.remove("historyWindowId");
      }
    }
    const win = await chrome.windows.create({
      url: chrome.runtime.getURL("penpal-history.html"),
      type: "popup",
      width: 480,
      height: 720,
      focused: true
    });
    await chrome.storage.session.set({ historyWindowId: win.id });
    return { success: true, created: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Send history text back to the view that opened the History window.
// Falls back to a fresh full-screen tab if that view has since been closed.
async function deliverHistoryEdit(text) {
  const { historyOpener: o } = await chrome.storage.session.get("historyOpener");
  let delivered = false;

  if (o && o.source === "sidepanel" && o.tabId != null) {
    // Side panel lives in a content script — reach it through its tab.
    try {
      const res = await chrome.tabs.sendMessage(o.tabId, { action: "historyInsert", text });
      delivered = !!res?.ok;
    } catch (_) {}
  } else if (o && o.instanceId) {
    // Extension pages (full tab, pop-out window) each answer only to their own id.
    try {
      const res = await chrome.runtime.sendMessage({ action: "historyInsert", text, target: o.instanceId });
      delivered = !!res?.ok;
    } catch (_) {}
  }

  if (delivered) {
    try {
      if (o.windowId != null) await chrome.windows.update(o.windowId, { focused: true });
      if (o.tabId != null) await chrome.tabs.update(o.tabId, { active: true });
    } catch (_) {}
    return { success: true, delivered: true };
  }

  // Opener is gone (or History was opened from the toolbar menu) — open a
  // full-screen tab with the text loaded in its input.
  const tab = await chrome.tabs.create({
    url: chrome.runtime.getURL("penpal-tab.html?tab=1&from=history&selection=" + encodeURIComponent(text))
  });
  try { await chrome.windows.update(tab.windowId, { focused: true }); } catch (_) {}
  return { success: true, delivered: false, openedTab: true };
}

// Derive the provider's "list models" URL from its chat endpoint.
function modelsURLFor(provider, chatEndpoint, format) {
  if (provider === "cohere") return "https://api.cohere.ai/v1/models";
  if (format === "anthropic") return chatEndpoint.replace(/\/messages\/?$/, "/models");
  // OpenAI-compatible: .../chat/completions → .../models
  if (/\/chat\/completions\/?$/.test(chatEndpoint)) {
    return chatEndpoint.replace(/\/chat\/completions\/?$/, "/models");
  }
  return null; // unknown shape (custom server) — skip validation
}

// Pull the available model IDs from a provider's /models response. Handles the
// common shapes: { data:[{id}] } (OpenAI-style), { models:[{id|name}] } (Cohere/
// Google). IDs are lowercased and any leading "models/" prefix is stripped so
// they compare cleanly against our preset values.
function extractModelIds(json) {
  let arr = [];
  if (json && Array.isArray(json.data)) arr = json.data;
  else if (json && Array.isArray(json.models)) arr = json.models;
  else if (Array.isArray(json)) arr = json;
  return arr
    .map(m => (typeof m === "string" ? m : (m && (m.id || m.name))))
    .filter(Boolean)
    .map(id => String(id).toLowerCase().replace(/^models\//, ""));
}

// Cache validation results briefly (per provider+key) so opening the panel
// repeatedly in a session doesn't hammer the provider's API.
const MODELS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function listProviderModels({ provider = "openrouter", apiKey = "", endpointOverrides, apiFormat } = {}) {
  try {
    const format = (provider === "anthropic" || provider === "cohere") ? provider : (apiFormat || "openai");
    const chatEndpoint = endpointOverrides?.[provider] || PROVIDER_ENDPOINTS[provider] || PROVIDER_ENDPOINTS.openrouter;
    const url = modelsURLFor(provider, chatEndpoint, format);
    if (!url) return { ok: false, reason: "no-endpoint" };

    // Cache key is provider + a short fingerprint of the key (so switching keys re-checks).
    const fp = apiKey ? String(apiKey.length) + apiKey.slice(-4) : "nokey";
    const cacheKey = `modelValidation:${provider}:${fp}`;
    try {
      const cached = (await chrome.storage.session.get(cacheKey))[cacheKey];
      if (cached && Date.now() - cached.ts < MODELS_CACHE_TTL && Array.isArray(cached.ids)) {
        return { ok: true, ids: cached.ids, cached: true };
      }
    } catch (_) {}

    const headers = {};
    if (apiKey) {
      if (format === "anthropic") { headers["anthropic-version"] = "2023-06-01"; headers["x-api-key"] = apiKey; }
      else headers["Authorization"] = `Bearer ${apiKey}`;
    }
    if (provider === "openrouter" || provider === "meta") {
      headers["HTTP-Referer"] = "chrome-extension://penpal-ai-writing-assistant";
      headers["X-Title"] = "PenPal AI Writing Assistant";
    }

    let resp;
    try {
      resp = await fetch(url, { method: "GET", headers });
    } catch (_) {
      return { ok: false, reason: "network" };
    }
    if (!resp.ok) return { ok: false, reason: `http-${resp.status}` };

    const json = await resp.json().catch(() => null);
    const ids = extractModelIds(json);
    if (!ids.length) return { ok: false, reason: "empty" };

    try { await chrome.storage.session.set({ [cacheKey]: { ids, ts: Date.now() } }); } catch (_) {}
    return { ok: true, ids };
  } catch (err) {
    return { ok: false, reason: err?.message || "error" };
  }
}

async function callAIAPI(text, settings, { debug = false } = {}) {
  const { apiKey, provider = "openrouter", model, systemPrompt, endpointOverrides, apiFormat } = settings;

  // Wrap the user text in clear delimiters so the model cannot confuse it with instructions
  const safeUserContent = `<text_to_edit>\n${text}\n</text_to_edit>`;
  const endpoint = endpointOverrides?.[provider] || PROVIDER_ENDPOINTS[provider] || PROVIDER_ENDPOINTS.openrouter;

  // Built-in providers "anthropic"/"cohere" imply their own format. Custom providers
  // (e.g. local/homelab servers) declare their format explicitly; default to
  // OpenAI-compatible, which covers Ollama, LM Studio, vLLM, llama.cpp, etc.
  const format = (provider === "anthropic" || provider === "cohere") ? provider : (apiFormat || "openai");

  const headers = { "Content-Type": "application/json" };

  // Many local/homelab servers don't require auth — only send a key if one is set
  if (apiKey) {
    if (format === "anthropic") {
      headers["anthropic-version"] = "2023-06-01";
      headers["x-api-key"] = apiKey;
    } else {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
  }

  // Provider-specific header additions
  if (provider === "openrouter" || provider === "meta") {
    headers["HTTP-Referer"] = "chrome-extension://penpal-ai-writing-assistant";
    headers["X-Title"] = "PenPal AI Writing Assistant";
  }

  let bodyObj;

  if (format === "anthropic") {
    bodyObj = {
      model: model || "claude-haiku-4-5",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: safeUserContent }]
    };
  } else if (format === "cohere") {
    // Cohere v2 chat API
    bodyObj = {
      model: model || "command-r",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: safeUserContent }
      ]
    };
  } else {
    // OpenAI-compatible (works for OpenAI, OpenRouter, Mistral, Groq, Together,
    // Fireworks, DeepSeek, xAI, Google, and most local servers: Ollama, LM Studio,
    // vLLM, llama.cpp, text-generation-webui, etc.)
    bodyObj = {
      model: model || "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: safeUserContent }
      ],
      temperature: 0.4,
      max_tokens: 2000
    };
  }

  const body = JSON.stringify(bodyObj);

  // Debug info accumulates as we go so it's available even if a later step throws.
  const debugInfo = debug ? { endpoint, requestBody: bodyObj } : null;

  let response;
  try {
    response = await fetch(endpoint, { method: "POST", headers, body });
  } catch (err) {
    if (debugInfo) debugInfo.networkError = err.message;
    const wrapped = new Error(`Network error reaching endpoint: ${err.message}`);
    wrapped.debug = debugInfo;
    throw wrapped;
  }

  if (!response.ok) {
    const rawErrText = await response.text().catch(() => "");
    if (debugInfo) debugInfo.rawResponse = rawErrText;
    const errData = (() => { try { return JSON.parse(rawErrText); } catch { return {}; } })();
    const msg = errData?.error?.message
      || errData?.message
      || `API error ${response.status}`;
    const wrapped = new Error(msg);
    wrapped.debug = debugInfo;
    throw wrapped;
  }

  const rawResponseText = await response.text();
  if (debugInfo) debugInfo.rawResponse = rawResponseText;

  let data;
  try {
    data = JSON.parse(rawResponseText);
  } catch (err) {
    if (debugInfo) debugInfo.parseError = `Response was not valid JSON: ${err.message}`;
    const wrapped = new Error("The server's response wasn't valid JSON — it may not be an OpenAI/Anthropic-compatible endpoint.");
    wrapped.debug = debugInfo;
    throw wrapped;
  }

  // Extract raw text from provider-specific response shape
  const raw = format === "anthropic"
    ? (data.content?.[0]?.text || "")
    : (data.choices?.[0]?.message?.content || "");

  if (!raw || typeof raw !== "string") {
    if (debugInfo) debugInfo.parseError = `Response JSON did not contain the expected text field (${format === "anthropic" ? "content[0].text" : "choices[0].message.content"}).`;
    const wrapped = new Error("Connected, but the response didn't contain a recognizable text reply.");
    wrapped.debug = debugInfo;
    throw wrapped;
  }

  let cleaned = stripCommentary(stripThinkTags(raw));

  // Hard-coded post-process: some models keep sneaking in em/en dashes even
  // when explicitly told not to. Default ON; user can disable in Settings.
  if (settings.stripDashes !== false) cleaned = stripDashes(cleaned);

  if (debug) return { text: cleaned, debug: debugInfo };
  return cleaned;
}

/**
 * Strip em dashes (—) and en dashes (–) from the AI's response and replace
 * them with commas. This runs regardless of what the model outputs — it's a
 * deterministic cleanup step, not another prompt instruction the model can
 * ignore. Toggleable via settings.stripDashes (default: on).
 */
function stripDashes(text) {
  if (!text) return text;

  let result = text
    // Any em/en dash, plus surrounding whitespace, becomes ", "
    .replace(/\s*[—–]\s*/g, ", ")
    // Collapse doubled-up commas produced by adjacent dashes ("a—b—c")
    .replace(/,\s*,/g, ",")
    // Drop the comma if it now sits directly before other punctuation
    .replace(/,(\s*)([.!?;:,])/g, "$2");

  // Trailing comma left by a dash at the very end of the text
  return result.replace(/,\s*$/, "").trim();
}

/**
 * Strip <think>...</think> reasoning blocks some open-weight reasoning
 * models (e.g. Qwen3, DeepSeek R1 when self-hosted) embed directly in the
 * content field instead of a separate API field. Most providers keep
 * reasoning out of `content` entirely, so this is a no-op for them — it
 * only fires when the tags are actually present.
 */
function stripThinkTags(text) {
  if (!text) return text;

  // Standard <think>...</think> (case-insensitive, multiline reasoning)
  let result = text.replace(/<think>[\s\S]*?<\/think>/gi, "");

  // Some local servers (e.g. older Ollama builds) emit an unclosed
  // <think> tag if the model's reasoning got cut off mid-stream — in
  // that case there's no real answer left, so strip everything from
  // the tag onward rather than leaving a dangling fragment.
  result = result.replace(/<think>[\s\S]*$/i, "");

  return result.trim();
}

/**
 * Strip AI preamble/postamble commentary from the response.
 * Models like GPT-4o, Claude, Gemini often add things like:
 *   "Sure! Here's the rewritten text:"
 *   "Here is the corrected version:"
 *   "I've rewritten your text below:"
 * We want only the actual edited content.
 */
function stripCommentary(text) {
  if (!text) return text;

  let result = text.trim();

  // ── Strip leading preamble lines ─────────────────────────────────────────
  // These patterns match a single opening line that is commentary, not content.
  const preamblePatterns = [
    // "Here is/Here's the ..."
    /^here'?s?\s+(is\s+)?the\s+.{0,60}[:\n]/i,
    // "Sure! Here's ..."
    /^sure[!,.]?\s+here'?s?\s+.{0,60}[:\n]/i,
    // "I've rewritten / I have rewritten ..."
    /^i'?ve?\s+(rewritten|revised|corrected|updated|improved|edited|fixed|polished)\s+.{0,80}[:\n]/i,
    // "Below is / Below you'll find ..."
    /^below\s+(is|you'?ll\s+find)\s+.{0,60}[:\n]/i,
    // "The following is ..."
    /^the\s+following\s+is\s+.{0,60}[:\n]/i,
    // "Certainly! / Of course! / Absolutely!"
    /^(certainly|of course|absolutely|gladly|happy to help)[!,.]?\s*/i,
    // "As requested, ..."
    /^as\s+requested[,.]?\s*/i,
    // Lines that are purely meta: "Rewritten version:" / "Corrected text:"
    /^(rewritten|revised|corrected|updated|improved|edited|fixed|polished|result|output)\s+(version|text|copy|content)?[:\-–]\s*/i,
  ];

  for (const pattern of preamblePatterns) {
    const match = result.match(pattern);
    if (match) {
      result = result.slice(match[0].length).trim();
      break; // only strip one preamble
    }
  }

  // ── Strip wrapping quotes if the whole response is quoted ─────────────────
  // Some models wrap the entire output in "..." or '...'
  if (
    (result.startsWith('"') && result.endsWith('"')) ||
    (result.startsWith("'") && result.endsWith("'")) ||
    (result.startsWith("\u201C") && result.endsWith("\u201D")) // curly quotes
  ) {
    result = result.slice(1, -1).trim();
  }

  // ── Strip trailing commentary lines ──────────────────────────────────────
  const trailingPatterns = [
    /\n+let me know if (you('?d| would) like|there('?s| is) anything).{0,100}$/i,
    /\n+feel free to .{0,100}$/i,
    /\n+i hope (this|that) .{0,100}$/i,
    /\n+(please )?(let me know|reach out).{0,100}$/i,
    /\n+if you (need|want|have).{0,100}$/i,
    /\n+is there anything (else|more).{0,100}$/i,
  ];

  for (const pattern of trailingPatterns) {
    result = result.replace(pattern, "").trim();
  }

  return result;
}

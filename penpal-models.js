// penpal-models.js — shared, validated model presets + session model picker
// Loaded by the popup/pop-out, the full tab, and the content script so all
// surfaces can offer a "change model for this session" control that lists only
// models validated to work for the user's default provider.
//
// NOTE: keep PROVIDER_MODELS in sync with the same constant in penpal-settings.js.

const PROVIDER_MODELS = {
  openrouter: [
    { value: "openai/gpt-4.1-mini",            label: "GPT-4.1 Mini — fast & cheap" },
    { value: "openai/gpt-4.1-nano",            label: "GPT-4.1 Nano — fastest & cheapest" },
    { value: "anthropic/claude-sonnet-4.6",    label: "Claude Sonnet 4.6 — best Anthropic" },
    { value: "anthropic/claude-haiku-4.5",     label: "Claude Haiku 4.5 — fast & cheap" },
    { value: "google/gemini-2.5-flash",        label: "Gemini 2.5 Flash — fast" },
    { value: "google/gemini-3.5-flash",        label: "Gemini 3.5 Flash — best Google" },
    { value: "mistralai/mistral-large-2512",   label: "Mistral Large 3 — best Mistral" },
    { value: "mistralai/mistral-small-2603",   label: "Mistral Small 4 — lightweight" },
    { value: "qwen/qwen3.6-flash",             label: "Qwen3.6 Flash — fast & very cheap" },
    { value: "deepseek/deepseek-chat-v3-0324", label: "DeepSeek V3 — best value" },
    { value: "x-ai/grok-4.3",                  label: "Grok 4.3 — xAI flagship" },
    { value: "meta-llama/llama-4-maverick",    label: "Llama 4 Maverick — paid" },
    { value: "openrouter/free",                label: "Free Models Router — auto-picks best free model" },
  ],
  openai: [
    { value: "gpt-4.1",      label: "GPT-4.1 — best quality" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 Mini — fast & cheap" },
    { value: "gpt-4.1-nano", label: "GPT-4.1 Nano — cheapest" },
    { value: "gpt-4o",       label: "GPT-4o — still available via API" },
    { value: "gpt-4o-mini",  label: "GPT-4o Mini — still available via API" },
  ],
  anthropic: [
    { value: "claude-haiku-4-5",  label: "Claude Haiku 4.5 — fast & cheap" },
    { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 — balanced" },
    { value: "claude-opus-4-8",   label: "Claude Opus 4.8 — most capable" },
  ],
  google: [
    { value: "gemini-2.5-flash-lite-preview-06-17", label: "Gemini 2.5 Flash Lite — cheapest" },
    { value: "gemini-2.5-flash",                    label: "Gemini 2.5 Flash — fast" },
    { value: "gemini-3.5-flash",                    label: "Gemini 3.5 Flash — best quality" },
  ],
  mistral: [
    { value: "mistral-small-latest", label: "Mistral Small 4 — lightweight" },
    { value: "mistral-large-latest", label: "Mistral Large 3 — best quality" },
  ],
  meta: [
    { value: "meta-llama/llama-4-maverick",            label: "Llama 4 Maverick — paid" },
    { value: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B — free (capacity limited)" },
  ],
  groq: [
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
    { value: "deepseek-chat",     label: "DeepSeek V3 — best value" },
    { value: "deepseek-reasoner", label: "DeepSeek R1 — reasoning" },
  ],
  xai: [
    { value: "grok-4",        label: "Grok 4 — most capable" },
    { value: "grok-4.3",      label: "Grok 4.3 — fast & reliable" },
    { value: "grok-4.1-fast", label: "Grok 4.1 Fast — agentic tool calling" },
  ],
};

// Resolve the session-selectable ("validated to work") models for the active
// default provider: the shipped, verified presets minus any the user hid, plus
// any custom models they added for that provider. Mirrors the Settings dropdown.
// `data` is the result of chrome.storage.sync.get(["provider","model","customModels","hiddenModels"]).
function getValidatedModels(data) {
  const provider = (data && data.provider) || "openrouter";
  const hidden   = new Set(((data && data.hiddenModels) || {})[provider] || []);
  const defaults = (PROVIDER_MODELS[provider] || []).filter(m => !hidden.has(m.value));
  const customs  = ((data && data.customModels) || {})[provider] || [];
  // De-dupe by value (a custom entry could repeat a preset value)
  const seen = new Set();
  const models = [];
  for (const m of [...defaults, ...customs]) {
    if (m && m.value && !seen.has(m.value)) { seen.add(m.value); models.push(m); }
  }
  return { provider, models };
}

// Does a curated preset `value` correspond to any of the provider's live IDs?
// Lenient on purpose — providers expose date-suffixed or prefixed variants
// (e.g. "claude-haiku-4-5-20251001", "models/gemini-2.5-flash") so we accept a
// match when either side is a prefix of the other, or the live ID equals the
// value with a trailing "-<date/build>" segment stripped.
function modelValueIsLive(value, liveSet, liveList) {
  const v = String(value || "").toLowerCase();
  if (!v) return false;
  if (liveSet.has(v)) return true;
  for (const id of liveList) {
    if (id === v) return true;
    if (id.startsWith(v + "-") || id.startsWith(v + ":")) return true; // date/build/tag suffix
    if (v.startsWith(id + "-") || v.startsWith(id + ":")) return true;
    // strip a trailing date-like segment from the live id and compare
    if (id.replace(/-\d{6,8}$/, "") === v) return true;
  }
  return false;
}

// Live-validated model list for the active provider. Starts from the curated
// presets (getValidatedModels) then removes any the provider doesn't actually
// expose for the user's key — so the picker never offers a model that errors.
// Runs behind the scenes on each window load. Best-effort: if validation can't
// run (no key, custom/local provider, offline, or a provider with no /models
// endpoint), it returns the full curated list unchanged so the menu is never
// wrongly emptied.
async function getLiveValidatedModels() {
  const data = await new Promise(r =>
    chrome.storage.sync.get(
      ["provider", "model", "customModels", "hiddenModels", "apiKeys", "apiKey", "customProviders", "endpointOverrides"],
      d => r(d || {})
    ));

  const { provider, models } = getValidatedModels(data);
  const savedModel = data.model || null;
  const result = { provider, models, savedModel, validated: false };

  // Resolve the active key for this provider (mirrors resolveSettings()).
  const apiKeys = data.apiKeys || {};
  let apiKey = apiKeys[provider];
  if (apiKey === undefined) apiKey = (data.apiKey && (data.provider || "openrouter") === provider) ? data.apiKey : "";
  apiKey = (typeof apiKey === "string" ? apiKey : "").trim();

  const customProvider = (data.customProviders || []).find(p => p.id === provider);

  // Skip validation we can't trust: custom/local providers, or no key (most
  // cloud /models endpoints require auth). Keep the curated list as-is.
  if (customProvider || !apiKey || !models.length) return result;

  let res;
  try {
    res = await new Promise(resolve => {
      chrome.runtime.sendMessage(
        { action: "listModels", provider, apiKey, endpointOverrides: data.endpointOverrides, apiFormat: customProvider?.apiFormat },
        (r) => { if (chrome.runtime.lastError) resolve({ ok: false }); else resolve(r || { ok: false }); }
      );
    });
  } catch (_) {
    res = { ok: false };
  }

  if (!res || !res.ok || !Array.isArray(res.ids) || !res.ids.length) return result; // fallback: curated

  const liveList = res.ids;
  const liveSet = new Set(liveList);
  const filtered = models.filter(m => modelValueIsLive(m.value, liveSet, liveList));

  // Safeguard: if matching nuked everything (e.g. an unexpected ID format),
  // fall back to the curated list rather than show an empty menu.
  if (!filtered.length) return result;

  return { provider, models: filtered, savedModel, validated: true };
}

// Short, button-friendly label: drop the " — descriptor" suffix.
function shortModelLabel(label) {
  if (!label) return "";
  return String(label).split(" — ")[0].split(" – ")[0].trim();
}

// Find the display label for a model value among the validated list.
function modelLabelFor(value, models) {
  if (!value) return "Default model";
  const hit = (models || []).find(m => m.value === value);
  return hit ? shortModelLabel(hit.label) : value;
}

// Open a small floating menu of validated models anchored to `anchorEl`.
// Calls onPick(value, label) when the user chooses one. Themed via the
// --t-* CSS variables the host surface defines, so it matches every surface.
function openModelMenu(anchorEl, models, currentValue, onPick, menuTitle) {
  // Close any existing menu first
  document.querySelectorAll(".pp-model-menu").forEach(m => m.remove());

  if (!models || !models.length) return;

  const menu = document.createElement("div");
  menu.className = "pp-model-menu";
  menu.setAttribute("role", "listbox");
  menu.style.cssText = `
    position: fixed; z-index: 2147483647;
    min-width: 220px; max-width: 320px; max-height: 320px; overflow-y: auto;
    background: var(--t-surface, #fff); color: var(--t-text, #1a1226);
    border: 1px solid var(--t-panel-border, rgba(0,0,0,0.12));
    border-radius: 12px; padding: 6px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.06);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12.5px;
    scrollbar-width: thin;
    scrollbar-color: var(--t-ring, rgba(127,127,127,0.4)) transparent;
  `;

  const header = document.createElement("div");
  header.textContent = menuTitle || "Model — this session only";
  header.style.cssText = "padding:6px 8px 8px;font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;opacity:0.6;";
  menu.appendChild(header);

  models.forEach(m => {
    const item = document.createElement("button");
    item.type = "button";
    item.setAttribute("role", "option");
    const isActive = m.value === currentValue;
    item.setAttribute("aria-selected", isActive ? "true" : "false");
    item.style.cssText = `
      display:flex; align-items:center; gap:8px; width:100%; text-align:left;
      background:${isActive ? "var(--t-subtle, rgba(109,40,217,0.10))" : "transparent"};
      border:none; border-radius:8px; cursor:pointer;
      color:inherit; font-family:inherit; font-size:12.5px; font-weight:${isActive ? "700" : "500"};
      padding:8px 9px; line-height:1.3;
    `;
    item.innerHTML = `
      <span style="width:14px;flex-shrink:0;color:var(--t-ai-label,#7c3aed);">${isActive ? "✓" : ""}</span>
      <span style="flex:1;min-width:0;">${escapeModelHTML(m.label)}</span>`;
    item.addEventListener("mouseenter", () => { if (!isActive) item.style.background = "var(--t-subtle, rgba(109,40,217,0.08))"; });
    item.addEventListener("mouseleave", () => { if (!isActive) item.style.background = "transparent"; });
    item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      cleanup();
      onPick(m.value, shortModelLabel(m.label));
    });
    menu.appendChild(item);
  });

  // IMPORTANT: append to <body>, NOT inside #aw-popup. The popup uses a CSS
  // transform (open animation) + overflow:hidden, which would re-base and clip
  // our position:fixed menu so it never appears. Instead we copy the theme's
  // --t-* variables from the nearest themed ancestor onto the menu so it still
  // matches the active theme while living at the document root.
  const themeSrc = anchorEl.closest("#aw-popup") || anchorEl.closest("[data-theme]") || document.body;
  try {
    const cs = getComputedStyle(themeSrc);
    ["--t-surface", "--t-text", "--t-panel-bg", "--t-panel-border",
     "--t-subtle", "--t-ring", "--t-ai-label", "--t-accent-1", "--t-accent-2"].forEach(v => {
      const val = cs.getPropertyValue(v);
      if (val && val.trim()) menu.style.setProperty(v, val.trim());
    });
  } catch (_) {}
  document.body.appendChild(menu);

  // Position: prefer above the anchor (action bars sit at the bottom), aligned left.
  const ar = anchorEl.getBoundingClientRect();
  const mr = menu.getBoundingClientRect();
  let left = ar.left;
  if (left + mr.width > window.innerWidth - 8) left = window.innerWidth - mr.width - 8;
  if (left < 8) left = 8;
  let top = ar.top - mr.height - 6;
  if (top < 8) top = ar.bottom + 6; // not enough room above → drop below
  menu.style.left = left + "px";
  menu.style.top  = top + "px";

  function onDocDown(e) {
    if (!menu.contains(e.target) && e.target !== anchorEl && !anchorEl.contains(e.target)) cleanup();
  }
  function onKey(e) { if (e.key === "Escape") cleanup(); }
  function cleanup() {
    menu.remove();
    document.removeEventListener("mousedown", onDocDown, true);
    document.removeEventListener("keydown", onKey, true);
  }
  // Defer so the opening click doesn't immediately close it
  setTimeout(() => {
    document.addEventListener("mousedown", onDocDown, true);
    document.addEventListener("keydown", onKey, true);
  }, 0);
}

function escapeModelHTML(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ═══════════════════════════════════════════════════════════════════════════
// Update-available toast (shared by pop-out, side panel, and full tab).
// Reads the flag the background worker stores after a GitHub version check and,
// if a newer version is available (and not already dismissed for that version),
// shows a small non-blocking toast. Safe to call on every surface load.
// ═══════════════════════════════════════════════════════════════════════════
function maybeShowUpdateToast() {
  try {
    // Nudge a check in case the 24h window has elapsed (background rate-limits it).
    chrome.runtime.sendMessage({ action: "checkForUpdate" }, () => { void chrome.runtime.lastError; });

    chrome.storage.local.get(["penpalUpdate", "penpalUpdateDismissed"], (d) => {
      if (chrome.runtime.lastError) return;
      const u = d && d.penpalUpdate;
      if (!u || !u.available || !u.version) return;
      if (d.penpalUpdateDismissed === u.version) return; // user dismissed this one
      showUpdateToast(u);
    });
  } catch (_) { /* extension context gone — ignore */ }
}

function showUpdateToast(info) {
  if (document.getElementById("penpal-update-toast")) return; // already showing

  // Pull theme colors from the nearest themed element so the toast matches.
  const themeSrc = document.querySelector("#aw-popup, [data-theme]") || document.body;
  let cs = null;
  try { cs = getComputedStyle(themeSrc); } catch (_) {}
  const v = (name, fallback) => {
    const val = cs ? cs.getPropertyValue(name).trim() : "";
    return val || fallback;
  };
  const surface = v("--t-surface", "#ffffff");
  const text    = v("--t-text", "#1a1226");
  const accent1 = v("--t-accent-1", "#6d28d9");
  const accent2 = v("--t-accent-2", "#4f46e5");
  const onAccent = v("--t-on-accent", "#ffffff");
  const subLabel = v("--t-you-label", "#6b7280");
  const border  = v("--t-panel-border", "rgba(0,0,0,0.12)");

  const toast = document.createElement("div");
  toast.id = "penpal-update-toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.style.cssText = `
    position: fixed; top: 16px; right: 16px; z-index: 2147483647;
    width: 270px; max-width: calc(100vw - 32px);
    background: ${surface}; color: ${text};
    border: 1px solid ${border}; border-radius: 14px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.05);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    padding: 13px 14px 14px; overflow: hidden;
    opacity: 0; transform: translateY(-8px);
    transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.34,1.3,0.64,1);
  `;

  const notesHTML = info.notes
    ? `<div style="font-size:11.5px;line-height:1.4;color:${subLabel};margin:2px 0 10px;">${escapeModelHTML(info.notes)}</div>`
    : `<div style="height:8px"></div>`;

  toast.innerHTML = `
    <button id="penpal-update-x" aria-label="Dismiss" style="
      position:absolute;top:8px;right:9px;border:none;background:transparent;
      color:${subLabel};font-size:15px;line-height:1;cursor:pointer;padding:2px;">&times;</button>
    <div style="display:flex;align-items:center;gap:7px;font-size:13px;font-weight:700;margin-bottom:3px;">
      <span style="display:inline-flex;width:18px;height:18px;color:${accent1};">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21 3 21 9 15 9"/></svg>
      </span>
      Update Available
    </div>
    <div style="font-size:12px;margin:0 0 2px;">PenPal v${escapeModelHTML(info.version)} is ready to install</div>
    ${notesHTML}
    <button id="penpal-update-view" style="
      width:100%;border:none;border-radius:9px;cursor:pointer;
      background:linear-gradient(135deg, ${accent1} 0%, ${accent2} 100%);
      color:${onAccent};font-family:inherit;font-size:12.5px;font-weight:700;
      padding:8px 10px;">View Update</button>
  `;

  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = "1"; toast.style.transform = "translateY(0)"; });

  let dismissed = false;
  const remove = () => {
    if (dismissed) return;
    dismissed = true;
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-8px)";
    setTimeout(() => toast.remove(), 240);
  };

  // Auto-dismiss after ~9s unless the user is hovering/interacting.
  let timer = setTimeout(remove, 9000);
  toast.addEventListener("mouseenter", () => clearTimeout(timer));
  toast.addEventListener("mouseleave", () => { timer = setTimeout(remove, 4000); });

  toast.querySelector("#penpal-update-view").addEventListener("click", () => {
    const url = info.downloadUrl || "https://github.com/cwland/penpal-ai/releases";
    try {
      chrome.runtime.sendMessage({ action: "openUrl", url }, () => { void chrome.runtime.lastError; });
    } catch (_) {
      try { window.open(url, "_blank", "noopener"); } catch (_) {}
    }
    remove();
  });

  // Explicit close stops this version from nagging again.
  toast.querySelector("#penpal-update-x").addEventListener("click", () => {
    try { chrome.storage.local.set({ penpalUpdateDismissed: info.version }); } catch (_) {}
    clearTimeout(timer);
    remove();
  });
}

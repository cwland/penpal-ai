// penpal-settings-models.js — Settings → AI Models → "My Models".
//
// One ordered list of models (top = default, the rest are automatic backups),
// and one "Add model" flow that enforces:
//   1. choose provider → 2. connect + Validate → 3. pick a model from the
//   provider's live list → 4. Test → Save.
// Built-in providers, custom endpoints and local servers all use this flow.
//
// Uses globals from penpal-ai-config.js (data model + helpers) and
// penpal-settings.js (PROVIDER_INFO, PROVIDER_ENDPOINTS, PROVIDER_GLYPHS,
// PROVIDER_TEMPLATES, PROVIDER_ICON_LIBRARY, escapeHTML, openIconPicker,
// originPatternForURL, renderProviderDebugBubble).

const MM_NEW_CUSTOM = "__new_custom__";

let mmModels = [];        // aiModels
let mmConnections = {};   // aiConnections
let mmKeys = {};          // apiKeys
let mmDraft = null;       // the Add/Edit card's state, or null when closed
let mmDragIndex = null;

const $mm = (id) => document.getElementById(id);

function mmSend(message) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(message, (res) => {
        if (chrome.runtime.lastError) resolve({ success: false, ok: false, error: chrome.runtime.lastError.message });
        else resolve(res || { success: false, ok: false, error: "No response" });
      });
    } catch (e) {
      resolve({ success: false, ok: false, error: e.message });
    }
  });
}

function mmPersist() {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ aiModels: mmModels, aiConnections: mmConnections, apiKeys: mmKeys }, () => resolve());
  });
}

function mmShow(el, type, text) {
  el.textContent = text;
  el.className = "test-result " + type;
  el.style.display = text ? "block" : "none";
}

// ── Load ────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(null, (data) => {
    data = data || {};
    const needsMigration = !Array.isArray(data.aiModels);
    mmModels = resolveAiModels(data);
    mmConnections = resolveAiConnections(data);
    mmKeys = resolveApiKeys(data);
    if (needsMigration) mmPersist();
    mmRenderList();
  });

  $mm("mm-add-btn").addEventListener("click", () => mmOpenCard(null));
  $mm("mm-cancel-btn").addEventListener("click", mmCloseCard);
  $mm("mm-validate-btn").addEventListener("click", mmValidate);
  $mm("mm-test-btn").addEventListener("click", mmTestDraft);
  $mm("mm-save-btn").addEventListener("click", mmSave);
  $mm("mm-model-search").addEventListener("input", mmRenderModelOptions);
  $mm("mm-model-select").addEventListener("change", (e) => mmPickModel(e.target.value));
  $mm("mm-model-manual").addEventListener("input", (e) => mmPickModel(e.target.value.trim()));

  // Anything typed into the connection fields invalidates validation.
  ["mm-key", "mm-endpoint", "mm-format"].forEach(id =>
    $mm(id).addEventListener(id === "mm-format" ? "change" : "input", () => mmResetFrom(2)));
  $mm("mm-name").addEventListener("input", () => { if (mmDraft) mmDraft.name = $mm("mm-name").value; });

  $mm("mm-icon-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    openIconPicker(btn, PROVIDER_ICON_LIBRARY, (emoji) => {
      btn.dataset.emoji = emoji;
      btn.textContent = emoji;
      if (mmDraft) mmDraft.icon = emoji;
    });
  });

  $mm("provider-debug-toggle")?.addEventListener("click", () => {
    const body = $mm("provider-debug-body");
    const open = body.style.display !== "block";
    body.style.display = open ? "block" : "none";
    $mm("provider-debug-caret").classList.toggle("open", open);
  });
});

// ── My Models list ──────────────────────────────────────────────────────────

function mmIconFor(entry) {
  if (entry.source === "custom") return (mmConnections[entry.provider] || {}).icon || "🤖";
  return PROVIDER_GLYPHS[entry.provider] || "●";
}

function mmRenderList() {
  const list = $mm("mm-list");
  $mm("mm-empty").style.display = mmModels.length ? "none" : "block";
  document.getElementById("setup-banner")?.classList.toggle("visible", !mmModels.length);

  list.innerHTML = mmModels.map((m, i) => `
    <div class="mm-row" draggable="true" data-index="${i}">
      <span class="mm-handle" title="Drag to reorder">⠿</span>
      <span class="mm-pos">${i + 1}</span>
      <span class="mm-icon">${escapeHTML(mmIconFor(m))}</span>
      <span class="mm-name"><span class="mm-provider">${escapeHTML(providerDisplayName(m.provider, mmConnections))} · </span>${escapeHTML(m.label)}</span>
      <span class="mm-tag ${i === 0 ? "default" : ""}">${i === 0 ? "Default" : "Backup"}</span>
      <button class="mm-row-btn" data-act="up" ${i === 0 ? "disabled" : ""} title="Move up" aria-label="Move ${escapeHTML(m.label)} up">↑</button>
      <button class="mm-row-btn" data-act="down" ${i === mmModels.length - 1 ? "disabled" : ""} title="Move down" aria-label="Move ${escapeHTML(m.label)} down">↓</button>
      <button class="mm-row-btn" data-act="test" title="Test this model">Test</button>
      <button class="mm-row-btn" data-act="edit" title="Edit">✎</button>
      <button class="mm-row-btn" data-act="delete" title="Remove">🗑</button>
    </div>`).join("");

  list.querySelectorAll(".mm-row").forEach(row => {
    const i = Number(row.dataset.index);
    row.querySelectorAll(".mm-row-btn").forEach(btn => btn.addEventListener("click", () => mmRowAction(btn, i)));

    row.addEventListener("dragstart", (e) => { mmDragIndex = i; row.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; });
    row.addEventListener("dragend", () => { mmDragIndex = null; row.classList.remove("dragging"); });
    row.addEventListener("dragover", (e) => { e.preventDefault(); row.classList.add("drop-target"); });
    row.addEventListener("dragleave", () => row.classList.remove("drop-target"));
    row.addEventListener("drop", (e) => {
      e.preventDefault();
      row.classList.remove("drop-target");
      if (mmDragIndex === null || mmDragIndex === i) return;
      mmMove(mmDragIndex, i);
    });
  });
}

function mmMove(from, to) {
  mmModels = moveModelEntry(mmModels, from, to);
  mmPersist().then(() => {
    mmRenderList();
    mmShow($mm("mm-list-msg"), "success", `✓ ${mmModels[0].label} is now your default.`);
  });
}

async function mmRowAction(btn, i) {
  const entry = mmModels[i];
  const act = btn.dataset.act;
  if (act === "up") return mmMove(i, i - 1);
  if (act === "down") return mmMove(i, i + 1);
  if (act === "edit") return mmOpenCard(entry);
  if (act === "delete") {
    // Two-step delete: first click arms the button for a few seconds.
    if (!btn.classList.contains("confirm")) {
      btn.classList.add("confirm");
      btn.textContent = "Remove?";
      setTimeout(() => { btn.classList.remove("confirm"); btn.textContent = "🗑"; }, 3000);
      return;
    }
    const state = removeModelEntry({ aiModels: mmModels, aiConnections: mmConnections, apiKeys: mmKeys }, entry.id);
    mmModels = state.aiModels; mmConnections = state.aiConnections; mmKeys = state.apiKeys;
    await mmPersist();
    mmRenderList();
    mmShow($mm("mm-list-msg"), "success", `Removed ${entry.label}.` + (i === 0 && mmModels.length ? ` ${mmModels[0].label} is now your default.` : ""));
    return;
  }
  if (act === "test") {
    btn.disabled = true; btn.textContent = "…";
    const settings = requestSettingsFor(entry, { aiConnections: mmConnections, apiKeys: mmKeys });
    const res = settings ? await mmCallTest(settings) : { success: false, error: "Connection settings are missing — edit this model." };
    btn.disabled = false; btn.textContent = "Test";
    if (res.success) {
      mmModels = mmModels.map(m => m.id === entry.id ? { ...m, testedAt: Date.now() } : m);
      mmPersist();
      mmShow($mm("mm-list-msg"), "success", `✓ ${entry.label} is working.`);
    } else {
      mmShow($mm("mm-list-msg"), "error", `✕ ${entry.label} failed: ${res.error}`);
    }
  }
}

function mmCallTest(settings, debug = false) {
  return mmSend({
    action: "callAI",
    debug,
    text: "Respond with the word 'Ready' if you can read this.",
    settings: { ...settings, systemPrompt: "You are a connection test. Respond with only the word: Ready" }
  });
}

// ── Add / Edit card ─────────────────────────────────────────────────────────

function mmOpenCard(entry) {
  mmDraft = {
    editingId: entry ? entry.id : null,
    source: null, provider: null,
    name: "", icon: "🤖", endpoint: "", apiFormat: "openai",
    ids: [], options: [], model: entry ? entry.model : null, manual: false,
    validated: false, tested: false
  };
  $mm("mm-add-title").textContent = entry ? `Edit ${entry.label}` : "Add a model";
  $mm("mm-add-card").style.display = "block";
  mmRenderProviderPills();
  if (entry) {
    mmSelectProvider(entry.source === "custom" ? entry.provider : entry.provider, { keepModel: true });
  } else {
    mmResetFrom(1);
  }
  $mm("mm-add-card").scrollIntoView({ behavior: "smooth", block: "start" });
}

function mmCloseCard() {
  mmDraft = null;
  $mm("mm-add-card").style.display = "none";
}

function mmRenderProviderPills() {
  const pills = $mm("mm-provider-pills");
  const builtins = Object.keys(PROVIDER_NAMES).map(id => `
    <div class="provider-pill" data-provider="${id}">
      <span class="provider-logo logo-${id}">${escapeHTML(PROVIDER_GLYPHS[id] || "●")}</span>${escapeHTML(PROVIDER_NAMES[id])}
    </div>`).join("");
  const customs = Object.entries(mmConnections).map(([id, c]) => `
    <div class="provider-pill" data-provider="${escapeHTML(id)}">
      <span class="provider-logo logo-custom">${escapeHTML(c.icon || "🤖")}</span>${escapeHTML(c.name)}
    </div>`).join("");
  pills.innerHTML = builtins + customs + `
    <div class="provider-pill" data-provider="${MM_NEW_CUSTOM}">
      <span class="provider-logo logo-custom">🖥️</span>Local / custom server
    </div>`;
  pills.querySelectorAll(".provider-pill").forEach(p =>
    p.addEventListener("click", () => mmSelectProvider(p.dataset.provider)));
}

function mmSelectProvider(id, { keepModel = false } = {}) {
  const d = mmDraft;
  if (!keepModel) d.model = null;
  d.provider = id;
  d.source = PROVIDER_NAMES[id] ? "builtin" : "custom";
  const conn = mmConnections[id];
  if (id === MM_NEW_CUSTOM) {
    Object.assign(d, { name: "", icon: "🤖", endpoint: "", apiFormat: "openai" });
  } else if (conn) {
    Object.assign(d, { name: conn.name, icon: conn.icon || "🤖", endpoint: conn.endpoint, apiFormat: conn.apiFormat || "openai" });
  }

  $mm("mm-provider-pills").querySelectorAll(".provider-pill").forEach(p =>
    p.classList.toggle("active", p.dataset.provider === id));

  // Provider info + recommendations (built-ins only)
  const info = $mm("mm-provider-info");
  const recs = $mm("mm-recs");
  if (d.source === "builtin") {
    const pi = PROVIDER_INFO[id] || {};
    info.classList.add("visible");
    info.innerHTML = `<strong>${escapeHTML(PROVIDER_NAMES[id])}</strong> — ${pi.desc || ""}` +
      (pi.url ? `<br><a href="${pi.url}" target="_blank">→ ${escapeHTML(pi.urlLabel || "Get an API key")}</a>` : "");
    const list = MODEL_RECOMMENDATIONS[id] || [];
    const badgeClass = { best: "badge-best", fast: "badge-fast", free: "badge-free", value: "badge-value" };
    recs.innerHTML = list.length
      ? `<div class="hint" style="margin:0">Suggested models (you'll pick after validating your key):</div>` +
        list.map(r => `<div class="model-rec-row"><span class="model-badge ${badgeClass[r.badge] || "badge-value"}">${escapeHTML(r.label)}</span><span>${escapeHTML(r.note)}</span></div>`).join("")
      : "";
  } else {
    info.classList.add("visible");
    info.innerHTML = id === MM_NEW_CUSTOM
      ? `<strong>Local / custom server</strong> — a model server on this computer or your network (Apple Foundation Models, Ollama, LM Studio, llama.cpp, vLLM…) or any OpenAI- or Anthropic-compatible endpoint. Chrome will ask to allow access to its address.`
      : `<strong>${escapeHTML(d.name)}</strong> — ${escapeHTML(d.endpoint)}`;
    recs.innerHTML = "";
  }

  // Step 2 fields
  const custom = d.source === "custom";
  $mm("mm-custom-fields").style.display = custom ? "block" : "none";
  $mm("mm-key-label").textContent = custom ? "API KEY (optional — most local servers don't need one)" : `API KEY — ${PROVIDER_NAMES[id]}`;
  $mm("mm-key").placeholder = custom ? "Leave blank if your server doesn't need one" : "Paste your API key here…";
  $mm("mm-key").value = mmKeys[id] || "";
  $mm("mm-name").value = d.name;
  $mm("mm-endpoint").value = d.endpoint;
  $mm("mm-format").value = d.apiFormat;
  $mm("mm-icon-btn").dataset.emoji = d.icon;
  $mm("mm-icon-btn").textContent = d.icon;
  // Editing an existing connection's endpoint here would silently change other
  // models that share it, so its fields are read-only; add a new server instead.
  const locked = custom && id !== MM_NEW_CUSTOM;
  ["mm-name", "mm-endpoint", "mm-format"].forEach(f => { $mm(f).disabled = locked; });
  $mm("mm-icon-btn").disabled = locked;
  mmRenderTemplates(id === MM_NEW_CUSTOM);

  mmResetFrom(2);
  mmSetStep(2, "open");
}

function mmRenderTemplates(show) {
  const row = $mm("mm-templates");
  row.parentElement.style.display = show ? "block" : "none";
  if (!show) return;
  row.innerHTML = PROVIDER_TEMPLATES.map((t, i) =>
    `<button type="button" class="template-btn" data-i="${i}">${escapeHTML(t.icon)} ${escapeHTML(t.label)}</button>`).join("");
  row.querySelectorAll(".template-btn").forEach(b => b.addEventListener("click", () => {
    const t = PROVIDER_TEMPLATES[Number(b.dataset.i)];
    Object.assign(mmDraft, { name: t.name, icon: t.icon, endpoint: t.endpoint, apiFormat: t.apiFormat });
    $mm("mm-name").value = t.name;
    $mm("mm-endpoint").value = t.endpoint;
    $mm("mm-format").value = t.apiFormat;
    $mm("mm-icon-btn").dataset.emoji = t.icon;
    $mm("mm-icon-btn").textContent = t.icon;
    mmResetFrom(2);
    mmShow($mm("mm-validate-result"), "warn", t.description + " Adjust the port if yours differs, then click Validate.");
  }));
}

// Steps: "locked" | "open" | "done"
function mmSetStep(n, state) {
  const el = $mm(`mm-step-${n}`);
  el.classList.toggle("locked", state === "locked");
  el.classList.toggle("done", state === "done");
}

// Changing step N invalidates everything after it.
function mmResetFrom(n) {
  const d = mmDraft;
  if (!d) return;
  if (n <= 1) {
    d.provider = null;
    $mm("mm-provider-pills").querySelectorAll(".provider-pill").forEach(p => p.classList.remove("active"));
    $mm("mm-provider-info").classList.remove("visible");
    $mm("mm-recs").innerHTML = "";
    mmSetStep(2, "locked");
  }
  if (n <= 2) {
    d.validated = false; d.ids = []; d.options = []; d.manual = false;
    mmShow($mm("mm-validate-result"), "", "");
    mmSetStep(3, "locked");
    $mm("mm-model-select").innerHTML = "";
    $mm("mm-model-search").value = "";
    $mm("mm-manual-wrap").style.display = "none";
    $mm("mm-model-hint").textContent = "";
  }
  if (n <= 3) {
    d.tested = false;
    mmShow($mm("mm-test-result"), "", "");
    renderProviderDebugBubble(null);
    mmSetStep(4, "locked");
  }
  mmUpdateSave();
}

function mmUpdateSave() {
  const ready = !!(mmDraft && mmDraft.validated && mmDraft.model && mmDraft.tested);
  $mm("mm-save-btn").disabled = !ready;
  $mm("mm-save-hint").textContent = ready ? "" : "Validate, pick a model, and pass the test to save.";
}

// Endpoint/format/key exactly as the validate & test calls need them.
function mmConnectionFromForm() {
  const d = mmDraft;
  const key = $mm("mm-key").value.trim();
  if (d.source === "builtin") return { provider: d.provider, apiKey: key };
  const endpoint = $mm("mm-endpoint").value.trim();
  const apiFormat = $mm("mm-format").value;
  const provider = d.provider === MM_NEW_CUSTOM ? "__mm_draft__" : d.provider;
  return { provider, apiKey: key, endpoint, apiFormat };
}

function mmValidate() {
  const d = mmDraft;
  if (!d || !d.provider) return;
  mmResetFrom(2);
  const conn = mmConnectionFromForm();
  const resultEl = $mm("mm-validate-result");

  const run = async () => {
    const btn = $mm("mm-validate-btn");
    btn.disabled = true; btn.textContent = "Checking…";
    const res = await mmSend({ action: "validateConnection", ...conn });
    btn.disabled = false; btn.textContent = "Validate";
    if (!mmDraft || mmDraft !== d) return;

    if (res.ok) {
      d.validated = true;
      d.ids = res.ids;
      d.options = buildModelOptions(d.provider === MM_NEW_CUSTOM ? "" : d.provider, res.ids, d.source);
      mmShow(resultEl, "success", `✓ Connected · ${d.options.length} model${d.options.length === 1 ? "" : "s"} available.`);
      mmSetStep(2, "done");
      mmSetStep(3, "open");
      mmRenderModelOptions();
      // Pre-select: the model being edited, else the top recommendation.
      const pre = d.options.find(o => o.value === d.model) || d.options.find(o => o.rec);
      mmPickModel(pre ? pre.value : null);
    } else if (res.manualModel) {
      d.validated = true;
      d.manual = true;
      mmShow(resultEl, "warn", "⚠ " + res.error);
      mmSetStep(2, "done");
      mmSetStep(3, "open");
      $mm("mm-manual-wrap").style.display = "block";
      $mm("mm-model-manual").value = d.model || "";
      mmPickModel(d.model || null);
    } else {
      mmShow(resultEl, "error", "✕ " + res.error);
    }
    mmUpdateSave();
  };

  if (d.source === "custom") {
    const pattern = originPatternForURL(conn.endpoint);
    if (!pattern) { mmShow(resultEl, "error", "⚠ Enter a valid endpoint URL starting with http:// or https://"); return; }
    if (d.provider === MM_NEW_CUSTOM && !$mm("mm-name").value.trim()) { mmShow(resultEl, "error", "⚠ Give this server a name."); return; }
    // Must be called directly from the click for Chrome to show its prompt.
    chrome.permissions.request({ origins: [pattern] }, (granted) => {
      if (!granted) { mmShow(resultEl, "error", "⚠ Chrome needs permission to reach this address. Click Validate again and choose Allow."); return; }
      run();
    });
  } else {
    run();
  }
}

function mmRenderModelOptions() {
  const d = mmDraft;
  if (!d) return;
  const q = $mm("mm-model-search").value.trim().toLowerCase();
  const sel = $mm("mm-model-select");
  const shown = d.options.filter(o => !q || o.value.toLowerCase().includes(q) || o.label.toLowerCase().includes(q));
  sel.innerHTML = shown.map(o => {
    const text = o.rec ? `★ ${o.rec.label} — ${o.label}` : (o.label === o.value ? o.value : `${o.label}  (${o.value})`);
    return `<option value="${escapeHTML(o.value)}">${escapeHTML(text)}</option>`;
  }).join("");
  if (d.model && shown.some(o => o.value === d.model)) sel.value = d.model;
  $mm("mm-model-hint").textContent = q && !shown.length ? "No models match your search." :
    (d.options.some(o => o.rec) ? "★ = suggested for writing." : "");
}

function mmPickModel(value) {
  const d = mmDraft;
  if (!d) return;
  d.model = value || null;
  mmResetFrom(3);
  if (d.model) mmSetStep(4, "open");
}

async function mmTestDraft() {
  const d = mmDraft;
  if (!d || !d.model) return;
  const conn = mmConnectionFromForm();
  const settings = d.source === "builtin"
    ? { provider: conn.provider, apiKey: conn.apiKey, model: d.model }
    : { provider: conn.provider, apiKey: conn.apiKey, model: d.model, endpointOverrides: { [conn.provider]: conn.endpoint }, apiFormat: conn.apiFormat };

  const btn = $mm("mm-test-btn");
  btn.disabled = true; btn.textContent = "Testing…";
  const started = Date.now();
  const res = await mmCallTest(settings, true);
  btn.disabled = false; btn.textContent = "Test model";
  if (mmDraft !== d) return;

  const secs = ((Date.now() - started) / 1000).toFixed(1);
  if (res.success && res.result) {
    d.tested = true;
    mmSetStep(4, "done");
    mmShow($mm("mm-test-result"), "success", `✓ ${d.model} replied "${String(res.result).slice(0, 40)}" in ${secs}s.`);
  } else {
    d.tested = false;
    mmShow($mm("mm-test-result"), "error", `✕ Test failed: ${res.error || "empty reply"}`);
  }
  renderProviderDebugBubble(res.debug || null);
  mmUpdateSave();
}

async function mmSave() {
  const d = mmDraft;
  if (!d || !d.validated || !d.model || !d.tested) return;
  const key = $mm("mm-key").value.trim();

  let provider = d.provider;
  if (d.provider === MM_NEW_CUSTOM) {
    provider = makeAiId("c");
    mmConnections = { ...mmConnections, [provider]: {
      name: $mm("mm-name").value.trim(), icon: $mm("mm-icon-btn").dataset.emoji || "🤖",
      endpoint: $mm("mm-endpoint").value.trim(), apiFormat: $mm("mm-format").value } };
  }

  const entry = {
    id: d.editingId || makeAiId("m"),
    source: d.source, provider, model: d.model,
    label: d.source === "builtin" ? modelDisplayLabel(provider, d.model) : d.model,
    testedAt: Date.now()
  };
  const res = addModelEntry(mmModels, entry, { replaceId: d.editingId || undefined });
  if (!res.ok) { mmShow($mm("mm-test-result"), "error", "✕ " + res.error); return; }

  const before = mmModels;
  mmModels = res.list;
  mmKeys = { ...mmKeys };
  if (key) mmKeys[provider] = key; else delete mmKeys[provider];

  // An edit may have moved a model off a provider; drop keys/servers nothing uses now.
  const old = d.editingId && before.find(m => m.id === d.editingId);
  if (old && old.provider !== provider && !mmModels.some(m => m.provider === old.provider)) {
    delete mmKeys[old.provider];
    const { [old.provider]: _gone, ...rest } = mmConnections;
    mmConnections = rest;
  }

  await mmPersist();
  const wasEdit = !!d.editingId;
  mmCloseCard();
  mmRenderList();
  const pos = mmModels.findIndex(m => m.id === entry.id);
  mmShow($mm("mm-list-msg"), "success", wasEdit
    ? `✓ Saved ${entry.label}.`
    : `✓ Added ${entry.label}` + (pos === 0 ? " as your default." : ` as backup #${pos + 1}. Drag it to the top to make it your default.`));
}

// penpal-models.js — shared, validated model presets + session model picker
// Loaded by the popup/pop-out, the full tab, and the content script so all
// surfaces can offer a "change model for this session" control that lists only
// models validated to work for the user's default provider.
//

// The session model picker lists the user's My Models entries in order (top =
// default). Each item's value is the entry id; the background falls back down
// the rest of the list automatically. Requires penpal-ai-config.js.
async function getMyModels() {
  const data = await new Promise(r => {
    try { chrome.storage.sync.get(null, d => r(chrome.runtime.lastError ? {} : (d || {}))); }
    catch (_) { r({}); }
  });
  const conns = resolveAiConnections(data);
  const models = resolveAiModels(data).map(m => ({
    value: m.id,
    label: `${m.label} — ${providerDisplayName(m.provider, conns)}`
  }));
  return { models, savedModel: models[0] ? models[0].value : null };
}

// Small muted line under a reply when a backup model answered.
function showFallbackNotice(turnEl, notice) {
  if (!turnEl || !notice) return;
  const el = document.createElement("div");
  el.className = "penpal-fallback-notice";
  el.textContent = "↪ " + notice;
  el.style.cssText = "margin-top:6px;font-size:11px;line-height:1.4;opacity:.7;";
  turnEl.appendChild(el);
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

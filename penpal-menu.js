// PenPal AI — extension-icon control menu.
// This popup is a pure launcher: Settings, Pop-Out, Full Screen, Side Panel.
// It contains NO chat interface — the chat lives in the pop-out window,
// the full browser tab, and the docked side panel (all reuse the same UI).

document.addEventListener("DOMContentLoaded", () => {
  // ── Apply the user's theme so the menu matches the rest of PenPal ──────────
  try {
    chrome.storage.sync.get(["theme"], (data) => {
      if (chrome.runtime.lastError) return;
      document.body.setAttribute("data-theme", (data && data.theme) || "default");
    });
  } catch (_) { /* storage unavailable — keep default theme */ }

  // Show the current extension version next to the branding.
  try {
    const vEl = document.getElementById("pm-version");
    if (vEl) vEl.textContent = "v" + chrome.runtime.getManifest().version;
  } catch (_) {}

  const note = document.getElementById("pm-note");
  const showNote = (msg) => { if (note) { note.textContent = msg; note.classList.add("show"); } };

  // ── Settings ───────────────────────────────────────────────────────────────
  document.getElementById("pm-settings").addEventListener("click", () => {
    try { chrome.runtime.openOptionsPage(); } catch (_) {}
    window.close();
  });

  // ── Full Screen (existing full browser tab) ─────────────────────────────────
  document.getElementById("pm-fullscreen").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "openTab" }, () => {
      if (chrome.runtime.lastError) { /* context gone */ }
      window.close();
    });
  });

  // ── Pop-Out (standalone window) ─────────────────────────────────────────────
  document.getElementById("pm-popout").addEventListener("click", async () => {
    let liveSelection = "";
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        const [{ result }] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => window.getSelection()?.toString().trim() || ""
        });
        liveSelection = result || "";
      }
    } catch (_) { /* restricted page — no selection available */ }

    const hasSel = liveSelection.length > 2;
    const draft = {
      inputText: hasSel ? liveSelection : "",
      hadPageSelection: hasSel,
      errorText: ""
    };
    chrome.runtime.sendMessage({ action: "openPopout", draft }, (res) => {
      if (chrome.runtime.lastError) return;
      if (res?.success) window.close();
    });
  });

  // ── Side Panel toggle (same docked panel as the floating launcher) ──────────
  document.getElementById("pm-sidepanel").addEventListener("click", async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) { showNote("No active tab to open the panel on."); return; }
      chrome.tabs.sendMessage(tab.id, { action: "toggleSidePanel" }, () => {
        if (chrome.runtime.lastError) {
          // Content script isn't injected here (chrome:// pages, the Web Store,
          // PDF viewer, etc.) — the side panel can't run on this page.
          showNote("The side panel isn't available on this page. Try it on a normal website.");
          return;
        }
        window.close();
      });
    } catch (_) {
      showNote("The side panel isn't available on this page.");
    }
  });

  // ── Keyboard accessibility: arrow-key navigation + autofocus ────────────────
  const items = Array.from(document.querySelectorAll(".pm-item"));
  items[0]?.focus();
  document.addEventListener("keydown", (e) => {
    const idx = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[(idx + 1 + items.length) % items.length]?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); items[(idx - 1 + items.length) % items.length]?.focus(); }
    else if (e.key === "Escape") { window.close(); }
  });
});

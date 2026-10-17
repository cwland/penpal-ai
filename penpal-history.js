// PenPal AI — Rewrite History window.
// Shows every saved rewrite (oldest → newest) from chrome.storage.local.
// "Copy" copies the corrected text; "Edit" sends text back to the input box of
// the PenPal view that opened this window (via the background worker).

const HISTORY_KEY = "penpalHistory";

const listEl      = document.getElementById("chat-history");
const placeholder = document.getElementById("chat-placeholder");
const countEl     = document.getElementById("hist-count");
const clearBtn    = document.getElementById("hist-clear");
const toastEl     = document.getElementById("hist-toast");
const searchForm  = document.getElementById("hist-search");
const searchInput = document.getElementById("hist-search-input");
const searchClear = document.getElementById("hist-search-clear");
const placeholderTitle = placeholder.querySelector("h3");
const placeholderText  = placeholder.querySelector("p");
const PLACEHOLDER_TITLE = placeholderTitle.textContent;
const PLACEHOLDER_TEXT  = placeholderText.textContent;

// ── Theme ──
chrome.storage.sync.get(["theme"], (d) => {
  if (!chrome.runtime.lastError) document.body.setAttribute("data-theme", (d && d.theme) || "default");
});

// ── Rendering ──
function escapeHTML(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function dayLabel(ts) {
  const d = new Date(ts);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const that  = new Date(d); that.setHours(0, 0, 0, 0);
  const diff = Math.round((today - that) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    year: d.getFullYear() === today.getFullYear() ? undefined : "numeric"
  });
}

function timeLabel(ts) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

// Escape text and wrap every case-insensitive match of the active search in <mark>.
function highlight(text, q) {
  const s = String(text ?? "");
  if (!q) return escapeHTML(s);
  const lower = s.toLowerCase();
  let out = "", i = 0, at;
  while ((at = lower.indexOf(q, i)) !== -1) {
    out += escapeHTML(s.slice(i, at)) + `<mark class="hist-hit">${escapeHTML(s.slice(at, at + q.length))}</mark>`;
    i = at + q.length;
  }
  return out + escapeHTML(s.slice(i));
}

function entryHTML(e) {
  const q = searchQuery;
  const meta = [e.toneLabel || e.tone, e.language].filter(Boolean).map(m => highlight(m, q)).join(" · ");
  return `
    <div class="hist-entry" data-id="${escapeHTML(e.id)}">
      <div class="chat-turn chat-turn-you">
        <div class="chat-turn-content">
          <div class="chat-you-header">
            <div class="chat-bubble-label">You wrote <span class="hist-time">· ${escapeHTML(timeLabel(e.ts))}</span></div>
          </div>
          <div class="chat-bubble chat-you-bubble">${highlight(e.input, q)}</div>
          <div class="chat-actions">
            <button class="chat-btn" data-act="edit-input" title="Load your original text into PenPal's input">&#9998; Edit</button>
          </div>
        </div>
      </div>
      <div class="chat-turn chat-turn-ai">
        <div class="chat-turn-content">
          <div class="chat-ai-header">
            <div class="chat-bubble-label chat-ai-label">PenPal Suggests${meta ? ` <span class="hist-time">· ${meta}</span>` : ""}</div>
          </div>
          <div class="chat-bubble chat-ai-bubble">${highlight(e.output, q)}</div>
          <div class="chat-actions">
            <button class="chat-btn" data-act="edit-output" title="Load the corrected text into PenPal's input">&#9998; Edit</button>
            <button class="chat-btn" data-act="copy" title="Copy the corrected text">&#128203; Copy</button>
          </div>
        </div>
      </div>
    </div>`;
}

let entries = [];
let searchQuery = ""; // lower-cased active search ("" = show everything)

function matchesSearch(e) {
  if (!searchQuery) return true;
  return [e.input, e.output, e.toneLabel || e.tone, e.language]
    .some(v => String(v ?? "").toLowerCase().includes(searchQuery));
}

function render({ keepScroll = false } = {}) {
  const prevBottomGap = listEl.scrollHeight - listEl.scrollTop;
  listEl.querySelectorAll(".hist-entry, .hist-day").forEach(n => n.remove());

  const shown = entries.filter(matchesSearch);
  const noun = n => `rewrite${n === 1 ? "" : "s"}`;

  placeholder.style.display = shown.length ? "none" : "";
  if (searchQuery && entries.length) {
    placeholderTitle.textContent = "No matches";
    placeholderText.textContent  = "Nothing in your history contains that text. Try a different search, or hit Clear.";
  } else {
    placeholderTitle.textContent = PLACEHOLDER_TITLE;
    placeholderText.textContent  = PLACEHOLDER_TEXT;
  }
  clearBtn.disabled = !entries.length;
  countEl.textContent = !entries.length ? "PenPal AI"
    : searchQuery ? `${shown.length} of ${entries.length} ${noun(entries.length)} match`
    : `${entries.length} saved ${noun(entries.length)}`;

  let html = "", lastDay = "";
  for (const e of shown) {
    const day = dayLabel(e.ts);
    if (day !== lastDay) { html += `<div class="hist-day">${escapeHTML(day)}</div>`; lastDay = day; }
    html += entryHTML(e);
  }
  listEl.insertAdjacentHTML("beforeend", html);

  // Newest is at the bottom — start there. On live updates, keep the user's
  // place unless they were already at the bottom.
  if (keepScroll && prevBottomGap > listEl.clientHeight + 40) {
    listEl.scrollTop = listEl.scrollHeight - prevBottomGap;
  } else {
    listEl.scrollTop = listEl.scrollHeight;
  }
}

function load(opts) {
  chrome.storage.local.get(HISTORY_KEY, (d) => {
    entries = (d && Array.isArray(d[HISTORY_KEY])) ? d[HISTORY_KEY] : [];
    entries.sort((a, b) => a.ts - b.ts);
    render(opts);
  });
}

// ── Actions ──
let toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
}

listEl.addEventListener("click", async (ev) => {
  const btn = ev.target.closest(".chat-btn");
  if (!btn) return;
  const id = btn.closest(".hist-entry")?.dataset.id;
  const e = entries.find(x => x.id === id);
  if (!e) return;

  if (btn.dataset.act === "copy") {
    try {
      await navigator.clipboard.writeText(e.output);
      btn.textContent = "✓ Copied!";
    } catch {
      btn.textContent = "⚠ Failed";
    }
    setTimeout(() => btn.innerHTML = "&#128203; Copy", 1800);
    return;
  }

  const text = btn.dataset.act === "edit-input" ? e.input : e.output;
  chrome.runtime.sendMessage({ action: "historyEdit", text }, (res) => {
    if (chrome.runtime.lastError || !res?.success) { toast("Couldn't send to PenPal"); return; }
    toast(res.delivered ? "Sent to PenPal's input" : "Opened in a new PenPal tab");
  });
});

// ── Search ──
// Enter or the Search button filters to entries containing the text (case-
// insensitive, in either the original or the corrected text). Clear resets.
function applySearch(raw) {
  searchQuery = String(raw ?? "").trim().toLowerCase();
  searchClear.disabled = !searchQuery && !searchInput.value;
  render();
}
searchForm.addEventListener("submit", (ev) => {
  ev.preventDefault();
  applySearch(searchInput.value);
});
searchClear.addEventListener("click", () => {
  searchInput.value = "";
  applySearch("");
  searchInput.focus();
});
searchInput.addEventListener("input", () => {
  searchClear.disabled = !searchQuery && !searchInput.value;
});

// Two-click confirm (no blocking browser dialogs).
let confirmTimer = null;
clearBtn.addEventListener("click", () => {
  if (!clearBtn.classList.contains("pp-confirm")) {
    clearBtn.classList.add("pp-confirm");
    clearBtn.textContent = "Click again to delete all";
    clearTimeout(confirmTimer);
    confirmTimer = setTimeout(resetClear, 3000);
    return;
  }
  resetClear();
  chrome.storage.local.remove(HISTORY_KEY, () => toast("History cleared"));
});
function resetClear() {
  clearBtn.classList.remove("pp-confirm");
  clearBtn.textContent = "Clear all";
}

// ── Live updates ──
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[HISTORY_KEY]) load({ keepScroll: true });
  if (area === "sync" && changes.theme) document.body.setAttribute("data-theme", changes.theme.newValue || "default");
});

// Refresh "Today"/"Yesterday" labels if the window stays open past midnight.
window.addEventListener("focus", () => render({ keepScroll: true }));

// Escape clears an active search first; otherwise it closes the window.
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (searchQuery || searchInput.value) { searchClear.click(); return; }
  window.close();
});

load();

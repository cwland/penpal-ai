// penpal-settings-updates.js — Settings: "update available" banner and the
// What's New pop-up. Uses penpal-updates.js helpers.

document.addEventListener("DOMContentLoaded", () => {
  const current = chrome.runtime.getManifest().version;

  // ── Update banner ─────────────────────────────────────────────────────────
  const banner = document.getElementById("update-banner");
  const refreshBanner = () => {
    chrome.storage.local.get(["penpalUpdate", "penpalUpdateDismissed"], (d) => {
      if (chrome.runtime.lastError) return;
      const u = d && d.penpalUpdate;
      const show = shouldShowUpdateBanner(u, d && d.penpalUpdateDismissed, current);
      banner.classList.toggle("visible", show);
      if (show) {
        document.getElementById("update-banner-text").textContent = `PenPal v${u.version} is available (you have v${current}).`;
        banner.dataset.version = u.version;
      }
    });
  };
  chrome.runtime.sendMessage({ action: "checkForUpdate" }, () => { void chrome.runtime.lastError; refreshBanner(); });
  refreshBanner();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.penpalUpdate || changes.penpalUpdateDismissed)) refreshBanner();
  });
  document.getElementById("update-banner-close").addEventListener("click", () => {
    banner.classList.remove("visible");
    chrome.storage.local.set({ penpalUpdateDismissed: banner.dataset.version || "" });
  });

  // ── What's New ────────────────────────────────────────────────────────────
  const dlg = document.getElementById("whats-new");
  const close = () => { dlg.classList.remove("visible"); chrome.storage.local.remove("penpalWhatsNew"); };
  document.getElementById("wn-close").addEventListener("click", close);
  document.getElementById("wn-done").addEventListener("click", close);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && dlg.classList.contains("visible")) close(); });

  const badge = document.getElementById("page-version");
  const openFromBadge = () => openWhatsNew(null);
  badge.addEventListener("click", openFromBadge);
  badge.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openFromBadge(); } });

  chrome.storage.local.get(["penpalWhatsNew"], (d) => {
    if (!chrome.runtime.lastError && d && d.penpalWhatsNew) openWhatsNew(d.penpalWhatsNew.from);
  });

  async function openWhatsNew(fromVersion) {
    let log = [];
    try { log = await (await fetch(chrome.runtime.getURL("CHANGELOG.json"))).json(); } catch (_) {}
    if (!Array.isArray(log) || !log.length) return;

    document.getElementById("wn-sub").textContent = fromVersion
      ? `You've been updated from v${fromVersion} to v${current}.`
      : `You're on v${current}.`;

    const list = document.getElementById("wn-list");
    list.innerHTML = "";
    for (const s of whatsNewSections(log, fromVersion)) {
      const item = document.createElement("div");
      item.className = "wn-item" + (s.expanded ? " open" : "");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wn-toggle";
      btn.setAttribute("aria-expanded", String(s.expanded));
      btn.innerHTML = `<span class="wn-caret" aria-hidden="true">›</span><span class="wn-ver"></span>${s.version === current ? '<span class="wn-new">Current</span>' : ""}<span class="wn-date"></span>`;
      btn.querySelector(".wn-ver").textContent = "v" + s.version;
      btn.querySelector(".wn-date").textContent = s.date || "";
      const notes = document.createElement("ul");
      notes.className = "wn-notes";
      for (const n of s.notes || []) { const li = document.createElement("li"); li.textContent = n; notes.appendChild(li); }
      btn.addEventListener("click", () => {
        const open = item.classList.toggle("open");
        btn.setAttribute("aria-expanded", String(open));
      });
      item.append(btn, notes);
      list.appendChild(item);
    }
    dlg.classList.add("visible");
    document.getElementById("wn-done").focus();
  }
});

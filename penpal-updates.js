// penpal-updates.js — shared update-notice helpers (no DOM).
// Loaded by the toolbar menu and Settings. The background worker checks GitHub
// once a day and stores chrome.storage.local.penpalUpdate = { available, version, notes, downloadUrl }.

const PENPAL_REPO_URL = "https://github.com/cwland/penpal-ai";

function _verParts(v) {
  return String(v || "").trim().replace(/^v/i, "").split(".").map(n => parseInt(n, 10) || 0);
}

// True if version a is strictly newer than b.
function isNewerVersion(a, b) {
  const x = _verParts(a), y = _verParts(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  }
  return false;
}

// Toolbar-menu button: shown whenever a newer version is available.
function updateIsAvailable(update, currentVersion) {
  return !!(update && update.available && update.version && isNewerVersion(update.version, currentVersion));
}

// Settings banner: like the button, but hidden once that version is dismissed.
function shouldShowUpdateBanner(update, dismissedVersion, currentVersion) {
  return updateIsAvailable(update, currentVersion) && dismissedVersion !== update.version;
}

// What's New pop-up sections, newest first. Versions newer than the one the
// user updated from are expanded; with no previous version, only the newest.
function whatsNewSections(changelog, fromVersion) {
  const list = (changelog || []).slice().sort((a, b) =>
    isNewerVersion(a.version, b.version) ? -1 : isNewerVersion(b.version, a.version) ? 1 : 0);
  return list.map((e, i) => ({
    ...e,
    expanded: fromVersion ? isNewerVersion(e.version, fromVersion) : i === 0
  }));
}

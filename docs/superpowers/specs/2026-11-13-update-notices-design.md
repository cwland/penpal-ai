# Update Notices & What's New — Design (short)

_Date: 2026-11-13 · Size: small change · Target version: 1.6.0_

## Intent
Tell people about updates in places they can act on, and show what changed after they update.
Replaces the auto-hiding toast in the writing panels.

## Decided (with Cory)
- **Toolbar menu** (`penpal-menu.html`): an **"Update available — v1.x"** button, shown only when an update is
  available, that opens `https://github.com/cwland/penpal-ai` in a new tab.
- **Settings**: a banner pinned to the top: *"PenPal v1.x is available — View on GitHub"* with **×**.
  × hides it for that version only; a newer version shows it again.
- **After an update**: Settings opens automatically with a **What's New** pop-up — newest version at the top,
  expanded with its notes; older versions collapsed, expandable with **›**.
- **Remove** the update toast from the pop-out, full tab and side panel.

## Calls made by Claude
- **Source of history:** bundled `CHANGELOG.json` (`[{version, date, notes:[...]}]`, newest first), seeded from git
  history (1.3.0, 1.3.1, 1.3.2, 1.3.4, 1.4.0, 1.5.0, 1.5.1). Bundled rather than fetched: works offline and shows
  exactly what's installed. A test keeps the newest entry equal to the manifest version.
- **One dismissal record** (`penpalUpdateDismissed` = version) shared by the Settings banner; the menu button is
  not dismissible (it's small and only appears when there's an update).
- **What's New opens only on update** (`onInstalled` reason `update`), not on first install.
  Background stores `penpalWhatsNew = { from, to }`; Settings shows the pop-up when it's set, then clears it.
  Sections newer than `from` are expanded; the rest collapsed.
- The update **check** is unchanged (GitHub `version.json` on `main`, once per 24 h).
- Version **1.6.0**.

## Approach
One sensible way: reuse the existing background check and `penpalUpdate` flag; add UI in the menu and Settings;
bundle the changelog. Fetching history from GitHub was considered and dropped (needs network; could show notes for
versions the user doesn't have yet).

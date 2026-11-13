# AI Model Setup Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three AI sub-tabs with one ordered **My Models** list (live model lists, validate→pick→test→save, drag order, automatic fallback, auto-migration).

**Architecture:** Pure logic in a new `penpal-ai-config.js` (globals, no DOM) loaded by the service worker (`importScripts`), Settings, popup, tab and content script. Background owns fallback via a new `rewrite` message. Settings UI for My Models lives in a new `penpal-settings-models.js`; the old Defaults / Manage / Custom Providers code is deleted from `penpal-settings.js`.

**Tech Stack:** Manifest V3, vanilla JS, `node --test` with VM-sandbox loading.

**Spec:** `docs/superpowers/specs/2026-11-13-ai-model-setup-design.md`

## Global Constraints

- No build step, no runtime dependencies.
- Storage: `chrome.storage.sync` keys `aiModels`, `aiConnections`, `apiKeys`. Legacy keys left untouched.
- Fallback timeout per model: **30 s**. Every failure falls back; Settings tests never do.
- Version **1.5.0** in `manifest.json` and `version.json`.
- `const` globals must be declared in exactly one script per page (`PROVIDER_MODELS`, `MODEL_RECOMMENDATIONS` move to `penpal-ai-config.js`).

## Review Focus

1. **Settings synced to a second computer** where a local endpoint doesn't exist → that entry fails fast and falls back; attribution names it.
2. **Model ID case** (LM Studio / Ollama tags) → the saved ID is the exact string from `/models`, not lowercased.
3. **Old surfaces before migration ran** (popup opened right after update) → readers use `resolveAiModels(data)`, which migrates on the fly.
4. **Empty list** → popup/tab/side panel show the existing "set up AI" banner, not a crash.
5. **OpenRouter key check** → a bad key is rejected even though `/models` is public.

---

### Task 1: `penpal-ai-config.js` core logic

**Files:** Create `penpal-ai-config.js`; Test `test/ai-config.test.js`; Modify `test/helpers/load-background.js` (add `loadScript(file, context)` + `importScripts` stub).

**Produces (globals):**
- `PROVIDER_MODELS`, `MODEL_RECOMMENDATIONS` (moved verbatim)
- `makeAiId(prefix) -> string`
- `migrateLegacySettings(data) -> { aiModels, aiConnections, apiKeys }`
- `resolveAiModels(data) -> aiModels` (stored list, else migrated)
- `resolveAiConnections(data) -> aiConnections`
- `filterChatModels(ids, source) -> ids`
- `buildModelOptions(provider, ids, source) -> [{ value, label, rec }]` (recommended first in rec order, then alphabetical)
- `modelDisplayLabel(provider, modelId) -> string`
- `requestSettingsFor(entry, { aiConnections, apiKeys }) -> { provider, apiKey, model, endpointOverrides, apiFormat }`
- `buildFallbackChain(aiModels, preferredId) -> entries[]`
- `addModelEntry(list, entry) -> { ok, list, error }` (duplicate provider+model rejected)
- `removeModelEntry({ aiModels, aiConnections, apiKeys }, id) -> same shape` (drops key/connection when unused)
- `moveModelEntry(list, fromIndex, toIndex) -> list`
- `describeAttempts(attempts, usedEntry) -> string | ""`

- [ ] Tests: migration cases (builtin provider+model → #1; custom provider with models → entries after #1, deduped; builtin endpoint override → custom connection "<Name> (custom endpoint)"; legacy single `apiKey`; empty data → []), chat filter drops `text-embedding-3-small`, `whisper-1`, `tts-1`, `dall-e-3`, `omni-moderation-latest`, `gpt-4o-realtime-preview`, keeps `gpt-4.1`; filter not applied to custom; options put recommended first with rec metadata; exact-case ids preserved; chain puts preferred first, ignores unknown preferred; duplicate rejection; remove drops unused key and connection, keeps shared key; move; attribution string `Answered by Qwen3.6 Flash — Claude Sonnet 4.6 didn't respond (timeout).`
- [ ] Run, watch fail; implement; run green; commit.

### Task 2: Background — model listing, validation, `rewrite` with fallback, migration hook

**Files:** Modify `background.js`; Test `test/rewrite.test.js`, `test/validate.test.js`.

**Consumes:** Task 1 globals via `importScripts("penpal-ai-config.js")`.
**Produces messages:**
- `{ action: "validateConnection", provider, apiKey, endpoint, apiFormat }` → `{ ok, ids, error }` (raw-case ids, no cache; OpenRouter also `GET https://openrouter.ai/api/v1/key`).
- `{ action: "rewrite", text, systemPrompt, history, preferredModelId }` → `{ success, result, usedModelId, usedLabel, notice, attempts }` or `{ success:false, error }`.
- `callAIAPI(text, settings, { debug, signal })` accepts an AbortSignal.

- [ ] Tests: first model OK → result, no notice; first throws/HTTP 500 → second answers, notice names both; timeout (fake slow fetch + injectable timeout) → falls back; all fail → error lists each; preferred model tried first; history records used model; validate: 401 → error, OpenRouter bad key → error even with public list, raw-case ids returned.
- [ ] Migration: `onInstalled` (install/update) writes migrated `aiModels` when absent.
- [ ] Run, fail, implement, green, commit.

### Task 3: Settings — My Models UI

**Files:** Create `penpal-settings-models.js`; Modify `penpal-settings.html` (replace Defaults/Manage/Custom sub-panels with one `models` panel; add script tags for `penpal-ai-config.js`, `penpal-settings-models.js`), `penpal-settings.js` (delete provider/model/custom-provider/manage code, remove `apiKeys/provider/model` from save & dirty state, setup banner from `resolveAiModels`, Apple quick-fill template).

- Add card steps lock in order; Save enabled only after a passing Test of the selected model; edit re-opens card; drag + ↑/↓ reorder; delete; per-row Test; recommendations shown for builtins.
- [ ] Verify: page loads in headless Chromium with a stubbed `chrome` (no console errors), add-flow happy path through mocked messages, `npm test` green. Commit.

### Task 4: Surfaces — popup, tab, side panel

**Files:** Modify `penpal-models.js` (`getMyModels()` replaces `getValidatedModels`/`getLiveValidatedModels`), `penpal-popup.js`, `penpal-tab.js`, `penpal-content.js`, `penpal-popup.html`, `penpal-tab.html`, `manifest.json` (content script list).

- Send `rewrite` with `preferredModelId: sessionModel`; no-key checks become "no models"; show `notice` under the result.
- [ ] Verify: `node --check` on each, popup page loads in headless Chromium with stubbed chrome, `npm test` green. Commit.

### Task 5: Docs & version

**Files:** `manifest.json`, `version.json` → 1.5.0; README (setup + local + permissions unchanged), PRIVACY (unchanged permissions; mention fallback sends text to the next model in your list); Settings "How to Use" steps.
- [ ] `npm test` green; commit; push branch.

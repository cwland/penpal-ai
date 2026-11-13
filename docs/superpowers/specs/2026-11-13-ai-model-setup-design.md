# AI Model Setup Redesign — Design

_Date: 2026-11-13 · Branch: `ai-setup-redesign` (based on `local-llm-support`, v1.4.0)_

## Intent

Setting up AI in PenPal is confusing. Today it's spread across three sub-tabs
(**Defaults**, **Manage Default Providers**, **Custom Providers**) with a
hardcoded model list that users can hide entries from, hand-typed model IDs,
per-provider endpoint overrides, and a separate path for local servers.

Replace all of that with **one flow** and **one ordered list**:

- Users build a **My Models** list. Each entry is a provider + connection + model,
  added through a single **Add model** flow that enforces:
  **pick provider → connect (key / endpoint) → validate → pick model from a live
  dropdown → test → save.**
- Built-in cloud providers, custom endpoints, and local servers (Apple Foundation
  Models, Ollama, LM Studio, …) all go through the same flow and live in the same
  list.
- The list is **drag-to-reorder**. The **top entry is the default**.
- The rest of the list acts as **backups**: if a model fails, PenPal tries the
  next one, and tells the user which model answered.

## Goals

1. One place to set up AI: a **My Models** sub-tab replacing Defaults, Manage
   Default Providers, and Custom Providers.
2. Model dropdown is populated **live** from the provider's models endpoint — no
   hand-typed model IDs, no hidden-model management.
3. **Recommendations** shown when a built-in provider is picked, surfaced at the
   top of the model dropdown with a one-click "use".
4. **Save is impossible** until the connection is validated and the chosen model
   has passed a test.
5. **Automatic fallback** down the list on failure, with visible attribution.
6. **Existing users are converted automatically** on update — nothing breaks.

## Non-goals

- Fallback on *poor-quality* replies. Only outright failures trigger fallback.
- Per-model settings beyond what's needed to call it (no per-model temperature,
  tone, or prompt).
- Changing how tones, language, writing style, history, or appearance work.
- A model-comparison / benchmarking UI.

## Anti-goals (would count as failure even if it "works")

- **Silent fallback.** The user must always be able to see which model wrote
  their text.
- An update that leaves an existing user with no working model, or forces them
  to redo setup.
- A model in My Models that was never successfully tested.
- An OpenRouter dropdown with hundreds of unsearchable entries.

## Constraints

- Manifest V3 Chrome extension, vanilla JS, no build step, no runtime
  dependencies. Keep it that way.
- Settings live in `chrome.storage.sync` (quota: 8 KB per item, ~100 KB total).
  API keys already live there (`apiKeys`); keep them there.
- Host access for custom/local endpoints is requested at runtime via
  `chrome.permissions.request` (existing pattern in `penpal-settings.js`).
- Local-server header rules (v1.4.0) and `stream: false` must keep working.
- Tests: Node built-in runner (`npm test`), with `background.js` loaded in a VM
  sandbox (`test/helpers/load-background.js`). New logic must be written
  test-first.

## Approaches considered

1. **New shared module + inline progressive "Add model" card** — _chosen._
   Logic (data model, migration, model-list filtering/ordering,
   recommendations, fallback chain) in a new `penpal-ai-config.js` loaded by
   both the service worker and Settings, unit-tested in Node. The Add flow is
   one card whose later steps stay locked until earlier ones pass.
   Trade-off: a new file and a bigger first change, but stops the logic
   sprawling further across the 2,100-line `penpal-settings.js`.
2. **Same module, but a modal step-by-step wizard.** Most hand-holding, but
   more UI code (dialog, step nav, focus trap) and editing means clicking
   through every screen. Rejected.
3. **Rework in place, no new module.** Fewest files, but conversion and
   fallback logic would be hard to test and the Settings file keeps growing.
   Rejected.

Cory picked **#1**.

## Decided design

### Data model (`chrome.storage.sync`)

```js
aiModels: [                         // ordered; index 0 = default
  {
    id: "m_<random>",              // stable id for reorder/edit/delete
    source: "builtin" | "custom",
    provider: "anthropic",         // builtin: PROVIDER_ENDPOINTS key; custom: connection id
    model: "claude-sonnet-4-6",    // exact id from the provider's /models
    label: "Claude Sonnet 4.6",    // display name (curated label if known, else model id)
    testedAt: 1794580000000        // last successful test (ms)
  },
  ...
]

aiConnections: {                    // custom/local endpoints, keyed by connection id
  "c_<random>": { name: "Apple (local)", icon: "🍎", endpoint: "http://127.0.0.1:1976/v1/chat/completions", apiFormat: "openai" }
}

apiKeys: { anthropic: "sk-…", "c_<random>": "…" }   // existing key, reused: one key per provider/connection
```

- **One key per provider/connection**, entered once. Adding a second OpenAI
  model reuses the validated OpenAI key (shown masked, with "change key").
- Duplicate entries (same provider + model) are rejected with a message.

### Add model flow (inline card on My Models)

```
+ Add model
 1. Provider   [ Anthropic ▾ ]   built-ins, then "Local / custom server"
               custom quick-fills: Apple Foundation Models, Ollama, LM Studio,
               Open WebUI, llama.cpp, vLLM, Jan (pre-fill endpoint + format)
 2. Connect    builtin: API key (pre-filled if already saved for that provider)
               custom: name, icon, endpoint URL, API format, optional key
               [Validate] → ✓ Connected · 42 models
 3. Model      [ search… ▾ ]  live list; recommended models pinned on top with badges
               ★ Best for writing — Claude Sonnet 4.6   [use]
 4. Test       [Test model] → ✓ replied "Ready" (1.8 s)
 5.            [Save]  → appended to the bottom of My Models
```

- Steps unlock in order. Changing an earlier step (provider, key, endpoint)
  resets everything after it. Save is enabled only after a successful test of
  the currently selected model.
- **Validate** = fetch the provider's models list with the key.
  - Most providers reject a bad key on `/models` → that's the validation.
  - **OpenRouter** `/models` is public, so validation also calls OpenRouter's
    key-info endpoint (`GET /api/v1/key`) with the key.
  - **Custom/local**: request host permission first (existing pattern), then
    `/models`; key optional. "✓ Connected" means the server answered with a
    model list.
  - If a custom server has no recognizable `/models` endpoint, show an error
    with a manual "enter model ID" fallback field so unusual servers still work.
- **Model list**: from `extractModelIds` (existing), then
  - filter out non-chat models by id pattern (`embed`, `whisper`, `tts`,
    `dall-e`, `moderation`, `image`, `audio`, `realtime`, `transcribe`, `search`,
    `rerank`), only for built-in providers;
  - recommended models (that exist in the live list) pinned first with badges;
  - known curated labels applied where ids match (lenient match, existing
    `modelValueIsLive` logic); others show the raw id;
  - a search box filters the dropdown (needed for OpenRouter).
- **Test** = existing single-model call with the connection-test prompt
  (`runProviderTest`), **no fallback**. Debug Bubble stays available.

### My Models list

```
My Models                                     [+ Add model]
 ⠿ 1  Anthropic · Claude Sonnet 4.6    Default   ✎  🗑
 ⠿ 2  OpenRouter · Qwen3.6 Flash       Backup    ✎  🗑
 ⠿ 3  Apple (local) · system           Backup    ✎  🗑
```

- Drag handle (⠿) to reorder; persisted immediately. Keyboard alternative:
  up/down buttons (or Alt+↑/↓) for accessibility.
- ✎ Edit reopens the entry in the Add card (pre-filled, must re-test before
  saving changes to provider/connection/model).
- 🗑 Delete removes the entry; if it was #1, #2 becomes the default. Keys are
  kept unless no remaining entry uses that provider/connection, in which case
  the key is removed too.
- Empty list → existing setup banner directs the user to **+ Add model**.

### Recommendations

Reuse `MODEL_RECOMMENDATIONS` (badges: best / fast / value / free). Shown when a
built-in provider is selected in step 1, and as pinned entries at the top of
the step-3 dropdown. Recommendations whose model isn't in the live list are
hidden. No recommendations for custom/local connections.

### Rewriting and fallback

- New background message `action: "rewrite"` carrying `text`, `systemPrompt`,
  `history` metadata, and optional `preferredModelId`. The **background reads
  `aiModels` itself** and runs the chain; surfaces (popup, full tab, side
  panel/content script) stop resolving provider/key themselves.
- Chain order: `preferredModelId` first if given (session pick), then the rest
  of `aiModels` in list order.
- **Fallback triggers:** network error, no response within **30 s** per model,
  HTTP 5xx, 429, 401, 403. Anything else (e.g. 400 bad request, unparseable
  reply) also falls back — the user asked "if it doesn't respond, try the
  next"; an unusable reply counts. A successful but poor reply does not.
- Response includes `{ text, usedModelId, attempts: [{ modelId, error }] }`.
  When `attempts` contains failures, the surface shows one muted line under
  the result: _"Answered by Qwen3.6 Flash — Claude Sonnet 4.6 didn't respond
  (timeout)."_
- All failed → one error listing each model and its reason.
- History entries record the model that actually answered.
- `callAIAPI` stays the single-model primitive (used by Test and by the chain).
  Settings' **Test** keeps using `action: "callAI"` (no fallback).

### Session model picker (popup / tab / side panel)

The model button lists **My Models in order** (labels from `label`). Picking
one sets `preferredModelId` for the session; the rest remain backups. This
replaces `getValidatedModels` / `getLiveValidatedModels` and the hardcoded
`PROVIDER_MODELS` as the picker's source.

### Migration (runs once, on update)

Triggered when `aiModels` is absent. Built from existing storage:

1. Current `provider` + `model` → entry #1 (source builtin or custom as
   appropriate). Label from curated list if known.
2. Each `customProviders[]` entry → an `aiConnections` record (same id, so
   `apiKeys[id]` keeps working), and each of its saved model names
   (`customModels[id]`) → an entry, appended after #1, skipping a duplicate of #1.
3. `endpointOverrides` for a **built-in** provider → converted into a custom
   connection named "<Provider> (custom endpoint)" with the same key, and the
   entry points at that connection, so users with proxies keep working.
4. Built-in `customModels` (hand-added ids for built-ins): only kept if one is
   the currently selected model (covered by step 1); others dropped.
5. Migrated entries get `testedAt: null` and are treated as trusted (the
   "must test before save" rule applies to new/edited entries only). A small
   "Test" button on each list row lets users re-check.
6. Old keys (`provider`, `model`, `customModels`, `hiddenModels`,
   `endpointOverrides`, `customProviders`) are **left in storage** for one
   release (rollback safety) but no longer read. A later release removes them.

Migration lives in `penpal-ai-config.js`, runs from the service worker on
`onInstalled` (reason `update`) and lazily on first read if `aiModels` is
missing, and is idempotent.

### Removed

- **Manage Default Providers** sub-tab and its code (endpoint override UI,
  add-model-ID UI, built-in defaults hide/show list).
- **Custom Providers** sub-tab (absorbed into Add model).
- **Defaults** sub-tab (replaced by My Models).
- `PROVIDER_MODELS` as a source of truth — kept only as a label lookup, now
  in `penpal-ai-config.js` (resolving the "keep in sync with
  penpal-settings.js" duplication).

### Files touched (expected)

- **new** `penpal-ai-config.js` — pure logic, loaded via `importScripts` in
  `background.js` and `<script>` in Settings/popup/tab; content script loads it
  via `manifest.json` `content_scripts.js`.
- `background.js` — `rewrite` action, fallback chain, OpenRouter key check,
  migration hook.
- `penpal-settings.html/js` — My Models sub-tab, Add model card, removal of
  three sub-tabs.
- `penpal-popup.js`, `penpal-tab.js`, `penpal-content.js`, `penpal-models.js` —
  switch to `rewrite`, model picker from `aiModels`, attribution line.
- `manifest.json`, `version.json` → **1.5.0**; README, PRIVACY (no new
  permissions expected).
- Tests for: migration, model-list filtering/ordering, recommendation pinning,
  fallback chain (each trigger), duplicate rejection, delete/reorder rules.

## Calls Claude made (not discussed — check these)

1. **Bad requests and unreadable replies also fall back**, not just "no response"
   (network/timeout/5xx/429/401/403). Reason: from the user's seat, an unusable
   reply is the same as no reply.
2. **Built-in endpoint overrides migrate to a custom connection** rather than
   being dropped, so anyone using a proxy keeps working.
3. **Hand-added model IDs for built-in providers are dropped** on migration
   unless one is the current default — the live dropdown replaces them.
4. **Migrated entries skip the "must test" rule**; each row gets a Test button.
5. **Old settings stay in storage for one release** before cleanup, so a
   rollback to 1.4.x still works.
6. **Deleting the last model for a provider also deletes its saved key.**
7. **Apple Foundation Models is added as a local quick-fill** template.
8. **Version 1.5.0** (minor bump — big UI change, no new permissions).
9. **Keyboard reordering** (up/down buttons) alongside drag, for accessibility.
10. **Settings Test never falls back** — it tests only the chosen model.

## Builder's calls (left to implementation)

- Exact visual styling, reusing the existing Settings CSS (cards, badges,
  test-result, debug bubble).
- Drag-and-drop implementation (native HTML5 DnD is fine).
- Searchable dropdown implementation (a filter input above a list is fine; no
  library).
- Exact wording of messages, within the tone of existing Settings copy.
- Whether "How to Use" step text on the first tab is updated in the same
  change (it should match the new flow).

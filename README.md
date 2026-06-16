# PenPal AI Writing Assistant

> Your words, polished. Grammar, style & tone correction powered by your choice of AI — right inside any text field.

PenPal AI is a Chrome extension that brings AI-powered writing assistance directly into any text field on any website. Highlight text, pick a tone, and get an improved rewrite in seconds — no copy-pasting to a separate app required.

---

## Features

- **Inline rewriting** — Select text anywhere on the web, trigger PenPal, and the AI-polished result is injected back into the field automatically (or copied to clipboard as a fallback).
- **16 built-in tones** — Casual, Professional, Direct, Warm, Witty, Formal, Concise, Empathetic, Silly, Bubbly, Creative, Persuasive, Academic, Confident, Sarcastic, and Poetic.
- **Custom tones** — Create your own tone presets with a custom name, icon, and prompt.
- **Multi-language output** — Switch the output language per session from 18 supported languages including English (US/UK), Spanish, French, German, Japanese, Chinese, Arabic, and more.
- **Multi-provider AI support** — Bring your own API key from any of the following providers:
  - OpenRouter, OpenAI, Anthropic, Google Gemini, Mistral, Meta (via OpenRouter), Groq, Cohere, Together AI, Fireworks AI, DeepSeek, xAI
- **Local / self-hosted LLM support** — Quick-fill templates for Ollama, LM Studio, llama.cpp, vLLM, and other OpenAI-compatible local servers. No API key required for local setups.
- **Custom providers** — Add any OpenAI-compatible or Anthropic-compatible endpoint with a custom name, icon, and API format.
- **Pop-out window** — Detach the assistant into a floating standalone window that stays open as you browse.
- **Context menu integration** — Right-click any selected text and choose **✏️ Rewrite with PenPal AI** to open the panel with your selection pre-loaded.
- **Writing style notes** — Set a persistent personal style description (e.g. "avoid passive voice, keep sentences under 20 words") applied to every request.
- **Customizable system prompt** — Override the default prompt entirely for full control over AI behavior.
- **Per-provider model management** — Add custom models, hide models you don't use, and override API endpoints per provider.

---

## Installation

PenPal AI is a Manifest V3 Chrome extension loaded unpacked during development.

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the `penpal-ai/` folder.
5. The PenPal AI icon will appear in your Chrome toolbar.

On first install, the Settings page opens automatically so you can add your API key.

---

## Setup

1. Click the PenPal AI toolbar icon and then the **⚙ Settings** button, or right-click the extension icon and choose **Options**.
2. Select your **AI provider** and enter your **API key**.
3. Choose a default **model** and **tone**.
4. Optionally add **writing style notes** or a fully custom system prompt.
5. Save — you're ready to go.

### Using a local model (Ollama, LM Studio, etc.)

1. In Settings, go to the **Custom Providers** tab.
2. Click a quick-fill template (Ollama, LM Studio, llama.cpp, vLLM, or Jan) or fill in the endpoint manually.
3. No API key is needed for most local setups.
4. Make sure your local server is running before using the extension.

---

## Usage

### From the popup

1. Click the PenPal AI toolbar icon.
2. Type or paste text into the input box.
3. Select a tone chip (and optionally a language).
4. Click **Rewrite** — the result appears below with options to copy or replace the original.

### Inline on any page

1. Select text in any editable field on any website.
2. A small **✏️** pencil button appears near the selection.
3. Click it to open the inline panel with the selected text pre-loaded.
4. Pick a tone and click **Rewrite**.
5. Click **Replace** to inject the result back into the field, or **Copy** to put it on the clipboard.

### Via context menu

1. Select text anywhere on the page.
2. Right-click and choose **✏️ Rewrite with PenPal AI**.
3. The PenPal panel opens with the selected text loaded.

### Pop-out window

Click the **⤢ Pop out** button in the popup to open PenPal in a dedicated floating window. The window carries over your current draft and stays open across tab navigation.

---

## Project Structure

```
penpal-ai/
├── manifest.json          # Extension manifest (Manifest V3)
├── background.js          # Service worker — API calls, context menu, pop-out window management
├── penpal-popup.html      # Popup/pop-out window HTML
├── penpal-popup.js        # Popup logic — tone/language selection, rewrite flow, settings access
├── penpal-content.js      # Content script — inline panel, text selection, page injection
├── penpal-content.css     # Styles for the inline panel
├── penpal-settings.html   # Settings page HTML
├── penpal-settings.js     # Settings page logic — providers, models, tones, language, style
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Supported AI Providers

| Provider | API Format | Notes |
|---|---|---|
| OpenRouter | OpenAI-compatible | Routes to many models; recommended for getting started |
| OpenAI | OpenAI | GPT-4o, GPT-4.1, o-series |
| Anthropic | Anthropic | Claude 3.5/3.7 Sonnet, Haiku, Opus |
| Google | OpenAI-compatible | Gemini models via the OpenAI-compat endpoint |
| Mistral | OpenAI-compatible | Mistral 7B, Mixtral, etc. |
| Meta (via OpenRouter) | OpenAI-compatible | Llama 3 family |
| Groq | OpenAI-compatible | Fast inference |
| Cohere | Cohere | Command R+ |
| Together AI | OpenAI-compatible | Open-source models |
| Fireworks AI | OpenAI-compatible | Fast open-source inference |
| DeepSeek | OpenAI-compatible | DeepSeek-V3, R1 |
| xAI | OpenAI-compatible | Grok |
| Custom / Local | OpenAI or Anthropic | Ollama, LM Studio, llama.cpp, vLLM, Jan, etc. |

---

## Permissions

| Permission | Reason |
|---|---|
| `activeTab` | Read and modify the active tab to inject the inline panel |
| `storage` | Save user settings, API keys, and custom tones locally |
| `contextMenus` | Add the right-click "Rewrite with PenPal AI" menu item |
| `scripting` | Inject the content script on demand |
| `clipboardWrite` | Copy AI results to the clipboard |
| Host permissions (AI APIs) | Make direct API calls to the configured AI provider |
| Optional host permissions (`http://*/*`, `https://*/*`) | Support inline rewriting on all websites |

API keys are stored locally in Chrome's extension storage and are never sent anywhere except the AI provider endpoint you configure.

---

## Contributing

1. Fork the repository and create a feature branch.
2. Make your changes — the extension can be reloaded from `chrome://extensions` by clicking the refresh icon on the extension card.
3. Test across a few different text field types (plain `<input>`, `<textarea>`, and `contenteditable` elements behave differently).
4. Open a pull request with a clear description of what changed and why.

---

## License

MIT — see [LICENSE](LICENSE) for details.

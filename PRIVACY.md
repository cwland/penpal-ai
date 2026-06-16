# Privacy Policy — PenPal AI Writing Assistant

_Last updated: June 15, 2026_

---

## Overview

PenPal AI Writing Assistant ("PenPal AI", "the extension", "we") is a Chrome browser extension that helps you rewrite and polish text using an AI provider of your choice. This policy explains what data the extension handles, where it goes, and what it never does.

---

## Data We Collect

PenPal AI does not collect, transmit, or store any data on our servers. We do not operate any backend infrastructure. All data handled by the extension stays on your device or is sent directly from your browser to the AI provider you configure.

### What is stored locally on your device

The following is saved in Chrome's local extension storage (`chrome.storage.local`) and never leaves your browser except as described below:

- **API keys** — the key(s) you enter for your chosen AI provider(s)
- **Settings and preferences** — your selected provider, model, default tone, language preference, writing style notes, custom tones, and custom system prompt
- **Custom provider configuration** — any self-hosted or third-party endpoints you add

You can clear all stored data at any time by removing the extension from Chrome.

---

## Data We Transmit

When you trigger a rewrite, the extension sends a request **directly from your browser** to the AI provider endpoint you have configured. This request contains:

- The text you selected or typed into the input box
- Your API key (used to authenticate with the provider)
- Your chosen tone, language, and system prompt

**This request goes directly to your AI provider — not through any PenPal AI server.** We have no visibility into the content of these requests.

The privacy practices of the AI provider you choose apply to that data. Please review the privacy policy of your selected provider:

- [OpenRouter](https://openrouter.ai/privacy)
- [OpenAI](https://openai.com/policies/privacy-policy)
- [Anthropic](https://www.anthropic.com/privacy)
- [Google](https://policies.google.com/privacy)
- [Mistral](https://mistral.ai/privacy/)
- [Groq](https://groq.com/privacy-policy/)
- [Cohere](https://cohere.com/privacy)
- [Together AI](https://www.together.ai/privacy)
- [Fireworks AI](https://fireworks.ai/privacy)
- [DeepSeek](https://www.deepseek.com/privacy_policy)
- [xAI](https://x.ai/privacy-policy)

If you use a local model (e.g. Ollama, LM Studio), requests are sent only to your own machine and no data leaves your device at all.

---

## Data We Do Not Collect

PenPal AI does not:

- Collect or transmit your browsing history
- Track which websites you visit or which text fields you interact with
- Send any data to the extension developer or any third party other than your configured AI provider
- Use analytics, telemetry, or crash-reporting services
- Serve advertisements or share data with advertisers
- Sell or monetize your data in any form

---

## Permissions Explained

| Permission | Why it's needed |
|---|---|
| `activeTab` | Read and modify the currently active page to inject the rewriting panel and replace selected text |
| `storage` | Save your settings and API keys locally on your device |
| `contextMenus` | Add the "Rewrite with PenPal AI" option to the right-click menu |
| `scripting` | Inject the inline assistant panel into pages when triggered |
| `clipboardWrite` | Copy AI-generated results to your clipboard |
| Host permissions (AI provider URLs) | Send rewrite requests directly to your configured AI provider |
| Optional host permissions (`http://`, `https://`) | Enable the inline rewriting panel on all websites |

---

## API Key Security

Your API keys are stored exclusively in Chrome's extension storage on your local device. They are only ever transmitted to the AI provider endpoint they belong to, as part of a normal authenticated API request. They are never sent to the extension developer or any other party.

We strongly recommend following your AI provider's guidance on key security — such as setting usage limits or rotating keys periodically.

---

## Children's Privacy

PenPal AI is not directed at children under the age of 13 and we do not knowingly collect any information from children. The extension itself collects no personal data; however, if you use it to send text to a third-party AI provider, that provider's terms and privacy policy apply.

---

## Changes to This Policy

If this policy changes in a material way, we will update the _Last updated_ date above and note the change in the extension's release notes. Continued use of the extension after a policy update constitutes acceptance of the revised policy.

---

## Contact

If you have questions or concerns about this privacy policy, please open an issue in the project repository.

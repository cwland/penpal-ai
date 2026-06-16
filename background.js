// Background service worker — PenPal AI Writing Assistant

const PROVIDER_ENDPOINTS = {
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
  openai:     "https://api.openai.com/v1/chat/completions",
  anthropic:  "https://api.anthropic.com/v1/messages",
  google:     "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  mistral:    "https://api.mistral.ai/v1/chat/completions",
  meta:       "https://openrouter.ai/api/v1/chat/completions", // route via openrouter
  groq:       "https://api.groq.com/openai/v1/chat/completions",
  cohere:     "https://api.cohere.ai/v2/chat",
  together:   "https://api.together.xyz/v1/chat/completions",
  fireworks:  "https://api.fireworks.ai/inference/v1/chat/completions",
  deepseek:   "https://api.deepseek.com/v1/chat/completions",
  xai:        "https://api.x.ai/v1/chat/completions"
};

chrome.runtime.onInstalled.addListener((details) => {
  // Open settings page automatically on first install
  if (details.reason === "install") {
    chrome.runtime.openOptionsPage();
  }

  chrome.contextMenus.create({
    id: "ai-writer-fix",
    title: "✏️ Rewrite with PenPal AI",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "ai-writer-fix") {
    chrome.tabs.sendMessage(tab.id, {
      action: "openPanelWithSelection",
      selectedText: info.selectionText
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "callAI") {
    callAIAPI(request.text, request.settings)
      .then(result => sendResponse({ success: true, result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
  if (request.action === "openOptions") {
    chrome.runtime.openOptionsPage();
  }

  // ── Pop-out window ────────────────────────────────────────────────────
  if (request.action === "openPopout") {
    openOrFocusPopout(request.draft).then(sendResponse);
    return true;
  }

  if (request.action === "getPopoutInit") {
    chrome.storage.session.get("popoutDraft", ({ popoutDraft }) => {
      sendResponse({ draft: popoutDraft || null });
    });
    return true;
  }

  // A content script reports a fresh text selection on the page — relay it
  // to the pop-out window (if one is open) for live selection sync.
  if (request.action === "selectionCaptured") {
    chrome.storage.session.get("popoutWindowId", ({ popoutWindowId }) => {
      if (!popoutWindowId) return;
      chrome.runtime.sendMessage({ action: "liveSelectionUpdate", text: request.text }).catch(() => {});
    });
    return false;
  }
});

// Open the PenPal pop-out window, or focus it if it's already open.
// `draft` carries the current popup state (input text, tone, last result,
// etc.) so the standalone window can pick up right where the popup left off.
async function openOrFocusPopout(draft) {
  try {
    await chrome.storage.session.set({ popoutDraft: draft || {} });

    const { popoutWindowId } = await chrome.storage.session.get("popoutWindowId");
    if (popoutWindowId) {
      try {
        await chrome.windows.get(popoutWindowId);
        await chrome.windows.update(popoutWindowId, { focused: true });
        // Push the latest draft (e.g. a fresh selection) to the already-open window
        chrome.runtime.sendMessage({ action: "popoutDraftUpdate", draft }).catch(() => {});
        return { success: true, focused: true };
      } catch (_) {
        // Window was closed without us hearing about it — fall through and create a new one
        await chrome.storage.session.remove("popoutWindowId");
      }
    }

    // type: "popup" gives a minimal chrome-less window. Chrome's extension
    // APIs don't expose a true "always on top" flag, so this is the closest
    // we can get — `focused: true` brings it to the front on open.
    const win = await chrome.windows.create({
      url: chrome.runtime.getURL("penpal-popup.html?standalone=1"),
      type: "popup",
      width: 420,
      height: 680,
      focused: true
    });
    await chrome.storage.session.set({ popoutWindowId: win.id });
    return { success: true, created: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Clean up tracking state when the pop-out window is closed by the user.
chrome.windows.onRemoved.addListener((windowId) => {
  chrome.storage.session.get("popoutWindowId", ({ popoutWindowId }) => {
    if (popoutWindowId === windowId) {
      chrome.storage.session.remove(["popoutWindowId", "popoutDraft"]);
    }
  });
});

async function callAIAPI(text, settings) {
  const { apiKey, provider = "openrouter", model, systemPrompt, endpointOverrides, apiFormat } = settings;

  // Wrap the user text in clear delimiters so the model cannot confuse it with instructions
  const safeUserContent = `<text_to_edit>\n${text}\n</text_to_edit>`;
  const endpoint = endpointOverrides?.[provider] || PROVIDER_ENDPOINTS[provider] || PROVIDER_ENDPOINTS.openrouter;

  // Built-in providers "anthropic"/"cohere" imply their own format. Custom providers
  // (e.g. local/homelab servers) declare their format explicitly; default to
  // OpenAI-compatible, which covers Ollama, LM Studio, vLLM, llama.cpp, etc.
  const format = (provider === "anthropic" || provider === "cohere") ? provider : (apiFormat || "openai");

  const headers = { "Content-Type": "application/json" };

  // Many local/homelab servers don't require auth — only send a key if one is set
  if (apiKey) {
    if (format === "anthropic") {
      headers["anthropic-version"] = "2023-06-01";
      headers["x-api-key"] = apiKey;
    } else {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
  }

  // Provider-specific header additions
  if (provider === "openrouter" || provider === "meta") {
    headers["HTTP-Referer"] = "chrome-extension://penpal-ai-writing-assistant";
    headers["X-Title"] = "PenPal AI Writing Assistant";
  }

  let body;

  if (format === "anthropic") {
    body = JSON.stringify({
      model: model || "claude-haiku-4-5",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: safeUserContent }]
    });
  } else if (format === "cohere") {
    // Cohere v2 chat API
    body = JSON.stringify({
      model: model || "command-r",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: safeUserContent }
      ]
    });
  } else {
    // OpenAI-compatible (works for OpenAI, OpenRouter, Mistral, Groq, Together,
    // Fireworks, DeepSeek, xAI, Google, and most local servers: Ollama, LM Studio,
    // vLLM, llama.cpp, text-generation-webui, etc.)
    body = JSON.stringify({
      model: model || "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: safeUserContent }
      ],
      temperature: 0.4,
      max_tokens: 2000
    });
  }

  const response = await fetch(endpoint, { method: "POST", headers, body });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const msg = errData?.error?.message
      || errData?.message
      || `API error ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();

  // Extract raw text from provider-specific response shape
  const raw = format === "anthropic"
    ? (data.content?.[0]?.text || "")
    : (data.choices?.[0]?.message?.content || "");

  return stripCommentary(stripThinkTags(raw));
}

/**
 * Strip <think>...</think> reasoning blocks some open-weight reasoning
 * models (e.g. Qwen3, DeepSeek R1 when self-hosted) embed directly in the
 * content field instead of a separate API field. Most providers keep
 * reasoning out of `content` entirely, so this is a no-op for them — it
 * only fires when the tags are actually present.
 */
function stripThinkTags(text) {
  if (!text) return text;

  // Standard <think>...</think> (case-insensitive, multiline reasoning)
  let result = text.replace(/<think>[\s\S]*?<\/think>/gi, "");

  // Some local servers (e.g. older Ollama builds) emit an unclosed
  // <think> tag if the model's reasoning got cut off mid-stream — in
  // that case there's no real answer left, so strip everything from
  // the tag onward rather than leaving a dangling fragment.
  result = result.replace(/<think>[\s\S]*$/i, "");

  return result.trim();
}

/**
 * Strip AI preamble/postamble commentary from the response.
 * Models like GPT-4o, Claude, Gemini often add things like:
 *   "Sure! Here's the rewritten text:"
 *   "Here is the corrected version:"
 *   "I've rewritten your text below:"
 * We want only the actual edited content.
 */
function stripCommentary(text) {
  if (!text) return text;

  let result = text.trim();

  // ── Strip leading preamble lines ─────────────────────────────────────────
  // These patterns match a single opening line that is commentary, not content.
  const preamblePatterns = [
    // "Here is/Here's the ..."
    /^here'?s?\s+(is\s+)?the\s+.{0,60}[:\n]/i,
    // "Sure! Here's ..."
    /^sure[!,.]?\s+here'?s?\s+.{0,60}[:\n]/i,
    // "I've rewritten / I have rewritten ..."
    /^i'?ve?\s+(rewritten|revised|corrected|updated|improved|edited|fixed|polished)\s+.{0,80}[:\n]/i,
    // "Below is / Below you'll find ..."
    /^below\s+(is|you'?ll\s+find)\s+.{0,60}[:\n]/i,
    // "The following is ..."
    /^the\s+following\s+is\s+.{0,60}[:\n]/i,
    // "Certainly! / Of course! / Absolutely!"
    /^(certainly|of course|absolutely|gladly|happy to help)[!,.]?\s*/i,
    // "As requested, ..."
    /^as\s+requested[,.]?\s*/i,
    // Lines that are purely meta: "Rewritten version:" / "Corrected text:"
    /^(rewritten|revised|corrected|updated|improved|edited|fixed|polished|result|output)\s+(version|text|copy|content)?[:\-–]\s*/i,
  ];

  for (const pattern of preamblePatterns) {
    const match = result.match(pattern);
    if (match) {
      result = result.slice(match[0].length).trim();
      break; // only strip one preamble
    }
  }

  // ── Strip wrapping quotes if the whole response is quoted ─────────────────
  // Some models wrap the entire output in "..." or '...'
  if (
    (result.startsWith('"') && result.endsWith('"')) ||
    (result.startsWith("'") && result.endsWith("'")) ||
    (result.startsWith("\u201C") && result.endsWith("\u201D")) // curly quotes
  ) {
    result = result.slice(1, -1).trim();
  }

  // ── Strip trailing commentary lines ──────────────────────────────────────
  const trailingPatterns = [
    /\n+let me know if (you('?d| would) like|there('?s| is) anything).{0,100}$/i,
    /\n+feel free to .{0,100}$/i,
    /\n+i hope (this|that) .{0,100}$/i,
    /\n+(please )?(let me know|reach out).{0,100}$/i,
    /\n+if you (need|want|have).{0,100}$/i,
    /\n+is there anything (else|more).{0,100}$/i,
  ];

  for (const pattern of trailingPatterns) {
    result = result.replace(pattern, "").trim();
  }

  return result;
}

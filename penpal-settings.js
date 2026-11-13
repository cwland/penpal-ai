// options.js — Settings page logic


// ── Visibility icons for the API key field ────────────────────────────────
const EYE_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_OFF_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.36 18.36 0 0 1 4.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.36 18.36 0 0 1-2.16 3.19m-6.18-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

// ── Default tones ──────────────────────────────────────────────────────────
// NOTE: keep this in sync with DEFAULT_TONES in penpal-content.js and penpal-popup.js
const DEFAULT_TONES = [
  { id: "casual",       icon: "😊", label: "Casual",       prompt: "Casual and conversational — like texting a friend. Relaxed, warm, natural. Use contractions freely." },
  { id: "professional", icon: "💼", label: "Professional", prompt: "Professional and polished — suitable for work emails or LinkedIn. Confident, clear, respectful." },
  { id: "direct",       icon: "🎯", label: "Direct",       prompt: "Direct and no-nonsense — say exactly what needs to be said in as few words as possible. No filler." },
  { id: "warm",         icon: "🤗", label: "Warm",         prompt: "Warm and friendly — genuinely caring, supportive, like talking to a kind mentor or good friend." },
  { id: "witty",        icon: "😏", label: "Witty",        prompt: "Witty and clever — smart wordplay, light humor, a little dry. Intelligent but not trying too hard." },
  { id: "formal",       icon: "🎩", label: "Formal",       prompt: "Formal and precise — appropriate for official documents, legal or business correspondence. No contractions." },
  { id: "concise",      icon: "⚡", label: "Concise",      prompt: "Ultra-concise — trim every unnecessary word. Short sentences. Maximum impact, minimum length." },
  { id: "empathetic",   icon: "💙", label: "Empathetic",   prompt: "Empathetic and understanding — acknowledge feelings, show genuine care, gentle and compassionate." },
  { id: "silly",        icon: "🤪", label: "Silly",        prompt: "Silly and playful — lighthearted, fun, maybe a little goofy. Don't take things too seriously." },
  { id: "bubbly",       icon: "✨", label: "Bubbly",       prompt: "Bubbly and enthusiastic — upbeat, energetic, lots of positive energy! Exclamation points welcome." },
  { id: "creative",     icon: "🎨", label: "Creative",     prompt: "Creative and expressive — imaginative language, vivid imagery, surprising word choices." },
  { id: "persuasive",   icon: "🎯", label: "Persuasive",   prompt: "Persuasive and compelling — build a clear argument, create urgency, motivate action." },
  { id: "academic",     icon: "📚", label: "Academic",     prompt: "Academic and analytical — precise vocabulary, structured reasoning, formal scholarly tone." },
  { id: "confident",    icon: "💪", label: "Confident",    prompt: "Confident and assertive — strong declarative sentences, no hedging or apologetic language." },
  { id: "sarcastic",    icon: "🙃", label: "Sarcastic",    prompt: "Sarcastic and dry — use irony and understatement cleverly. Wit with a sharp edge. Keep it tasteful." },
  { id: "poetic",       icon: "🌸", label: "Poetic",       prompt: "Poetic and lyrical — beautiful word choices, rhythm, metaphor, a touch of the literary." },
];

// ── Emoji library for the tone icon picker ─────────────────────────────────
const EMOJI_LIBRARY = [
  { emoji: "😀", label: "Friendly" },
  { emoji: "😎", label: "Casual" },
  { emoji: "💼", label: "Professional" },
  { emoji: "🎯", label: "Direct" },
  { emoji: "✨", label: "Creative" },
  { emoji: "📚", label: "Academic" },
  { emoji: "❤️", label: "Empathetic" },
  { emoji: "🤝", label: "Collaborative" },
  { emoji: "🚀", label: "Motivational" },
  { emoji: "🧐", label: "Analytical" },
  { emoji: "😊", label: "Warm" },
  { emoji: "😏", label: "Witty" },
  { emoji: "🤗", label: "Supportive" },
  { emoji: "🙃", label: "Sarcastic" },
  { emoji: "🌸", label: "Poetic" },
  { emoji: "⚡", label: "Energetic" },
  { emoji: "💪", label: "Confident" },
  { emoji: "🎩", label: "Formal" },
  { emoji: "🤪", label: "Playful" },
  { emoji: "🎉", label: "Celebratory" },
  { emoji: "🔥", label: "Bold" },
  { emoji: "💡", label: "Insightful" },
  { emoji: "🧠", label: "Thoughtful" },
  { emoji: "🌟", label: "Inspiring" },
  { emoji: "😌", label: "Calm" },
  { emoji: "😇", label: "Sincere" },
  { emoji: "🥳", label: "Festive" },
  { emoji: "🤔", label: "Curious" },
  { emoji: "📈", label: "Persuasive" },
  { emoji: "🛡️", label: "Reassuring" },
  { emoji: "🌈", label: "Optimistic" },
  { emoji: "🧊", label: "Cool" },
  { emoji: "😢", label: "Compassionate" },
  { emoji: "😂", label: "Humorous" },
  { emoji: "🙏", label: "Grateful" },
  { emoji: "👋", label: "Welcoming" },
  { emoji: "📝", label: "Informative" },
  { emoji: "🔬", label: "Technical" },
  { emoji: "🎬", label: "Dramatic" },
  { emoji: "🌙", label: "Reflective" },
  { emoji: "☀️", label: "Cheerful" },
  { emoji: "🧘", label: "Mindful" },
  { emoji: "🏆", label: "Ambitious" },
  { emoji: "🗣️", label: "Assertive" },
  { emoji: "🤫", label: "Discreet" },
  { emoji: "🧵", label: "Narrative" },
  { emoji: "🎵", label: "Lyrical" },
  { emoji: "🛠️", label: "Practical" },
  { emoji: "🌱", label: "Encouraging" },
  { emoji: "💬", label: "Conversational" },
  { emoji: "📣", label: "Announcing" },
  { emoji: "🕊️", label: "Diplomatic" },
  { emoji: "⚖️", label: "Balanced" },
  { emoji: "🎓", label: "Scholarly" },
  { emoji: "🧩", label: "Strategic" },
  { emoji: "🚩", label: "Urgent" },
  { emoji: "💎", label: "Polished" },
  { emoji: "🎲", label: "Spontaneous" },
];

// Sort a tone list alphabetically by name — used everywhere tones are displayed
function sortTones(tones) {
  return [...tones].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
}

// ── Provider metadata ─────────────────────────────────────────────────────
const PROVIDER_INFO = {
  openrouter: {
    name: "OpenRouter",
    desc: "One API key for <strong>all providers</strong> — OpenAI, Anthropic, Google, Mistral, Meta, Qwen, and more. Includes a free-tier router.",
    url: "https://openrouter.ai", urlLabel: "Get key at openrouter.ai",
    modelsUrl: "https://openrouter.ai/models", modelsUrlLabel: "Browse all OpenRouter models →"
  },
  openai: {
    name: "OpenAI", desc: "GPT-4.1, GPT-4.1 Mini, GPT-4.1 Nano, GPT-4o. Pay-per-use.",
    url: "https://platform.openai.com/api-keys", urlLabel: "platform.openai.com",
    modelsUrl: "https://platform.openai.com/docs/models", modelsUrlLabel: "Browse all OpenAI models →"
  },
  anthropic: {
    name: "Anthropic", desc: "Claude Haiku 4.5, Sonnet 4.6, and Opus 4.8. Best for nuanced writing and long-form content.",
    url: "https://console.anthropic.com", urlLabel: "console.anthropic.com",
    modelsUrl: "https://platform.claude.com/docs/en/about-claude/models/overview", modelsUrlLabel: "Browse all Anthropic models →"
  },
  google: {
    name: "Google Gemini", desc: "Gemini 2.5 Flash Lite (cheapest), Gemini 2.5 Flash, Gemini 3.5 Flash (best quality).",
    url: "https://aistudio.google.com/app/apikey", urlLabel: "aistudio.google.com",
    modelsUrl: "https://ai.google.dev/gemini-api/docs/models", modelsUrlLabel: "Browse all Gemini models →"
  },
  mistral: {
    name: "Mistral AI", desc: "European AI — Mistral Small 4 and Large 3, plus open-weight Ministral models.",
    url: "https://console.mistral.ai", urlLabel: "console.mistral.ai",
    modelsUrl: "https://docs.mistral.ai/getting-started/models/models_overview/", modelsUrlLabel: "Browse all Mistral models →"
  },
  meta: {
    name: "Meta / Llama", desc: "Open-weight Llama 4 models via Together AI, Groq, Fireworks, or OpenRouter.",
    url: "https://openrouter.ai", urlLabel: "Use via OpenRouter (recommended)",
    modelsUrl: "https://openrouter.ai/meta-llama", modelsUrlLabel: "Browse all Meta/Llama models →"
  },
  groq: {
    name: "Groq", desc: "Blazing-fast inference for Llama, Qwen, and GPT-OSS models. Free tier available.",
    url: "https://console.groq.com/keys", urlLabel: "console.groq.com",
    modelsUrl: "https://console.groq.com/docs/models", modelsUrlLabel: "Browse all Groq models →"
  },
  cohere: {
    name: "Cohere", desc: "Command R+ is excellent for summarization and business writing. Free trial.",
    url: "https://dashboard.cohere.com/api-keys", urlLabel: "dashboard.cohere.com",
    modelsUrl: "https://docs.cohere.com/docs/models", modelsUrlLabel: "Browse all Cohere models →"
  },
  together: {
    name: "Together AI", desc: "Open-source model hosting — Llama, DeepSeek, and more. Free $25 credit.",
    url: "https://api.together.xyz/settings/api-keys", urlLabel: "api.together.xyz",
    modelsUrl: "https://www.together.ai/models", modelsUrlLabel: "Browse all Together AI models →"
  },
  fireworks: {
    name: "Fireworks AI", desc: "Fast open-model inference. Llama, DeepSeek. Free tier, then pay-per-use.",
    url: "https://fireworks.ai/account/api-keys", urlLabel: "fireworks.ai",
    modelsUrl: "https://fireworks.ai/models", modelsUrlLabel: "Browse all Fireworks models →"
  },
  deepseek: {
    name: "DeepSeek", desc: "DeepSeek V3 (Chat) and R1 (Reasoner). Very affordable, strong writing quality.",
    url: "https://platform.deepseek.com/api_keys", urlLabel: "platform.deepseek.com",
    modelsUrl: "https://api-docs.deepseek.com/quick_start/pricing", modelsUrlLabel: "Browse all DeepSeek models →"
  },
  xai: {
    name: "xAI / Grok", desc: "Grok 4 and Grok 4.3. Fast and capable, strong tool use.",
    url: "https://console.x.ai", urlLabel: "console.x.ai",
    modelsUrl: "https://docs.x.ai/docs/models", modelsUrlLabel: "Browse all xAI models →"
  }
};


// ── Icon library for the custom-provider icon picker ───────────────────────
const PROVIDER_ICON_LIBRARY = [
  // Existing providers — pick one of these if your custom endpoint mimics that API
  { emoji: "◆",  label: "OpenAI-style",    category: "Existing Providers" },
  { emoji: "△",  label: "Anthropic-style", category: "Existing Providers" },
  { emoji: "G",  label: "Google-style",    category: "Existing Providers" },
  { emoji: "⚡",  label: "OpenRouter-style", category: "Existing Providers" },
  { emoji: "▶",  label: "Groq-style",      category: "Existing Providers" },
  { emoji: "DS", label: "DeepSeek-style",  category: "Existing Providers" },
  { emoji: "M",  label: "Mistral-style",   category: "Existing Providers" },
  { emoji: "C",  label: "Cohere-style",    category: "Existing Providers" },
  // Open source / self-hosted
  { emoji: "🦙", label: "Ollama",                category: "Open Source / Self-Hosted" },
  { emoji: "🧪", label: "LM Studio",             category: "Open Source / Self-Hosted" },
  { emoji: "⚙️", label: "vLLM",                  category: "Open Source / Self-Hosted" },
  { emoji: "🏠", label: "LocalAI",               category: "Open Source / Self-Hosted" },
  { emoji: "📝", label: "Text Generation WebUI", category: "Open Source / Self-Hosted" },
  { emoji: "🌐", label: "Open WebUI",            category: "Open Source / Self-Hosted" },
  // Generic
  { emoji: "🤖", label: "Robot (default)", category: "Generic" },
  { emoji: "🖥️", label: "Server",          category: "Generic" },
  { emoji: "💻", label: "Computer",        category: "Generic" },
  { emoji: "🧠", label: "AI Brain",        category: "Generic" },
  { emoji: "✨", label: "AI Sparkle",      category: "Generic" },
  { emoji: "🔌", label: "Plug",            category: "Generic" },
  { emoji: "📡", label: "Antenna",         category: "Generic" },
  { emoji: "🛰️", label: "Satellite",       category: "Generic" },
  { emoji: "🔧", label: "Tool",            category: "Generic" },
  { emoji: "🔮", label: "Crystal Ball",    category: "Generic" },
  { emoji: "🧩", label: "Puzzle",          category: "Generic" },
  { emoji: "📦", label: "Box",             category: "Generic" },
];

// ── Quick-fill templates for common local/self-hosted LLM servers ──────────
const PROVIDER_TEMPLATES = [
  {
    label: "Apple Foundation Models", icon: "🍎",
    name: "Apple (on-device)",
    endpoint: "http://127.0.0.1:1976/v1/chat/completions",
    apiFormat: "openai",
    models: ["system"],
    description: "Apple's on-device model via Apple Foundation Models Serve on macOS. Start the server first. No API key needed. Best for grammar fixes and short rewrites."
  },
  {
    label: "Ollama", icon: "🦙",
    name: "Ollama",
    endpoint: "http://localhost:11434/v1/chat/completions",
    apiFormat: "openai",
    models: ["llama3.3", "llama4", "mistral", "qwen3", "deepseek-r1", "gemma3"],
    description: "Local models served by Ollama. Make sure Ollama is running (ollama serve) and you've pulled at least one model, e.g. 'ollama pull llama3.1'. No API key needed."
  },
  {
    label: "LM Studio", icon: "🧪",
    name: "LM Studio",
    endpoint: "http://localhost:1234/v1/chat/completions",
    apiFormat: "openai",
    models: [],
    description: "Local models served by LM Studio's local server (enable it in the Developer tab). Use the exact model identifier shown in LM Studio's server logs. No API key needed."
  },
  {
    label: "Open WebUI", icon: "🌐",
    name: "Open WebUI",
    endpoint: "http://localhost:8080/api/chat/completions",
    apiFormat: "openai",
    models: [],
    description: "Open WebUI's own OpenAI-compatible API. Requires an API key generated in Open WebUI under Settings → Account. Adjust the port if your install maps to something other than 8080 (3000 is common with Docker)."
  },
  {
    label: "LocalAI", icon: "🏠",
    name: "LocalAI",
    endpoint: "http://localhost:8080/v1/chat/completions",
    apiFormat: "openai",
    models: [],
    description: "LocalAI's drop-in OpenAI-compatible API. No API key needed unless you've set LOCALAI_API_KEY. Use the model name from your models directory or LocalAI gallery."
  },
  {
    label: "vLLM", icon: "⚙️",
    name: "vLLM",
    endpoint: "http://localhost:8000/v1/chat/completions",
    apiFormat: "openai",
    models: [],
    description: "vLLM's OpenAI-compatible server. Use the model name/path you launched vLLM with."
  },
  {
    label: "Text Gen WebUI", icon: "📝",
    name: "Text Generation WebUI",
    endpoint: "http://localhost:5000/v1/chat/completions",
    apiFormat: "openai",
    models: [],
    description: "oobabooga's text-generation-webui with the OpenAI-compatible extension enabled. Use the model name loaded in the UI."
  },
];

// ── Models per provider ───────────────────────────────────────────────────

// ── Model recommendations per provider ────────────────────────────────────

// ── State ─────────────────────────────────────────────────────────────────
let currentTone     = "casual";
let currentLanguage = "English (US)";
let currentTheme    = "default";

// Migrate legacy language values to regional variants
const LANGUAGE_MIGRATIONS = {
  "English":    "English (US)",
  "Spanish":    "Spanish (Spain)",
  "French":     "French (France)",
  "Portuguese": "Portuguese (Brazil)",
};
let isDirty         = false;   // true only after user makes a change
let savedState      = null;    // snapshot of last-saved values
let customTones = [];            // [{ id, icon, label, prompt, enabled }, ...] — built-ins + user-added, editable
let emojiPickerOnSelect = null;  // callback for whichever emoji picker trigger is currently open

// ── Init ──────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {

  // ── App version ─────────────────────────────────────────────────────────
  let appVersion = "";
  try { appVersion = chrome.runtime.getManifest().version; } catch { appVersion = ""; }

  // Version badge in the page header, alongside the branding.
  const headerVersionEl = document.getElementById("page-version");
  if (headerVersionEl) headerVersionEl.textContent = appVersion ? "v" + appVersion : "";

  // ── Tabs ────────────────────────────────────────────────────────────────
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    });
  });

  // ── Sub-tabs (nested within a main tab, e.g. API "Defaults" vs "Manage Default Providers" vs "Custom Providers") ──
  document.querySelectorAll(".subtab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const group = btn.dataset.group;
      document.querySelectorAll(`.subtab-btn[data-group="${group}"]`).forEach(b => b.classList.remove("active"));
      document.querySelectorAll(`.subtab-panel[data-group="${group}"]`).forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.querySelector(`.subtab-panel[data-group="${group}"][data-subtab="${btn.dataset.subtab}"]`)
        ?.classList.add("active");
    });
  });

  // ── Emoji picker — shared popover for tone icons ──────────────────────────
  document.getElementById("emoji-picker-search").addEventListener("input", (e) => {
    renderEmojiPickerList(e.target.value);
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".emoji-picker-popover") && !e.target.closest(".emoji-pick-btn")) {
      closeEmojiPicker();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeEmojiPicker();
  });

  // "Go to API Settings" link in setup banner
  document.getElementById("banner-go-api").addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelector('[data-tab="api"]').click();
  });

  // ── Load saved settings ──────────────────────────────────────────────────
  chrome.storage.sync.get([
    "defaultTone",
    "customInstructions", "writingStyle", "language", "theme",
    "customTones",
    "showLangSelector", "showToneSelector", "showEdgeIcon", "stripDashes", "historyLimit"
  ], (data) => {

    customTones       = (data.customTones && data.customTones.length)
      ? data.customTones
      : DEFAULT_TONES.map(t => ({ ...t, enabled: true }));

    if (data.writingStyle)      document.getElementById("writing-style").value = data.writingStyle;
    if (data.customInstructions) document.getElementById("custom-instructions").value = data.customInstructions;

    if (data.defaultTone) currentTone = data.defaultTone;
    // If the saved default tone no longer exists or was disabled, fall back gracefully
    const enabledTones = customTones.filter(t => t.enabled !== false);
    if (!enabledTones.some(t => t.id === currentTone)) {
      currentTone = enabledTones.find(t => t.id === "casual")?.id || enabledTones[0]?.id || customTones[0]?.id || "casual";
    }
    renderToneGrid();
    renderToneList();

    if (data.language) {
      // Migrate legacy non-regional language values to their regional equivalents
      currentLanguage = LANGUAGE_MIGRATIONS[data.language] ?? data.language;
      document.querySelectorAll(".lang-opt").forEach(b =>
        b.classList.toggle("active", b.dataset.lang === currentLanguage));
    }

    if (data.theme) {
      currentTheme = data.theme;
      document.querySelectorAll(".theme-card").forEach(c =>
        c.classList.toggle("active", c.dataset.theme === currentTheme));
    }

    // Browser edge icon toggle (defaults to on when not yet set)
    const edgeToggle = document.getElementById("show-edge-icon");
    if (edgeToggle) {
      edgeToggle.checked = data.showEdgeIcon !== false;
      edgeToggle.addEventListener("change", markDirty);
    }

    // Em/en dash stripping toggle (defaults to on when not yet set)
    const stripDashesToggle = document.getElementById("strip-dashes");
    if (stripDashesToggle) {
      stripDashesToggle.checked = data.stripDashes !== false;
      stripDashesToggle.addEventListener("change", markDirty);
    }

    // Rewrite history limit (defaults to 100 when not yet set)
    const historyLimitSel = document.getElementById("history-limit");
    if (historyLimitSel) {
      const lim = String(Number.isFinite(data.historyLimit) ? data.historyLimit : 100);
      if (![...historyLimitSel.options].some(o => o.value === lim)) {
        historyLimitSel.add(new Option(`${lim} rewrites`, lim));
      }
      historyLimitSel.value = lim;
      historyLimitSel.addEventListener("change", checkDirty);
    }

    // Snapshot so we can compare later
    savedState = captureState();
    isDirty = false;
    updateUnsavedUI();
  });

  // Provider selector + custom-provider list are (re)rendered after settings load below.

  // ── Language buttons ─────────────────────────────────────────────────────
  document.querySelectorAll(".lang-opt").forEach(btn => {
    btn.addEventListener("click", () => {
      currentLanguage = btn.dataset.lang;
      document.querySelectorAll(".lang-opt").forEach(b =>
        b.classList.toggle("active", b.dataset.lang === currentLanguage));
      markDirty();
    });
  });

  // ── Theme cards ────────────────────────────────────────────────────────────
  document.querySelectorAll(".theme-card").forEach(card => {
    card.addEventListener("click", () => {
      currentTheme = card.dataset.theme;
      document.querySelectorAll(".theme-card").forEach(c =>
        c.classList.toggle("active", c.dataset.theme === currentTheme));
      markDirty();
    });
  });

  // ── Text inputs / selects → mark dirty only if value changed from saved ──
  document.getElementById("writing-style").addEventListener("input", checkDirty);
  document.getElementById("custom-instructions").addEventListener("input", checkDirty);
  // ── Save ─────────────────────────────────────────────────────────────────
  document.getElementById("save-btn").addEventListener("click", () => {
    const settings = {
      defaultTone:        currentTone,
      language:           currentLanguage,
      theme:              currentTheme,
      showEdgeIcon:       document.getElementById("show-edge-icon")?.checked !== false,
      stripDashes:        document.getElementById("strip-dashes")?.checked !== false,
      historyLimit:       readHistoryLimit(),
      writingStyle:       document.getElementById("writing-style").value.trim(),
      customInstructions: document.getElementById("custom-instructions").value.trim()
    };

    chrome.storage.sync.set(settings, () => {
      savedState = captureState();
      isDirty = false;
      updateUnsavedUI();
      showSavedToast();
    });
  });

  // ── Custom Tones — emoji picker for the "Add New Tone" form ─────────────
  document.getElementById("new-tone-emoji-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    openEmojiPicker(btn, (emoji) => {
      btn.dataset.emoji = emoji;
      btn.textContent = emoji;
    });
  });

  // ── Custom Tones — Add a new tone ─────────────────────────────────────────
  document.getElementById("add-tone-btn").addEventListener("click", () => {
    const emojiBtn    = document.getElementById("new-tone-emoji-btn");
    const labelInput  = document.getElementById("new-tone-label");
    const promptInput = document.getElementById("new-tone-prompt");

    const icon   = emojiBtn.dataset.emoji || "💬";
    const label  = labelInput.value.trim().slice(0, 20);
    const prompt = promptInput.value.trim();

    if (!label) { showToneMsg("error", "⚠ Please give your tone a name."); return; }
    if (!prompt) { showToneMsg("error", "⚠ Please describe how the AI should write in this tone."); return; }

    const id = makeToneId(label);
    customTones.push({ id, icon, label, prompt, enabled: true });

    chrome.storage.sync.set({ customTones }, () => {
      emojiBtn.dataset.emoji = "💬";
      emojiBtn.textContent = "💬";
      labelInput.value = "";
      promptInput.value = "";
      renderToneGrid();
      renderToneList();
      showToneMsg("success", `✓ Added "${icon} ${label}" — it now appears as a tone chip and in the Default Tone list.`);
    });
  });

  // ── Custom Tones — Restore defaults ───────────────────────────────────────
  document.getElementById("restore-tones-btn").addEventListener("click", () => {
    const ok = window.confirm(
      "Restore the 16 built-in tones?\n\nThis will permanently delete any tones you've added, edited, renamed, or disabled, and set \"Casual\" as your default tone."
    );
    if (!ok) return;

    customTones = DEFAULT_TONES.map(t => ({ ...t, enabled: true }));
    currentTone = "casual";
    markDirty();

    chrome.storage.sync.set({ customTones }, () => {
      renderToneGrid();
      renderToneList();
      showToneListMsg("success", "✓ Restored the built-in tones and set Casual as your default.");
    });
  });
});

// ── Rewrite history (AI Models & Settings → History) ─────────────────────

function readHistoryLimit() {
  const v = parseInt(document.getElementById("history-limit")?.value, 10);
  return Number.isFinite(v) && v >= 0 ? v : 100;
}

function refreshHistoryCount() {
  const el = document.getElementById("history-count");
  if (!el) return;
  chrome.storage.local.get("penpalHistory", (d) => {
    const n = Array.isArray(d?.penpalHistory) ? d.penpalHistory.length : 0;
    el.textContent = n === 0 ? "No rewrites saved yet." : `${n.toLocaleString()} rewrite${n === 1 ? "" : "s"} saved on this device.`;
    const clearBtn = document.getElementById("history-clear-btn");
    if (clearBtn) clearBtn.disabled = n === 0;
  });
}

function setupHistorySettings() {
  refreshHistoryCount();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.penpalHistory) refreshHistoryCount();
  });

  document.getElementById("history-open-btn")?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "openHistory", opener: { source: "settings" } }, () => {
      void chrome.runtime.lastError;
    });
  });

  // Two-click confirm (no blocking browser dialogs).
  const clearBtn = document.getElementById("history-clear-btn");
  const msg = document.getElementById("history-msg");
  let confirmTimer = null;
  const resetClear = () => { clearBtn.textContent = "🗑 Clear History"; clearBtn.dataset.confirm = ""; };
  clearBtn?.addEventListener("click", () => {
    if (clearBtn.dataset.confirm !== "1") {
      clearBtn.dataset.confirm = "1";
      clearBtn.textContent = "Click again to delete all";
      clearTimeout(confirmTimer);
      confirmTimer = setTimeout(resetClear, 3000);
      return;
    }
    clearTimeout(confirmTimer);
    resetClear();
    chrome.storage.local.remove("penpalHistory", () => {
      if (!msg) return;
      msg.className = "test-result success";
      msg.textContent = "✓ History cleared.";
      msg.style.display = "block";
      setTimeout(() => { msg.style.display = "none"; }, 3000);
    });
  });
}

document.addEventListener("DOMContentLoaded", setupHistorySettings);

// ── Dirty tracking ────────────────────────────────────────────────────────

function captureState() {
  return {
    tone:               currentTone,
    language:           currentLanguage,
    theme:              currentTheme,
    showEdgeIcon:       document.getElementById("show-edge-icon")?.checked !== false,
    stripDashes:        document.getElementById("strip-dashes")?.checked !== false,
    historyLimit:       readHistoryLimit(),
    writingStyle:       document.getElementById("writing-style").value.trim(),
    customInstructions: document.getElementById("custom-instructions").value.trim(),
  };
}

function statesEqual(a, b) {
  if (!a || !b) return false;
  return Object.keys(a).every(k => a[k] === b[k]);
}

// Called when clicking buttons (provider/tone/language) — always dirty
function markDirty() {
  isDirty = true;
  updateUnsavedUI();
}

// Called on text input events — only dirty if actually different from saved
function checkDirty() {
  isDirty = !statesEqual(captureState(), savedState);
  updateUnsavedUI();
}

function updateUnsavedUI() {
  const banner  = document.getElementById("unsaved-banner");
  const saveBar = document.getElementById("save-bar");

  if (isDirty) {
    banner.classList.add("visible");
    saveBar.classList.add("visible");
    // Hide the saved toast immediately if something changed
    document.getElementById("saved-toast").classList.remove("visible");
  } else {
    banner.classList.remove("visible");
    saveBar.classList.remove("visible");
  }

  updateTabDots();
}

function updateTabDots() {
  // Only show dot on a tab if that tab has unsaved changes
  const current = captureState();
  const saved   = savedState || {};

  const tabDirty = {
    api:        current.historyLimit !== saved.historyLimit,
    style:      current.writingStyle !== saved.writingStyle || current.customInstructions !== saved.customInstructions || current.tone !== saved.tone || current.stripDashes !== saved.stripDashes,
    language:   current.language !== saved.language,
    appearance: current.theme !== saved.theme || current.showEdgeIcon !== saved.showEdgeIcon,
  };

  document.querySelectorAll(".tab-btn[data-tab]").forEach(btn => {
    const tab = btn.dataset.tab;
    btn.classList.toggle("has-changes", !!tabDirty[tab]);
  });
}

// ── Toast ─────────────────────────────────────────────────────────────────
let toastTimer = null;
function showSavedToast() {
  const toast = document.getElementById("saved-toast");
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 3000);
}

// ── Provider UI helpers ───────────────────────────────────────────────────

// Glyphs for the built-in provider pills (matches the .logo-<id> CSS classes)
const PROVIDER_GLYPHS = {
  openrouter: "⚡", openai: "◆", anthropic: "△", google: "G", mistral: "M",
  meta: "🦙", groq: "▶", cohere: "C", together: "∞", fireworks: "🔥",
  deepseek: "DS", xai: "𝕏"
};

// ── Manage Default Providers — model management ────────────────────────────

function escapeHTML(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Custom tones ──────────────────────────────────────────────────────────

function makeToneId(label) {
  const base = label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "tone";
  let id = base;
  let n = 2;
  while (customTones.some(t => t.id === id)) {
    id = `${base}_${n++}`;
  }
  return id;
}

function renderToneGrid() {
  const grid = document.getElementById("tone-grid");
  const visible = sortTones(customTones.filter(t => t.enabled !== false));

  grid.innerHTML = visible.map(t => `
    <button class="tone-opt ${t.id === currentTone ? "active" : ""}" data-tone="${escapeHTML(t.id)}">${escapeHTML(t.icon)} ${escapeHTML(t.label)}</button>
  `).join("");

  grid.querySelectorAll(".tone-opt").forEach(btn => {
    btn.addEventListener("click", () => setDefaultTone(btn.dataset.tone));
  });
}

// ── Icon/emoji picker (shared popover) ──────────────────────────────────────

let emojiPickerLibrary = EMOJI_LIBRARY;

function openIconPicker(triggerEl, library, onSelect) {
  const popover = document.getElementById("emoji-picker-popover");
  const search  = document.getElementById("emoji-picker-search");

  emojiPickerLibrary = library;
  emojiPickerOnSelect = onSelect;

  const rect = triggerEl.getBoundingClientRect();
  const width = 260;
  popover.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)) + "px";
  popover.style.top  = (rect.bottom + 6) + "px";
  popover.style.display = "flex";

  search.value = "";
  renderEmojiPickerList("");
  search.focus();
}

// Backwards-compatible wrapper used by the tone icon pickers
function openEmojiPicker(triggerEl, onSelect) {
  openIconPicker(triggerEl, EMOJI_LIBRARY, onSelect);
}

function closeEmojiPicker() {
  document.getElementById("emoji-picker-popover").style.display = "none";
  emojiPickerOnSelect = null;
}

function renderEmojiPickerList(query) {
  const list = document.getElementById("emoji-picker-list");
  const library = emojiPickerLibrary;
  const q = query.trim().toLowerCase();
  const items = q
    ? library.filter(e => e.label.toLowerCase().includes(q) || e.emoji.includes(q))
    : library;

  if (!items.length) {
    list.innerHTML = `<div class="emoji-pick-empty">No matching icon.</div>`;
    return;
  }

  // Group by category (only when not searching and categories are present)
  const hasCategories = !q && items.some(e => e.category);
  let html = "";
  let lastCategory = null;

  items.forEach(e => {
    if (hasCategories && e.category !== lastCategory) {
      html += `<div class="icon-pick-category">${escapeHTML(e.category)}</div>`;
      lastCategory = e.category;
    }
    html += `
      <button type="button" class="emoji-pick-item" data-emoji="${escapeHTML(e.emoji)}">
        <span class="emoji-pick-glyph">${e.emoji}</span>${escapeHTML(e.label)}
      </button>
    `;
  });

  list.innerHTML = html;

  list.querySelectorAll(".emoji-pick-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const emoji = btn.dataset.emoji;
      const cb = emojiPickerOnSelect;
      closeEmojiPicker();
      if (cb) cb(emoji);
    });
  });
}

// ── Tone table (Your Tones) ─────────────────────────────────────────────────

function renderToneList() {
  const list = document.getElementById("tone-list");
  const sorted = sortTones(customTones);

  if (!sorted.length) {
    list.innerHTML = `<div class="custom-model-empty">No tones left — add one above, or restore the built-in defaults.</div>`;
    return;
  }

  list.innerHTML = sorted.map(t => {
    const isDefault = t.id === currentTone;
    const isEnabled = t.enabled !== false;
    return `
      <div class="tone-row ${isEnabled ? "" : "disabled"}" data-id="${escapeHTML(t.id)}">
        <div class="tone-row-main">
          <input type="checkbox" class="tone-enable-checkbox" ${isEnabled ? "checked" : ""} title="${isEnabled ? "Disable" : "Enable"} this tone">
          <input type="radio" name="default-tone-radio" class="tone-default-radio" ${isDefault ? "checked" : ""} ${isEnabled ? "" : "disabled"} title="${isDefault ? "This is your default tone" : "Set as default tone"}">
          <button type="button" class="emoji-pick-btn" data-emoji="${escapeHTML(t.icon)}" title="Choose an icon">${escapeHTML(t.icon)}</button>
          <input type="text" class="tone-name-input" value="${escapeHTML(t.label)}" maxlength="20" title="Tone name (max 20 characters)">
          <button class="tone-delete-btn" ${isDefault ? "disabled" : ""} title="${isDefault ? "Set a different default tone before deleting this one" : "Remove this tone"}">✕</button>
        </div>
        <div class="tone-row-prompt">
          <textarea class="tone-prompt-input" title="AI prompt — how should the AI rewrite text in this tone?">${escapeHTML(t.prompt)}</textarea>
        </div>
      </div>
    `;
  }).join("");

  list.querySelectorAll(".tone-row").forEach(row => {
    const id = row.dataset.id;

    row.querySelector(".tone-enable-checkbox").addEventListener("change", (e) => toggleToneEnabled(id, e.target.checked));
    row.querySelector(".tone-default-radio").addEventListener("change", (e) => { if (e.target.checked) setDefaultTone(id); });
    row.querySelector(".tone-name-input").addEventListener("change", (e) => updateToneField(id, "label", e.target.value));
    row.querySelector(".tone-prompt-input").addEventListener("change", (e) => updateToneField(id, "prompt", e.target.value));
    row.querySelector(".tone-delete-btn").addEventListener("click", () => removeTone(id));

    row.querySelector(".emoji-pick-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      openEmojiPicker(btn, (emoji) => updateToneIcon(id, emoji));
    });
  });
}

// ── Tone field updates ───────────────────────────────────────────────────────

function setDefaultTone(id) {
  if (id === currentTone) return;
  const tone = customTones.find(t => t.id === id);
  if (!tone || tone.enabled === false) return; // only enabled tones can become the default

  currentTone = id;
  renderToneGrid();
  renderToneList();
  markDirty();
}

function toggleToneEnabled(id, enabled) {
  if (!enabled && id === currentTone) {
    showToneListMsg("error", "⚠ Pick a different default tone before disabling this one.");
    renderToneList(); // revert the checkbox back to checked
    return;
  }

  const tone = customTones.find(t => t.id === id);
  if (!tone) return;
  tone.enabled = enabled;

  chrome.storage.sync.set({ customTones }, () => {
    renderToneGrid();
    renderToneList();
  });
}

function updateToneIcon(id, emoji) {
  const tone = customTones.find(t => t.id === id);
  if (!tone) return;
  tone.icon = emoji;

  chrome.storage.sync.set({ customTones }, () => {
    renderToneGrid();
    renderToneList();
  });
}

function updateToneField(id, field, value) {
  const tone = customTones.find(t => t.id === id);
  if (!tone) return;

  if (field === "label")  tone.label  = value.trim().slice(0, 20) || tone.label;
  if (field === "prompt") tone.prompt = value.trim();

  chrome.storage.sync.set({ customTones }, () => {
    // Name changes affect sort order and the Default Tone grid too
    renderToneGrid();
    renderToneList();
  });
}

function removeTone(id) {
  if (id === currentTone) {
    showToneListMsg("error", "⚠ This is your default tone — pick a different default before deleting it.");
    return;
  }

  const tone = customTones.find(t => t.id === id);
  customTones = customTones.filter(t => t.id !== id);

  chrome.storage.sync.set({ customTones }, () => {
    renderToneGrid();
    renderToneList();
    showToneListMsg("success", `Removed "${tone?.icon || ""} ${tone?.label || id}".`);
  });
}

function showToneMsg(type, text) {
  const el = document.getElementById("tone-msg");
  el.textContent = text;
  el.className = "test-result " + type;
  el.style.display = "block";
}

function showToneListMsg(type, text) {
  const el = document.getElementById("tone-list-msg");
  el.textContent = text;
  el.className = "test-result " + type;
  el.style.display = "block";
}

// ── Custom Providers ─────────────────────────────────────────────────────

// Turn an endpoint URL into a host permission pattern, e.g.
// "http://localhost:11434/v1/chat/completions" → "http://localhost:11434/*"
// Returns null if the URL is invalid or not http(s).
function originPatternForURL(urlStr) {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return `${u.protocol}//${u.host}/*`;
  } catch {
    return null;
  }
}

// ── Model name chips (Add a Custom Provider form) ──────────────────────────

// ── Connectivity testing ──────────────────────────────────────────────────

// ── Debug Bubble (Custom Providers — local LLM testing) ────────────────────
// Shows the exact JSON payload sent to the endpoint, the raw response, and
// any parsing/format error — exclusive to custom model testing, where a
// bare "connection failed" often isn't enough to debug a local server.

function safeStringify(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") {
    // Try to pretty-print if it's JSON text; otherwise show as-is.
    try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
  }
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

function renderProviderDebugBubble(debugInfo) {
  const bubble = document.getElementById("provider-debug-bubble");
  if (!debugInfo) { bubble.style.display = "none"; return; }

  bubble.style.display = "block";

  const reqEl = document.getElementById("provider-debug-request");
  reqEl.textContent = debugInfo.requestBody
    ? safeStringify(debugInfo.requestBody)
    : "(request was not sent — see error below)";

  const respSection = document.getElementById("provider-debug-response-section");
  const respEl      = document.getElementById("provider-debug-response");
  if (debugInfo.rawResponse) {
    respSection.style.display = "block";
    respEl.textContent = safeStringify(debugInfo.rawResponse);
  } else {
    respSection.style.display = "none";
  }

  const errSection = document.getElementById("provider-debug-error-section");
  const errEl       = document.getElementById("provider-debug-error");
  const errText      = debugInfo.parseError || debugInfo.networkError || "";
  if (errText) {
    errSection.style.display = "block";
    errEl.textContent = errText;
  } else {
    errSection.style.display = "none";
  }

  // Auto-expand the body whenever there's something worth looking at on failure
  if (errText) {
    document.getElementById("provider-debug-body").style.display = "block";
    document.getElementById("provider-debug-caret").classList.add("open");
  }
}

// ── Add/Edit Custom Provider form helpers ───────────────────────────────────

// ── Quick-fill templates ────────────────────────────────────────────────────

// ── Your Custom Providers list ──────────────────────────────────────────────


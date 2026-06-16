// options.js — Settings page logic

// ── Default API endpoints ─────────────────────────────────────────────────
// NOTE: keep this in sync with PROVIDER_ENDPOINTS in background.js
const PROVIDER_ENDPOINTS = {
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
  openai:     "https://api.openai.com/v1/chat/completions",
  anthropic:  "https://api.anthropic.com/v1/messages",
  google:     "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  mistral:    "https://api.mistral.ai/v1/chat/completions",
  meta:       "https://openrouter.ai/api/v1/chat/completions", // routed via openrouter
  groq:       "https://api.groq.com/openai/v1/chat/completions",
  cohere:     "https://api.cohere.ai/v2/chat",
  together:   "https://api.together.xyz/v1/chat/completions",
  fireworks:  "https://api.fireworks.ai/inference/v1/chat/completions",
  deepseek:   "https://api.deepseek.com/v1/chat/completions",
  xai:        "https://api.x.ai/v1/chat/completions"
};

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

// Snapshot of the built-in provider IDs, captured before any custom providers
// get registered into PROVIDER_INFO — used to scope "Manage Default Providers"
// and to split the provider selector into "Default" vs "Custom" groups.
const BUILTIN_PROVIDER_IDS = Object.keys(PROVIDER_INFO);

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
const PROVIDER_MODELS = {
  openrouter: [
    // OpenAI via OpenRouter — mini/nano confirmed live; plain gpt-4.1 omitted (failed live test)
    { value: "openai/gpt-4.1-mini",          label: "GPT-4.1 Mini — fast & cheap" },
    { value: "openai/gpt-4.1-nano",          label: "GPT-4.1 Nano — fastest & cheapest" },
    // Anthropic via OpenRouter — confirmed working
    { value: "anthropic/claude-sonnet-4.6",  label: "Claude Sonnet 4.6 — best Anthropic" },
    { value: "anthropic/claude-haiku-4.5",   label: "Claude Haiku 4.5 — fast & cheap" },
    // Google via OpenRouter — confirmed working
    { value: "google/gemini-2.5-flash",      label: "Gemini 2.5 Flash — fast" },
    { value: "google/gemini-3.5-flash",      label: "Gemini 3.5 Flash — best Google" },
    // Mistral via OpenRouter — confirmed working
    { value: "mistralai/mistral-large-2512", label: "Mistral Large 3 — best Mistral" },
    { value: "mistralai/mistral-small-2603", label: "Mistral Small 4 — lightweight" },
    // Qwen via OpenRouter — confirmed live
    { value: "qwen/qwen3.6-flash",           label: "Qwen3.6 Flash — fast & very cheap" },
    // DeepSeek via OpenRouter — confirmed working
    { value: "deepseek/deepseek-chat-v3-0324", label: "DeepSeek V3 — best value" },
    // xAI via OpenRouter — confirmed working
    { value: "x-ai/grok-4.3",               label: "Grok 4.3 — xAI flagship" },
    // Meta via OpenRouter — paid
    { value: "meta-llama/llama-4-maverick",              label: "Llama 4 Maverick — paid" },
    // OpenRouter's free router — auto-picks best available free model
    { value: "openrouter/free",                          label: "Free Models Router — auto-picks best free model" },
  ],
  openai: [
    // Slugs for direct OpenAI API (not OpenRouter)
    { value: "gpt-4.1",      label: "GPT-4.1 — best quality" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 Mini — fast & cheap" },
    { value: "gpt-4.1-nano", label: "GPT-4.1 Nano — cheapest" },
    { value: "gpt-4o",       label: "GPT-4o — still available via API" },
    { value: "gpt-4o-mini",  label: "GPT-4o Mini — still available via API" },
  ],
  anthropic: [
    // Slugs for direct Anthropic API (verified: platform.claude.com/docs/models)
    { value: "claude-haiku-4-5",  label: "Claude Haiku 4.5 — fast & cheap" },
    { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 — balanced" },
    { value: "claude-opus-4-8",   label: "Claude Opus 4.8 — most capable" },
  ],
  google: [
    // Slugs for direct Google Gemini API (OpenAI-compat endpoint)
    { value: "gemini-2.5-flash-lite-preview-06-17", label: "Gemini 2.5 Flash Lite — cheapest" },
    { value: "gemini-2.5-flash",                    label: "Gemini 2.5 Flash — fast" },
    { value: "gemini-3.5-flash",                    label: "Gemini 3.5 Flash — best quality" },
  ],
  mistral: [
    // Slugs for direct Mistral API (verified: docs.mistral.ai)
    { value: "mistral-small-latest", label: "Mistral Small 4 — lightweight" },
    { value: "mistral-large-latest", label: "Mistral Large 3 — best quality" },
  ],
  meta: [
    // Meta models via OpenRouter (verified: openrouter.ai/meta-llama)
    { value: "meta-llama/llama-4-maverick",                 label: "Llama 4 Maverick — paid" },
    { value: "meta-llama/llama-3.3-70b-instruct:free",     label: "Llama 3.3 70B — free (capacity limited)" },
  ],
  groq: [
    // Slugs verified: console.groq.com/docs/models
    { value: "llama-3.1-8b-instant",                      label: "Llama 3.1 8B Instant — fastest" },
    { value: "llama-3.3-70b-versatile",                   label: "Llama 3.3 70B Versatile — best quality" },
    { value: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout" },
    { value: "openai/gpt-oss-20b",                        label: "GPT-OSS 20B — OpenAI open-source" },
    { value: "qwen/qwen3-32b",                            label: "Qwen3 32B" },
  ],
  cohere: [
    { value: "command-r-plus", label: "Command R+ — best quality" },
    { value: "command-r",      label: "Command R — balanced" },
  ],
  together: [
    { value: "meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo", label: "Llama 3.3 70B Turbo — best quality" },
    { value: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",  label: "Llama 3.1 8B Turbo — cheapest" },
    { value: "deepseek-ai/DeepSeek-V3",                       label: "DeepSeek V3" },
  ],
  fireworks: [
    { value: "accounts/fireworks/models/llama-v3p3-70b-instruct", label: "Llama 3.3 70B — best quality" },
    { value: "accounts/fireworks/models/llama-v3p1-8b-instruct",  label: "Llama 3.1 8B — fastest" },
    { value: "accounts/fireworks/models/deepseek-v3",             label: "DeepSeek V3" },
  ],
  deepseek: [
    // Slugs verified: platform.deepseek.com/api-docs
    { value: "deepseek-chat",     label: "DeepSeek V3 — best value" },
    { value: "deepseek-reasoner", label: "DeepSeek R1 — reasoning" },
  ],
  xai: [
    // Slugs verified: openrouter.ai/x-ai
    { value: "grok-4",      label: "Grok 4 — most capable" },
    { value: "grok-4.3",    label: "Grok 4.3 — fast & reliable" },
    { value: "grok-4.1-fast", label: "Grok 4.1 Fast — agentic tool calling" },
  ]
};

// ── Model recommendations per provider ────────────────────────────────────
const MODEL_RECOMMENDATIONS = {
  openrouter: [
    { badge: "best",  label: "Best for writing", model: "anthropic/claude-sonnet-4.6",   note: "Claude Sonnet 4.6 — nuanced, natural prose" },
    { badge: "fast",  label: "Fast & cheap",     model: "qwen/qwen3.6-flash",            note: "Qwen3.6 Flash — very low cost with solid quality" },
    { badge: "free",  label: "Free tier",        model: "openrouter/free",               note: "Free Models Router — automatically picks the best available free model. Quality varies but it's a great way to get started at no cost." },
  ],
  openai: [
    { badge: "best",  label: "Best for writing", model: "gpt-4.1",      note: "GPT-4.1 — richest vocabulary, best at matching tone" },
    { badge: "value", label: "Best value",       model: "gpt-4.1-mini", note: "GPT-4.1 Mini — 90% of the quality at a fraction of the cost" },
  ],
  anthropic: [
    { badge: "best",  label: "Best for writing", model: "claude-sonnet-4-6", note: "Claude Sonnet 4.6 — exceptional at matching tone and voice" },
    { badge: "fast",  label: "Fast & cheap",     model: "claude-haiku-4-5",  note: "Claude Haiku 4.5 — great for quick grammar fixes" },
  ],
  google: [
    { badge: "best",  label: "Best quality", model: "gemini-3.5-flash", note: "Gemini 3.5 Flash — Google's strongest model for writing" },
    { badge: "value", label: "Best value",   model: "gemini-2.5-flash", note: "Gemini 2.5 Flash — fast and reliable" },
  ],
  mistral: [
    { badge: "best",  label: "Best for writing", model: "mistral-large-latest", note: "Mistral Large 3 — best prose quality in the Mistral family" },
    { badge: "value", label: "Best value",       model: "mistral-small-latest", note: "Mistral Small 4 — lightweight and capable" },
  ],
  meta: [
    { badge: "best",  label: "Best quality", model: "meta-llama/llama-4-maverick",              note: "Llama 4 Maverick — best open-source writing quality" },
    { badge: "free",  label: "Free tier",    model: "meta-llama/llama-3.3-70b-instruct:free",   note: "Llama 3.3 70B — free via OpenRouter, subject to capacity limits" },
  ],
  groq: [
    { badge: "best",  label: "Best quality", model: "llama-3.3-70b-versatile", note: "Llama 3.3 70B — best writing quality on Groq" },
    { badge: "fast",  label: "Fastest",      model: "llama-3.1-8b-instant",    note: "Llama 3.1 8B Instant — near-instant responses" },
  ],
  cohere: [
    { badge: "best",  label: "Best for writing", model: "command-r-plus", note: "Command R+ — Cohere's strongest model for prose" },
    { badge: "value", label: "Good value",       model: "command-r",      note: "Command R — solid for everyday corrections" },
  ],
  together: [
    { badge: "best",  label: "Best quality", model: "meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo", note: "Llama 3.3 70B Turbo — fast and high quality" },
    { badge: "value", label: "Best value",   model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",  note: "Llama 3.1 8B Turbo — cheap and quick" },
  ],
  fireworks: [
    { badge: "best",  label: "Best quality", model: "accounts/fireworks/models/llama-v3p3-70b-instruct", note: "Llama 3.3 70B — best writing results" },
    { badge: "fast",  label: "Fastest",      model: "accounts/fireworks/models/llama-v3p1-8b-instruct",  note: "Llama 3.1 8B — fastest option" },
  ],
  deepseek: [
    { badge: "value", label: "Best value",   model: "deepseek-chat",     note: "DeepSeek V3 — excellent quality for the price" },
    { badge: "best",  label: "Most capable", model: "deepseek-reasoner", note: "DeepSeek R1 — great for complex rewrites" },
  ],
  xai: [
    { badge: "best",  label: "Best available", model: "grok-4",        note: "Grok 4 — most capable xAI model" },
    { badge: "fast",  label: "Faster option",  model: "grok-4.1-fast", note: "Grok 4.1 Fast — great for agentic tool use" },
  ],
};

// ── State ─────────────────────────────────────────────────────────────────
let currentProvider = "openrouter";
let currentTone     = "casual";
let currentLanguage = "English (US)";
let currentTheme    = "default";

// Migrate legacy language values to regional variants
const LANGUAGE_MIGRATIONS = {
  "English":    "English (US)",
  "Spanish":    "Spanish (Spain)",
  "Portuguese": "Portuguese (Brazil)",
};
let isDirty         = false;   // true only after user makes a change
let savedState      = null;    // snapshot of last-saved values
let customModels    = {};      // { provider: [{ value, label }, ...] }
let hiddenModels    = {};       // { provider: [value, value, ...] }
let endpointOverrides = {};     // { provider: "https://..." }
let customTabProvider = "openrouter"; // provider currently selected on the "Manage Default Providers" sub-tab (independent of currentProvider, built-ins only)
let apiKeys = {};                // { provider: "sk-..." } — each provider keeps its own key
let customTones = [];            // [{ id, icon, label, prompt, enabled }, ...] — built-ins + user-added, editable
let emojiPickerOnSelect = null;  // callback for whichever emoji picker trigger is currently open
let customProviders = [];        // [{ id, name, icon, endpoint, apiFormat, description }, ...] — user-added providers
let newProviderModels = [];      // model names being entered in the "Add a Custom Provider" form
let templateExampleModels = [];  // example model IDs shown (not auto-added) when a Quick Template is applied
let editingProviderId = null;    // id of the custom provider currently being edited, or null when adding a new one

// ── Init ──────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {

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

  // ── Manage Default Providers — provider selector (independent of the Defaults tab) ──
  populateCustomProviderSelect();
  document.getElementById("custom-provider-select").addEventListener("change", (e) => {
    customTabProvider = e.target.value;
    updateCustomTabUI(customTabProvider);
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
    "apiKey", "apiKeys", "provider", "model", "defaultTone",
    "customInstructions", "writingStyle", "language", "theme",
    "customModels", "hiddenModels", "endpointOverrides", "customTones", "customProviders",
    "showLangSelector", "showToneSelector"
  ], (data) => {

    customModels      = data.customModels || {};
    hiddenModels      = data.hiddenModels || {};
    endpointOverrides = data.endpointOverrides || {};
    customTones       = (data.customTones && data.customTones.length)
      ? data.customTones
      : DEFAULT_TONES.map(t => ({ ...t, enabled: true }));

    // ── Custom providers — register each into PROVIDER_INFO/PROVIDER_MODELS/etc ──
    customProviders = data.customProviders || [];
    customProviders.forEach(registerCustomProvider);

    // ── Per-provider API keys, with one-time migration from the old single "apiKey" ──
    apiKeys = data.apiKeys || {};
    if (data.apiKey && apiKeys[data.provider || "openrouter"] === undefined) {
      apiKeys[data.provider || "openrouter"] = data.apiKey;
    }

    if (data.provider) currentProvider = data.provider;

    // Setup banner — only show if the active provider has no key saved.
    // Custom providers (often keyless local servers) never trigger this.
    if (!apiKeys[currentProvider] && !isCustomProvider(currentProvider)) {
      document.getElementById("setup-banner").classList.add("visible");
    }

    document.getElementById("api-key").value = apiKeys[currentProvider] || "";
    if (data.writingStyle)      document.getElementById("writing-style").value = data.writingStyle;
    if (data.customInstructions) document.getElementById("custom-instructions").value = data.customInstructions;

    renderProviderSelector();
    updateProviderUI();
    if (data.model) document.getElementById("model-select").value = data.model;

    // "Manage Default Providers" always starts on a built-in provider — custom
    // providers don't appear in that tab (they're managed in "Custom Providers").
    customTabProvider = BUILTIN_PROVIDER_IDS.includes(currentProvider) ? currentProvider : BUILTIN_PROVIDER_IDS[0];
    document.getElementById("custom-provider-select").value = customTabProvider;
    updateCustomTabUI(customTabProvider);

    renderCustomProviderList();
    renderProviderTemplates();

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

    document.getElementById("show-lang-selector").checked = !!data.showLangSelector;
    document.getElementById("show-lang-selector").addEventListener("change", markDirty);

    // showToneSelector defaults to true when not yet set
    document.getElementById("show-tone-selector").checked = data.showToneSelector !== false;
    document.getElementById("show-tone-selector").addEventListener("change", markDirty);

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
  document.getElementById("api-key").addEventListener("input", () => {
    apiKeys[currentProvider] = document.getElementById("api-key").value.trim();
    checkDirty();
  });
  document.getElementById("writing-style").addEventListener("input", checkDirty);
  document.getElementById("custom-instructions").addEventListener("input", checkDirty);
  document.getElementById("model-select").addEventListener("change", () => {
    // A different model invalidates the previous test result — don't let it
    // look like confirmation that this model works.
    clearTestResult();
    checkDirty();
  });

  // ── Reveal key — visible by default, click to mask ────────────────────────
  const keyInput  = document.getElementById("api-key");
  const revealBtn = document.getElementById("reveal-btn");

  function setKeyVisible(visible) {
    keyInput.type = visible ? "text" : "password";
    revealBtn.innerHTML = visible ? EYE_ICON : EYE_OFF_ICON;
    revealBtn.title = visible ? "Hide API key" : "Show API key";
  }
  setKeyVisible(true);

  revealBtn.addEventListener("click", () => {
    setKeyVisible(keyInput.type === "password");
  });

  // ── Test connection ──────────────────────────────────────────────────────
  document.getElementById("test-btn").addEventListener("click", async () => {
    const key     = keyInput.value.trim();
    const model   = document.getElementById("model-select").value;
    const testBtn = document.getElementById("test-btn");
    const testRes = document.getElementById("test-result");

    // Custom providers (e.g. local/homelab servers) often don't require a key —
    // only built-in providers enforce one here.
    if (!key && !isCustomProvider(currentProvider)) {
      showTestResult("error", "⚠ Please enter an API key first.");
      return;
    }

    testBtn.disabled = true;
    testBtn.textContent = "Testing…";
    testRes.style.display = "none";

    try {
      const result = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: "callAI",
          text: "Reply with only the word: OK",
          settings: {
            apiKey: key,
            provider: currentProvider,
            model,
            systemPrompt: "You are a test. Reply with only the word: OK",
            endpointOverrides
          }
        }, (response) => {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          if (response?.success) resolve(response.result);
          else reject(new Error(response?.error || "Unknown error"));
        });
      });

      if (result && result.length > 0) {
        showTestResult("success", `✓ Connection successful — your API key and model are working correctly.`);
      } else {
        showTestResult("warn", `⚠ API connected but the model returned an empty response. Try a different model or check your provider's usage limits.`);
      }
    } catch (err) {
      showTestResult("error", `✕ Connection failed: ${err.message}`);
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = "Test Connection";
    }
  });

  // ── Save ─────────────────────────────────────────────────────────────────
  document.getElementById("save-btn").addEventListener("click", () => {
    apiKeys[currentProvider] = keyInput.value.trim();

    const settings = {
      apiKeys,
      provider:           currentProvider,
      model:              document.getElementById("model-select").value,
      defaultTone:        currentTone,
      language:           currentLanguage,
      theme:              currentTheme,
      showLangSelector:   document.getElementById("show-lang-selector").checked,
      showToneSelector:   document.getElementById("show-tone-selector").checked,
      writingStyle:       document.getElementById("writing-style").value.trim(),
      customInstructions: document.getElementById("custom-instructions").value.trim()
    };

    chrome.storage.sync.set(settings, () => {
      savedState = captureState();
      isDirty = false;
      updateUnsavedUI();
      showSavedToast();

      // Hide setup banner once the active provider has a key
      if (apiKeys[currentProvider]) {
        document.getElementById("setup-banner").classList.remove("visible");
      }
    });
  });

  // ── Manage Default Providers — Add a model ────────────────────────────────
  document.getElementById("custom-model-add-btn").addEventListener("click", () => {
    const idInput    = document.getElementById("custom-model-id");
    const labelInput = document.getElementById("custom-model-label");
    const id    = idInput.value.trim();
    const label = labelInput.value.trim();
    const provider = customTabProvider;

    if (!id) {
      showCustomModelMsg("error", "⚠ Please enter a model ID.");
      return;
    }

    const defaults = PROVIDER_MODELS[provider] || [];
    const customs  = customModels[provider] || [];
    if (defaults.some(m => m.value === id) || customs.some(m => m.value === id)) {
      showCustomModelMsg("error", "⚠ This model ID is already in your list for this provider.");
      return;
    }

    if (!customModels[provider]) customModels[provider] = [];
    customModels[provider].push({ value: id, label: label || id });

    chrome.storage.sync.set({ customModels }, () => {
      idInput.value = "";
      labelInput.value = "";
      renderCustomModelList(provider);
      if (provider === currentProvider) populateModels(currentProvider, true);
      const name = PROVIDER_INFO[provider]?.name || provider;
      showCustomModelMsg("success", `✓ Added "${label || id}" to ${name} — it now appears in the Model dropdown on the Defaults tab when ${name} is selected as the active provider.`);
    });
  });

  // ── Manage Default Providers — Endpoint override: Save ─────────────────────
  document.getElementById("custom-endpoint-save-btn").addEventListener("click", () => {
    const provider = customTabProvider;
    const input    = document.getElementById("custom-endpoint-input");
    const url      = input.value.trim();
    const fallback = PROVIDER_ENDPOINTS[provider] || "";

    if (!url) {
      showCustomEndpointMsg("error", "⚠ Please enter an endpoint URL, or use Reset to Default.");
      return;
    }
    if (!/^https:\/\/.+/i.test(url)) {
      showCustomEndpointMsg("error", "⚠ Endpoint must be a valid https:// URL.");
      return;
    }

    if (url === fallback) {
      delete endpointOverrides[provider];
    } else {
      endpointOverrides[provider] = url;
    }

    chrome.storage.sync.set({ endpointOverrides }, () => {
      const name = PROVIDER_INFO[provider]?.name || provider;
      showCustomEndpointMsg("success", `✓ Endpoint saved for ${name}.`);
    });
  });

  // ── Manage Default Providers — Endpoint override: Reset to default ─────────
  document.getElementById("custom-endpoint-reset-btn").addEventListener("click", () => {
    const provider = customTabProvider;
    delete endpointOverrides[provider];

    chrome.storage.sync.set({ endpointOverrides }, () => {
      document.getElementById("custom-endpoint-input").value = PROVIDER_ENDPOINTS[provider] || "";
      const name = PROVIDER_INFO[provider]?.name || provider;
      showCustomEndpointMsg("success", `✓ Reset to ${name}'s default endpoint.`);
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

  // ── Custom Providers — icon picker ────────────────────────────────────────
  document.getElementById("new-provider-icon-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    openIconPicker(btn, PROVIDER_ICON_LIBRARY, (emoji) => {
      btn.dataset.emoji = emoji;
      btn.textContent = emoji;
    });
  });

  // ── Custom Providers — model name chips ───────────────────────────────────
  renderNewProviderModelChips();
  document.getElementById("new-provider-model-add").addEventListener("click", addNewProviderModel);
  document.getElementById("new-provider-model-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); addNewProviderModel(); }
  });

  // ── Custom Providers — Test Connection (before saving) ────────────────────
  document.getElementById("test-provider-btn").addEventListener("click", testCustomProviderFromForm);

  // ── Custom Providers — Debug Bubble collapse/expand ───────────────────────
  document.getElementById("provider-debug-toggle").addEventListener("click", () => {
    const body  = document.getElementById("provider-debug-body");
    const caret = document.getElementById("provider-debug-caret");
    const open  = body.style.display !== "none";
    body.style.display = open ? "none" : "block";
    caret.classList.toggle("open", !open);
  });

  // ── Custom Providers — Cancel edit ────────────────────────────────────────
  document.getElementById("cancel-provider-edit-btn").addEventListener("click", cancelProviderEdit);

  // ── Custom Providers — Add / Save Provider ────────────────────────────────
  document.getElementById("add-provider-btn").addEventListener("click", () => {
    const nameInput     = document.getElementById("new-provider-name");
    const endpointInput = document.getElementById("new-provider-endpoint");
    const formatSelect  = document.getElementById("new-provider-format");
    const keyInput      = document.getElementById("new-provider-key");
    const descInput     = document.getElementById("new-provider-description");
    const iconBtn       = document.getElementById("new-provider-icon-btn");
    const addBtn        = document.getElementById("add-provider-btn");

    const name        = nameInput.value.trim();
    const endpoint    = endpointInput.value.trim();
    const apiFormat   = formatSelect.value;
    const key         = keyInput.value.trim();
    const description = descInput.value.trim();
    const icon        = iconBtn.dataset.emoji || "🤖";

    if (!name)     { showProviderMsg("error", "⚠ Please give your provider a name."); return; }
    if (!endpoint) { showProviderMsg("error", "⚠ Please enter an API endpoint URL."); return; }

    const pattern = originPatternForURL(endpoint);
    if (!pattern) {
      showProviderMsg("error", "⚠ That doesn't look like a valid URL — it should start with http:// or https://");
      return;
    }

    const isEdit = !!editingProviderId;
    const savingLabel = isEdit ? "Saving…" : "Adding…";
    const idleLabel   = isEdit ? "Save Changes" : "+ Add Provider";

    addBtn.disabled = true;
    addBtn.textContent = savingLabel;

    chrome.permissions.request({ origins: [pattern] }, (granted) => {
      if (!granted) {
        addBtn.disabled = false;
        addBtn.textContent = idleLabel;
        showProviderMsg("error", "⚠ Permission was not granted, so this wasn't saved. Chrome needs permission to send requests to this address.");
        return;
      }

      const id = isEdit ? editingProviderId : makeProviderId(name);
      const cp = { id, name, icon, endpoint, apiFormat, description };

      if (isEdit) {
        const idx = customProviders.findIndex(p => p.id === id);
        if (idx !== -1) customProviders[idx] = cp;
      } else {
        customProviders.push(cp);
      }

      registerCustomProvider(cp);
      endpointOverrides[id] = endpoint;

      if (key) apiKeys[id] = key;
      else delete apiKeys[id];

      if (newProviderModels.length) {
        customModels[id] = newProviderModels.map(m => ({ value: m, label: m }));
      } else {
        delete customModels[id];
      }

      chrome.storage.sync.set({ customProviders, endpointOverrides, apiKeys, customModels }, () => {
        addBtn.disabled = false;
        addBtn.textContent = "+ Add Provider";

        const wasActiveProvider = currentProvider === id;

        if (isEdit) {
          editingProviderId = null;
          document.getElementById("provider-form-title").textContent = "Add a Custom Provider";
          document.getElementById("cancel-provider-edit-btn").style.display = "none";
        }

        resetProviderForm();
        renderProviderSelector();
        renderCustomProviderList();

        if (wasActiveProvider) {
          document.getElementById("api-key").value = apiKeys[currentProvider] || "";
          updateProviderInfo(currentProvider);
          populateModels(currentProvider, true);
          showModelRecs(currentProvider);
        }

        // These fields are saved immediately (independent of the main Save button) —
        // resync the dirty-tracking snapshot so it doesn't show stale "unsaved changes".
        savedState = captureState();
        isDirty = false;
        updateUnsavedUI();

        showProviderMsg("success", isEdit
          ? `✓ Saved changes to "${icon} ${name}".`
          : `✓ Added "${icon} ${name}" — find it under Custom Providers on the Defaults tab. Use Test Connection above to verify it works.`);
      });
    });
  });
});

// ── Dirty tracking ────────────────────────────────────────────────────────

function captureState() {
  // Make sure the key currently shown in the field is reflected for the active provider
  apiKeys[currentProvider] = document.getElementById("api-key").value.trim();

  return {
    apiKeysJSON:        JSON.stringify(apiKeys),
    provider:           currentProvider,
    model:              document.getElementById("model-select").value,
    tone:               currentTone,
    language:           currentLanguage,
    showLangSelector:   document.getElementById("show-lang-selector")?.checked ?? false,
    showToneSelector:   document.getElementById("show-tone-selector")?.checked ?? true,
    theme:              currentTheme,
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
    api:        current.apiKeysJSON !== saved.apiKeysJSON || current.provider !== saved.provider || current.model !== saved.model,
    style:      current.writingStyle !== saved.writingStyle || current.customInstructions !== saved.customInstructions || current.tone !== saved.tone || current.showToneSelector !== saved.showToneSelector,
    language:   current.language !== saved.language || current.showLangSelector !== saved.showLangSelector,
    appearance: current.theme !== saved.theme,
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

function isCustomProvider(id) {
  return customProviders.some(p => p.id === id);
}

// Registers a custom provider's metadata into the same lookup tables used for
// built-in providers, so the rest of the UI (info box, model select, recs)
// works for it without special-casing.
function registerCustomProvider(cp) {
  PROVIDER_INFO[cp.id] = {
    name: cp.name,
    desc: cp.description || `Custom provider — ${cp.apiFormat === "anthropic" ? "Anthropic" : "OpenAI"}-compatible API at your own endpoint.`,
    url: "", urlLabel: "", keyPrefix: ""
  };
  PROVIDER_MODELS[cp.id] = PROVIDER_MODELS[cp.id] || [];
  MODEL_RECOMMENDATIONS[cp.id] = MODEL_RECOMMENDATIONS[cp.id] || [];
}

function renderProviderSelector() {
  const container = document.getElementById("provider-selector");

  let html = `<div class="provider-group-label">Default Providers</div><div class="provider-group">`;
  html += BUILTIN_PROVIDER_IDS.map(id => providerPillHTML(id)).join("");
  html += `</div>`;

  html += `<div class="provider-group-label">Custom Providers</div><div class="provider-group">`;
  [...customProviders]
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
    .forEach(cp => { html += providerPillHTML(cp.id); });
  html += `
    <div class="provider-pill provider-pill-add" id="provider-pill-add">
      <span class="provider-logo logo-custom">+</span> Add Custom Provider
    </div>
  `;
  html += `</div>`;

  container.innerHTML = html;

  container.querySelectorAll(".provider-pill[data-provider]").forEach(pill => {
    pill.addEventListener("click", (e) => {
      if (e.target.closest(".provider-pill-remove")) return;
      selectProvider(pill.dataset.provider);
    });
  });

  container.querySelectorAll(".provider-pill-remove").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeCustomProvider(btn.dataset.id);
    });
  });

  document.getElementById("provider-pill-add").addEventListener("click", () => {
    document.querySelector('.subtab-btn[data-group="api"][data-subtab="custom"]')?.click();
    document.getElementById("new-provider-name")?.focus();
  });

  updateProviderSelectorActiveState();
}

function providerPillHTML(id) {
  const info = PROVIDER_INFO[id];
  if (!info) return "";
  const cp = customProviders.find(p => p.id === id);
  const icon = cp ? cp.icon : (PROVIDER_GLYPHS[id] || "●");
  const logoClass = cp ? "logo-custom" : `logo-${id}`;
  const removeBtn = cp
    ? `<button type="button" class="provider-pill-remove" data-id="${escapeHTML(id)}" title="Remove this custom provider">✕</button>`
    : "";
  return `
    <div class="provider-pill" data-provider="${escapeHTML(id)}">
      <span class="provider-logo ${logoClass}">${escapeHTML(icon)}</span>${escapeHTML(info.name)}${removeBtn}
    </div>
  `;
}

function updateProviderSelectorActiveState() {
  document.querySelectorAll(".provider-pill[data-provider]").forEach(pill =>
    pill.classList.toggle("active", pill.dataset.provider === currentProvider));
}

function selectProvider(id) {
  if (id === currentProvider) return;
  currentProvider = id;
  updateProviderUI();
  // Each provider keeps its own API key — swap the field to match
  document.getElementById("api-key").value = apiKeys[currentProvider] || "";
  // A test result from the previous provider/model is no longer valid for this one
  clearTestResult();
  markDirty();
}

function updateProviderUI() {
  updateProviderSelectorActiveState();
  updateProviderInfo(currentProvider);
  populateModels(currentProvider);
  showModelRecs(currentProvider);
}

function updateProviderInfo(provider) {
  const info = PROVIDER_INFO[provider];
  if (!info) return;
  const el = document.getElementById("provider-info");
  el.classList.add("visible");
  el.innerHTML = `
    <strong>${info.name}</strong> — ${info.desc}
    ${info.url ? `<br><a href="${info.url}" target="_blank">→ ${info.urlLabel}</a>` : ""}
    ${info.modelsUrl ? `<br><a href="${info.modelsUrl}" target="_blank">${info.modelsUrlLabel}</a>` : ""}
  `;

  document.querySelectorAll(".active-provider-label").forEach(span => span.textContent = info.name);
}

function populateModels(provider, preserveSelection = false) {
  const select        = document.getElementById("model-select");
  const previousValue = select.value;

  const hidden   = new Set(hiddenModels[provider] || []);
  const defaults = (PROVIDER_MODELS[provider] || []).filter(m => !hidden.has(m.value));
  const customs  = customModels[provider] || [];

  select.innerHTML = "";

  defaults.forEach(({ value, label }) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    select.appendChild(opt);
  });

  if (customs.length) {
    const group = document.createElement("optgroup");
    group.label = "Custom";
    customs.forEach(({ value, label }) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label || value;
      group.appendChild(opt);
    });
    select.appendChild(group);
  }

  if (!select.options.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No models available — add one below";
    opt.disabled = true;
    select.appendChild(opt);
  }

  if (preserveSelection && previousValue) {
    const stillExists = Array.from(select.options).some(o => o.value === previousValue);
    if (stillExists) select.value = previousValue;
  }
}

function showModelRecs(provider) {
  const recs = MODEL_RECOMMENDATIONS[provider] || [];
  const el   = document.getElementById("model-rec");
  if (!recs.length) { el.innerHTML = ""; return; }

  const badgeClass = { best: "badge-best", fast: "badge-fast", free: "badge-free", value: "badge-value" };
  el.innerHTML = recs.map(r => `
    <div class="model-rec-row">
      <span class="model-badge ${badgeClass[r.badge] || "badge-value"}">${r.label}</span>
      <span>${r.note} — <a href="#" class="rec-pick" data-model="${r.model}" style="color:#5c6ef5;text-decoration:none">select</a></span>
    </div>
  `).join("");

  el.querySelectorAll(".rec-pick").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const model = link.dataset.model;

      // If the user previously hid this recommended model, bring it back so selection works
      if ((hiddenModels[provider] || []).includes(model)) {
        hiddenModels[provider] = hiddenModels[provider].filter(v => v !== model);
        chrome.storage.sync.set({ hiddenModels }, () => {
          populateModels(provider, true);
          document.getElementById("model-select").value = model;
          // Only refresh the "Manage Default Providers" Built-in Defaults list if it's showing this same provider
          if (provider === customTabProvider) renderDefaultModelList(provider);
          clearTestResult();
          checkDirty();
        });
        return;
      }

      document.getElementById("model-select").value = model;
      clearTestResult();
      checkDirty();
    });
  });
}

function showTestResult(type, message) {
  const el = document.getElementById("test-result");
  el.textContent = message;
  el.className = "test-result " + type;
  el.style.display = "block";
}

// Switching provider or model invalidates whatever test result is currently
// showing — it described a different config and shouldn't be mistaken for
// confirmation that this one works.
function clearTestResult() {
  const el = document.getElementById("test-result");
  el.style.display = "none";
  el.textContent = "";
  el.className = "test-result";
}

// ── Manage Default Providers — model management ────────────────────────────

function escapeHTML(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function updateCustomTabUI(provider) {
  const info = PROVIDER_INFO[provider];
  const name = info?.name || provider;

  document.querySelectorAll(".custom-provider-label").forEach(el => el.textContent = name);

  const providerSelect = document.getElementById("custom-provider-select");
  if (providerSelect.value !== provider) providerSelect.value = provider;

  const hintEl = document.getElementById("custom-provider-doc-hint");
  if (hintEl) {
    hintEl.innerHTML = info?.url
      ? `Find ${escapeHTML(name)} model IDs at <a href="${info.url}" target="_blank">${escapeHTML(info.urlLabel)} →</a>`
      : "";
  }

  // Endpoint fields
  const defaultEndpoint = PROVIDER_ENDPOINTS[provider] || "";
  document.getElementById("custom-endpoint-input").value   = endpointOverrides[provider] || defaultEndpoint;
  document.getElementById("custom-endpoint-default").textContent = defaultEndpoint || "—";

  renderCustomModelList(provider);
  renderDefaultModelList(provider);

  // Clear any leftover messages from a previous provider
  document.getElementById("custom-model-msg").style.display = "none";
  document.getElementById("custom-endpoint-msg").style.display = "none";
}

function populateCustomProviderSelect() {
  const select = document.getElementById("custom-provider-select");
  select.innerHTML = "";
  BUILTIN_PROVIDER_IDS.forEach(key => {
    const info = PROVIDER_INFO[key];
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = info.name;
    select.appendChild(opt);
  });
}

function renderCustomModelList(provider) {
  const list   = document.getElementById("custom-model-list");
  const models = customModels[provider] || [];
  const name   = PROVIDER_INFO[provider]?.name || provider;

  if (!models.length) {
    list.innerHTML = `<div class="custom-model-empty">No custom models added yet for ${escapeHTML(name)}.</div>`;
    return;
  }

  list.innerHTML = models.map(m => `
    <div class="model-row">
      <div class="model-row-info">
        <div class="model-row-label">${escapeHTML(m.label || m.value)}</div>
        <div class="model-row-id">${escapeHTML(m.value)}</div>
      </div>
      <button class="model-row-remove" data-value="${escapeHTML(m.value)}">✕ Remove</button>
    </div>
  `).join("");

  list.querySelectorAll(".model-row-remove").forEach(btn => {
    btn.addEventListener("click", () => removeCustomModel(provider, btn.dataset.value));
  });
}

function renderDefaultModelList(provider) {
  const list   = document.getElementById("default-model-list");
  const models = PROVIDER_MODELS[provider] || [];
  const hidden = new Set(hiddenModels[provider] || []);

  if (!models.length) {
    list.innerHTML = `<div class="default-model-empty">No built-in models for this provider.</div>`;
    return;
  }

  list.innerHTML = models.map(m => `
    <label class="model-check-row">
      <input type="checkbox" ${hidden.has(m.value) ? "" : "checked"} data-value="${escapeHTML(m.value)}">
      <div class="model-row-info">
        <div class="model-row-label">${escapeHTML(m.label)}</div>
        <div class="model-row-id">${escapeHTML(m.value)}</div>
      </div>
    </label>
  `).join("");

  list.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener("change", () => toggleDefaultModel(provider, cb.dataset.value, cb.checked));
  });
}

function removeCustomModel(provider, value) {
  customModels[provider] = (customModels[provider] || []).filter(m => m.value !== value);
  chrome.storage.sync.set({ customModels }, () => {
    renderCustomModelList(provider);
    if (provider === currentProvider) populateModels(currentProvider, true);
    checkDirty();
  });
}

function toggleDefaultModel(provider, value, visible) {
  if (!hiddenModels[provider]) hiddenModels[provider] = [];

  if (visible) {
    hiddenModels[provider] = hiddenModels[provider].filter(v => v !== value);
  } else if (!hiddenModels[provider].includes(value)) {
    hiddenModels[provider].push(value);
  }

  chrome.storage.sync.set({ hiddenModels }, () => {
    if (provider === currentProvider) populateModels(currentProvider, true);
    checkDirty();
  });
}

function showCustomModelMsg(type, text) {
  const el = document.getElementById("custom-model-msg");
  el.textContent = text;
  el.className = "test-result " + type;
  el.style.display = "block";
}

function showCustomEndpointMsg(type, text) {
  const el = document.getElementById("custom-endpoint-msg");
  el.textContent = text;
  el.className = "test-result " + type;
  el.style.display = "block";
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

// Slugify a provider name into a unique "custom_xxx" id
function makeProviderId(name) {
  const base = "custom_" + (name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "provider");
  let id = base;
  let n = 2;
  while (PROVIDER_INFO[id] !== undefined) {
    id = `${base}_${n++}`;
  }
  return id;
}

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

function showProviderMsg(type, text) {
  const el = document.getElementById("provider-msg");
  el.textContent = text;
  el.className = "test-result " + type;
  el.style.display = "block";
}

// ── Model name chips (Add a Custom Provider form) ──────────────────────────

function addNewProviderModel() {
  const input = document.getElementById("new-provider-model-input");
  const val = input.value.trim();
  if (!val) return;
  if (!newProviderModels.includes(val)) newProviderModels.push(val);
  input.value = "";
  renderNewProviderModelChips();
  renderModelExamples();
}

function renderNewProviderModelChips() {
  const wrap = document.getElementById("new-provider-model-chips");

  if (!newProviderModels.length) {
    wrap.innerHTML = `<div class="model-name-chips-empty">No models added — optional, you can add these later too.</div>`;
    return;
  }

  wrap.innerHTML = newProviderModels.map(m => `
    <span class="model-name-chip">${escapeHTML(m)}<button type="button" data-model="${escapeHTML(m)}" title="Remove">✕</button></span>
  `).join("");

  wrap.querySelectorAll("button[data-model]").forEach(btn => {
    btn.addEventListener("click", () => {
      newProviderModels = newProviderModels.filter(m => m !== btn.dataset.model);
      renderNewProviderModelChips();
      renderModelExamples();
    });
  });
}

// ── Connectivity testing ──────────────────────────────────────────────────

// Sends an explicit, brief test prompt to an arbitrary endpoint/format/key/model
// combo — used both for "Test Connection" on the unsaved form and could be
// reused elsewhere. Always requests debug info (raw request/response) so
// failures can be diagnosed instead of just reporting a bare network status.
function runProviderTest({ endpoint, apiFormat, apiKey, model }, callback) {
  chrome.runtime.sendMessage({
    action: "callAI",
    debug: true,
    text: "Respond with the word 'Ready' if you can read this.",
    settings: {
      apiKey: apiKey || "",
      provider: "__custom_test__",
      model,
      systemPrompt: "You are a connection test. Respond with only the word: Ready",
      endpointOverrides: { __custom_test__: endpoint },
      apiFormat
    }
  }, (res) => {
    if (chrome.runtime.lastError) {
      callback({ ok: false, error: chrome.runtime.lastError.message || "Unknown error", debug: null });
    } else if (res?.success) {
      callback({ ok: true, result: res.result, debug: res.debug });
    } else {
      callback({ ok: false, error: res?.error || "Unknown error", debug: res?.debug });
    }
  });
}

function showProviderTestResult(type, text) {
  const el = document.getElementById("provider-test-result");
  el.textContent = text;
  el.className = "test-result " + type;
  el.style.display = "block";
}

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

// Test using whatever is currently typed into the Add/Edit Custom Provider form —
// nothing is saved by this action.
function testCustomProviderFromForm() {
  const endpoint  = document.getElementById("new-provider-endpoint").value.trim();
  const apiFormat = document.getElementById("new-provider-format").value;
  const key       = document.getElementById("new-provider-key").value.trim();
  const model     = newProviderModels[0];

  renderProviderDebugBubble(null);

  if (!endpoint) {
    showProviderTestResult("error", "⚠ Enter an API endpoint URL first.");
    return;
  }

  const pattern = originPatternForURL(endpoint);
  if (!pattern) {
    showProviderTestResult("error", "⚠ That doesn't look like a valid URL — it should start with http:// or https://");
    return;
  }

  const testBtn = document.getElementById("test-provider-btn");
  testBtn.disabled = true;
  testBtn.textContent = "Testing…";
  showProviderTestResult("warn", "Testing connection…");

  chrome.permissions.request({ origins: [pattern] }, (granted) => {
    if (!granted) {
      testBtn.disabled = false;
      testBtn.textContent = "Test Connection";
      showProviderTestResult("error", "⚠ Permission was not granted — Chrome needs permission to reach this address to test it.");
      return;
    }

    runProviderTest({ endpoint, apiFormat, apiKey: key, model }, (result) => {
      testBtn.disabled = false;
      testBtn.textContent = "Test Connection";

      renderProviderDebugBubble(result.debug);

      // Deep health check: a successful HTTP handshake isn't enough — the
      // model must actually return a usable, non-empty text string.
      const reply = (result.ok ? result.result : "") || "";
      const looksValid = result.ok && typeof reply === "string" && reply.trim().length > 0;

      if (looksValid) {
        showProviderTestResult("success", `✓ Model responded correctly — your custom provider is operational. (Replied: "${reply.trim().slice(0, 80)}")`);
      } else if (result.ok) {
        showProviderTestResult("warn", `⚠ Connected, but the model returned an empty response — check the Debug details below for the raw payload and response.`);
      } else {
        showProviderTestResult("error", `✕ Connection failed: ${result.error}${model ? "" : " — if your server requires a model name, add one under Model Name(s) above and try again."}`);
      }
    });
  });
}

// ── Add/Edit Custom Provider form helpers ───────────────────────────────────

function resetProviderForm() {
  document.getElementById("new-provider-name").value = "";
  document.getElementById("new-provider-endpoint").value = "";
  document.getElementById("new-provider-format").value = "openai";
  document.getElementById("new-provider-key").value = "";
  document.getElementById("new-provider-description").value = "";

  const iconBtn = document.getElementById("new-provider-icon-btn");
  iconBtn.dataset.emoji = "🤖";
  iconBtn.textContent = "🤖";

  newProviderModels = [];
  renderNewProviderModelChips();

  templateExampleModels = [];
  renderModelExamples();

  document.getElementById("provider-test-result").style.display = "none";
  renderProviderDebugBubble(null);
}

function editCustomProvider(id) {
  const cp = customProviders.find(p => p.id === id);
  if (!cp) return;

  editingProviderId = id;

  document.getElementById("new-provider-name").value = cp.name;
  document.getElementById("new-provider-endpoint").value = cp.endpoint;
  document.getElementById("new-provider-format").value = cp.apiFormat === "anthropic" ? "anthropic" : "openai";
  document.getElementById("new-provider-key").value = apiKeys[id] || "";
  document.getElementById("new-provider-description").value = cp.description || "";

  const iconBtn = document.getElementById("new-provider-icon-btn");
  iconBtn.dataset.emoji = cp.icon || "🤖";
  iconBtn.textContent = cp.icon || "🤖";

  newProviderModels = (customModels[id] || []).map(m => m.value);
  renderNewProviderModelChips();

  // Editing an existing provider — Quick Template examples no longer apply
  templateExampleModels = [];
  renderModelExamples();

  document.getElementById("provider-form-title").textContent = `Edit Custom Provider — ${cp.icon} ${cp.name}`;
  document.getElementById("add-provider-btn").textContent = "Save Changes";
  document.getElementById("cancel-provider-edit-btn").style.display = "";

  document.getElementById("provider-msg").style.display = "none";
  document.getElementById("provider-test-result").style.display = "none";
  renderProviderDebugBubble(null);

  document.getElementById("provider-form-title").scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelProviderEdit() {
  editingProviderId = null;
  resetProviderForm();
  document.getElementById("provider-form-title").textContent = "Add a Custom Provider";
  document.getElementById("add-provider-btn").textContent = "+ Add Provider";
  document.getElementById("cancel-provider-edit-btn").style.display = "none";
  document.getElementById("provider-msg").style.display = "none";
}

// ── Quick-fill templates ────────────────────────────────────────────────────

function renderProviderTemplates() {
  const row = document.getElementById("provider-template-row");
  row.innerHTML = PROVIDER_TEMPLATES.map((t, i) => `
    <button type="button" class="template-btn" data-index="${i}">${t.icon} ${escapeHTML(t.label)}</button>
  `).join("");

  row.querySelectorAll(".template-btn").forEach(btn => {
    btn.addEventListener("click", () => applyProviderTemplate(PROVIDER_TEMPLATES[+btn.dataset.index]));
  });
}

function applyProviderTemplate(t) {
  document.getElementById("new-provider-name").value = t.name;
  document.getElementById("new-provider-endpoint").value = t.endpoint;
  document.getElementById("new-provider-format").value = t.apiFormat;
  document.getElementById("new-provider-description").value = t.description;
  document.getElementById("new-provider-key").value = "";

  const iconBtn = document.getElementById("new-provider-icon-btn");
  iconBtn.dataset.emoji = t.icon;
  iconBtn.textContent = t.icon;

  // Don't auto-add the template's models — that caused issues with users
  // ending up with model IDs they don't actually have installed. Instead,
  // show them as examples the user can click to add themselves.
  templateExampleModels = [...(t.models || [])];
  renderModelExamples();

  const actionLabel = editingProviderId ? `"Save Changes"` : `"+ Add Provider"`;
  showProviderMsg("success", `Filled in ${t.label} defaults below — review (especially the port). Model IDs are NOT added automatically; see the examples below the Model Name(s) field and add the ones you actually have installed, then optionally hit "Test Connection" and click ${actionLabel}.`);
}

// ── Example model chips (Quick Template suggestions) ───────────────────────
// These are shown below the Model Name(s) input after applying a Quick
// Template. Clicking one adds it to newProviderModels (same as typing it in
// and clicking "+ Add") — models are never added automatically.
function renderModelExamples() {
  const wrap = document.getElementById("new-provider-model-examples");

  if (!templateExampleModels.length) {
    wrap.style.display = "none";
    wrap.innerHTML = "";
    return;
  }

  wrap.style.display = "block";
  wrap.innerHTML = `<div class="model-examples-label">Examples for this server — click to add</div>` +
    templateExampleModels.map(m => {
      const added = newProviderModels.includes(m);
      return `<button type="button" class="model-example-chip${added ? " added" : ""}" data-model="${escapeHTML(m)}" ${added ? "disabled" : ""}>${added ? "✓ " : "+ "}${escapeHTML(m)}</button>`;
    }).join("") +
    `<div class="hint" style="margin-top:6px">These are common model IDs for this server — only add the ones you actually have installed.</div>`;

  wrap.querySelectorAll(".model-example-chip:not(.added)").forEach(btn => {
    btn.addEventListener("click", () => {
      const val = btn.dataset.model;
      if (!newProviderModels.includes(val)) newProviderModels.push(val);
      renderNewProviderModelChips();
      renderModelExamples();
    });
  });
}

// ── Your Custom Providers list ──────────────────────────────────────────────

function renderCustomProviderList() {
  const list = document.getElementById("custom-provider-list");

  if (!customProviders.length) {
    list.innerHTML = `<div class="custom-model-empty">No custom providers yet — add one above.</div>`;
    return;
  }

  const sorted = [...customProviders].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  list.innerHTML = sorted.map(cp => `
    <div class="model-row">
      <div class="model-row-info">
        <div class="model-row-label">${escapeHTML(cp.icon)} ${escapeHTML(cp.name)}</div>
        <div class="model-row-id">${escapeHTML(cp.endpoint)} — ${cp.apiFormat === "anthropic" ? "Anthropic-compatible" : "OpenAI-compatible"}</div>
      </div>
      <div style="display:flex; gap:6px; flex-shrink:0;">
        <button class="btn-secondary" data-edit-id="${escapeHTML(cp.id)}" style="padding:6px 12px; font-size:12px;">✎ Edit</button>
        <button class="model-row-remove" data-id="${escapeHTML(cp.id)}">✕ Remove</button>
      </div>
    </div>
  `).join("");

  list.querySelectorAll("[data-edit-id]").forEach(btn => {
    btn.addEventListener("click", () => editCustomProvider(btn.dataset.editId));
  });

  list.querySelectorAll(".model-row-remove").forEach(btn => {
    btn.addEventListener("click", () => removeCustomProvider(btn.dataset.id));
  });
}

function removeCustomProvider(id) {
  const cp = customProviders.find(p => p.id === id);
  if (!cp) return;

  const ok = window.confirm(`Remove "${cp.icon} ${cp.name}"?\n\nThis deletes its saved API key, custom models, and endpoint. Built-in providers are never affected.`);
  if (!ok) return;

  if (editingProviderId === id) cancelProviderEdit();

  customProviders = customProviders.filter(p => p.id !== id);
  delete PROVIDER_INFO[id];
  delete PROVIDER_MODELS[id];
  delete MODEL_RECOMMENDATIONS[id];
  delete customModels[id];
  delete hiddenModels[id];
  delete endpointOverrides[id];
  delete apiKeys[id];

  let switchedActiveProvider = false;
  if (currentProvider === id) {
    currentProvider = BUILTIN_PROVIDER_IDS[0];
    switchedActiveProvider = true;
  }
  if (customTabProvider === id) {
    customTabProvider = BUILTIN_PROVIDER_IDS[0];
  }

  chrome.storage.sync.set({ customProviders, customModels, hiddenModels, endpointOverrides, apiKeys }, () => {
    renderProviderSelector();
    renderCustomProviderList();

    if (switchedActiveProvider) {
      document.getElementById("api-key").value = apiKeys[currentProvider] || "";
      updateProviderUI();
      markDirty();
    }

    document.getElementById("custom-provider-select").value = customTabProvider;
    updateCustomTabUI(customTabProvider);

    // apiKeys/customModels/endpointOverrides are saved immediately — resync the
    // dirty-tracking snapshot so it doesn't show stale "unsaved changes".
    if (!switchedActiveProvider) {
      savedState = captureState();
      isDirty = false;
      updateUnsavedUI();
    }
  });
}

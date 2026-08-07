export const PROVIDERS = {
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    defaultModel: "anthropic/claude-sonnet-4.5",
    requiresBaseUrl: false,
    hint: "Anahtarını openrouter.ai/keys adresinden alabilirsin.",
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic",
    defaultModel: "claude-sonnet-4-5",
    requiresBaseUrl: false,
    hint: "Anahtarını console.anthropic.com adresinden alabilirsin.",
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    defaultModel: "gemini-2.5-flash",
    requiresBaseUrl: false,
    hint: "Anahtarını aistudio.google.com/apikey adresinden alabilirsin.",
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    defaultModel: "gpt-4.1",
    requiresBaseUrl: false,
    hint: "Anahtarını platform.openai.com/api-keys adresinden alabilirsin.",
  },
  custom: {
    id: "custom",
    label: "OpenAI uyumlu sunucu",
    defaultModel: "local-model",
    requiresBaseUrl: true,
    hint: "Kendi sunucunun adresini yaz. Adres /chat/completions ile birleştirilir.",
  },
};

const MAX_OUTPUT_TOKENS = 4000;

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

async function readErrorMessage(response) {
  let detail = "";
  try {
    const payload = await response.json();
    detail = payload?.error?.message || payload?.message || JSON.stringify(payload);
  } catch (error) {
    detail = await response.text().catch(() => "");
  }
  return `${response.status} ${response.statusText}${detail ? " — " + detail : ""}`;
}

async function requestChatCompletions({ endpoint, headers, model, systemPrompt, userPrompt }) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.85,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  const payload = await response.json();
  const message = payload?.choices?.[0]?.message;
  if (typeof message?.content === "string") {
    return message.content;
  }
  if (Array.isArray(message?.content)) {
    return message.content.map((part) => part.text || "").join("");
  }
  throw new Error("Sağlayıcı boş yanıt döndürdü.");
}

async function requestAnthropic({ apiKey, model, systemPrompt, userPrompt }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.85,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  const payload = await response.json();
  const text = (payload?.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
  if (!text) {
    throw new Error("Sağlayıcı boş yanıt döndürdü.");
  }
  return text;
}

async function requestGemini({ apiKey, model, systemPrompt, userPrompt }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  const payload = await response.json();
  const text = (payload?.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || "")
    .join("");
  if (!text) {
    throw new Error("Sağlayıcı boş yanıt döndürdü.");
  }
  return text;
}

export async function requestCompletion({ providerId, apiKey, model, baseUrl, systemPrompt, userPrompt }) {
  const provider = PROVIDERS[providerId];
  if (!provider) {
    throw new Error("Bilinmeyen sağlayıcı.");
  }
  const selectedModel = model || provider.defaultModel;
  if (providerId === "anthropic") {
    return requestAnthropic({ apiKey, model: selectedModel, systemPrompt, userPrompt });
  }
  if (providerId === "gemini") {
    return requestGemini({ apiKey, model: selectedModel, systemPrompt, userPrompt });
  }
  if (providerId === "openrouter") {
    return requestChatCompletions({
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "NX Historia",
      },
      model: selectedModel,
      systemPrompt,
      userPrompt,
    });
  }
  if (providerId === "openai") {
    return requestChatCompletions({
      endpoint: "https://api.openai.com/v1/chat/completions",
      headers: { Authorization: `Bearer ${apiKey}` },
      model: selectedModel,
      systemPrompt,
      userPrompt,
    });
  }
  if (!baseUrl) {
    throw new Error("Sunucu adresi gerekli.");
  }
  return requestChatCompletions({
    endpoint: `${stripTrailingSlash(baseUrl)}/chat/completions`,
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    model: selectedModel,
    systemPrompt,
    userPrompt,
  });
}

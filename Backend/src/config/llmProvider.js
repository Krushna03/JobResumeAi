import { generateWithOpenRouter, openrouterConfig } from "./openrouter.js";

function resolveProvider() {
  const explicit = (process.env.LLM_PROVIDER || "").trim().toLowerCase();
  if (explicit === "openrouter" || explicit === "gemini") return explicit;
  return process.env.NODE_ENV === "production" ? "gemini" : "openrouter";
}

export const activeProvider = resolveProvider();

console.log(
  `[llmProvider] active=${activeProvider}` +
    (activeProvider === "openrouter"
      ? ` model=${openrouterConfig.model} baseURL=${openrouterConfig.baseURL}`
      : ""),
);

// Returns the generated text plus a `meta` object for callers that want to
// inspect provider-specific details (e.g. Gemini finishReason).
export async function generateText(prompt) {
  if (activeProvider === "openrouter") {
    const text = await generateWithOpenRouter(prompt);
    return { text, meta: { provider: "openrouter" } };
  }

  // Lazy-load Gemini so the SDK only initializes (and only warns about
  // GEMINIAPIKEY) when it is actually selected.
  const { model: geminiModel } = await import("./gemini.js");
  const result = await geminiModel.generateContent(prompt);
  const response = result.response;
  const candidate = response?.candidates?.[0];
  const finishReason = candidate?.finishReason;

  if (finishReason === "MAX_TOKENS") {
    throw new Error(
      "Gemini ran out of output tokens before finishing. " +
        "Increase generationConfig.maxOutputTokens or switch LLM_PROVIDER=openrouter for dev.",
    );
  }

  if (finishReason && finishReason !== "STOP") {
    console.warn(
      `[llmProvider] Gemini finished early with reason=${finishReason}.`,
    );
  }

  return {
    text: response.text(),
    meta: { provider: "gemini", finishReason },
  };
}

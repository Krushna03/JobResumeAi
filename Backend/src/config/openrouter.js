 import OpenAI from "openai";

const apiKey = process.env.OPENROUTER_API_KEY;
const baseURL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const openrouterModel = process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat-v3-0324:free";

if (!apiKey) {
  console.warn(
    "[openrouter] OPENROUTER_API_KEY is not set. " +
      "Generate one at https://openrouter.ai/keys and add it to Backend/.env.",
  );
}

const openrouterClient = new OpenAI({
  baseURL,
  apiKey: apiKey || "missing",
  defaultHeaders: {
    "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:5000",
    "X-Title": process.env.OPENROUTER_APP_NAME || "JobResumeAI",
  },
});

export async function generateWithOpenRouter(prompt) {
  const startedAt = Date.now();
  console.log(
    `[openrouter] -> ${openrouterModel} | prompt=${prompt.length} chars | streaming...`,
  );

  try {
    const stream = await openrouterClient.chat.completions.create({
      model: openrouterModel,
      temperature: 0.3,
      stream: true,
      messages: [{ role: "user", content: prompt }],
    });

    let text = "";
    let chunkCount = 0;
    let resolvedModel = openrouterModel;
    let lastLogAt = Date.now();

    for await (const chunk of stream) {
      if (chunk?.model) resolvedModel = chunk.model;

      const delta = chunk?.choices?.[0]?.delta?.content || "";
      if (!delta) continue;
      text += delta;
      chunkCount += 1;

      const now = Date.now();
      if (now - lastLogAt >= 2000) {
        const elapsed = ((now - startedAt) / 1000).toFixed(1);
        console.log(
          `[openrouter] ...streaming via=${resolvedModel} chunks=${chunkCount} chars=${text.length} elapsed=${elapsed}s`,
        );
        lastLogAt = now;
      }
    }

    if (!text) {
      throw new Error("OpenRouter returned an empty response.");
    }

    const totalSec = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(
      `[openrouter] <- done | via=${resolvedModel} chunks=${chunkCount} chars=${text.length} elapsed=${totalSec}s`,
    );
    return text;
  } catch (error) {
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    const status = error?.status || error?.response?.status;

    if (status === 401) {
      throw new Error(
        "OpenRouter rejected the API key (401). " +
          "Check OPENROUTER_API_KEY in Backend/.env (must start with `sk-or-v1-`).",
      );
    }
    if (status === 402) {
      throw new Error(
        "OpenRouter says insufficient credits (402). " +
          "Free models still need a $0 balance; check https://openrouter.ai/credits.",
      );
    }
    if (status === 404) {
      throw new Error(
        `Model '${openrouterModel}' not found on OpenRouter. ` +
          "Pick another from https://openrouter.ai/models?max_price=0",
      );
    }
    if (status === 429) {
      throw new Error(
        "OpenRouter rate-limited the request (429). " +
          "Free models have low rate limits; wait a moment or pick another model.",
      );
    }

    console.error(
      `[openrouter] !! failed after ${elapsed}s (status=${status || "?"}):`,
      error.message,
    );
    throw new Error(`OpenRouter generation failed: ${error.message}`);
  }
}

export const openrouterConfig = { baseURL, model: openrouterModel };

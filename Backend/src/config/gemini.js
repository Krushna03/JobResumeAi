import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiapiKey = process.env.GEMINIAPIKEY;

if (!geminiapiKey) {
  console.warn(
    "[startup] GEMINIAPIKEY is not set. /api/v1/resume/generate-resume will fail.",
  );
}

const genAI = new GoogleGenerativeAI(geminiapiKey || "");

export const model = genAI.getGenerativeModel({
  model: "gemini-flash-latest",
  generationConfig: {
    maxOutputTokens: 8192,
    temperature: 0.3,
  },
});

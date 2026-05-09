import "dotenv/config";
import { app } from "./app.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectDB from "./config/db.js";

const geminiapiKey = process.env.GEMINIAPIKEY;

if (!geminiapiKey) {
  console.warn(
    "[startup] GEMINIAPIKEY is not set. /api/v1/resume/generate-resume will fail."
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

// Only ensure a DB connection on routes that actually need it. The root /
// and /api/health routes are intentionally registered earlier in app.js so
// a missing/broken Mongo connection cannot mask itself as a routing error.
app.use("/api/v1", async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

const isVercel = !!process.env.VERCEL;

if (!isVercel) {
  const port = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      app.listen(port, () => {
        console.log(`Server is running at Port : ${port}`);
      });
    })
    .catch((error) => {
      console.log("MongoDB connection failed !!!", error);
    });
}

export default app;

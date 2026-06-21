import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

import ResumeRoute from "./routes/resume.routes.js";
import UserRoute from "./routes/user.route.js";

const app = express();

const corsOrigins = [
  process.env.CLIENT_URL,
  "https://jobresumeai.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8080",
].filter(Boolean);

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    exposedHeaders: ["X-Resume-Filename", "X-Resume-Id", "Content-Disposition"],
  })
);

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(cookieParser());

// --- Lightweight routes that must NEVER depend on Mongo. ---------------
// Registered first so that hitting "/" can verify the function is alive
// even if the DB env vars are wrong.
app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "JobResumeAi API" });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- DB middleware: only runs for API routes that actually need it. -----
// Registered BEFORE the API route mounts so Express invokes it first.
app.use("/api/v1", async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// --- API routes ---------------------------------------------------------
app.use("/api/v1/resume", ResumeRoute);
app.use("/api/v1/users", UserRoute);

// --- 404 for unknown routes --------------------------------------------
app.use((req, res, _next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// --- Last-resort error handler -----------------------------------------
// Without this, a thrown error inside any handler can take down the whole
// serverless invocation and surface as FUNCTION_INVOCATION_FAILED.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[express error]", err);
  if (res.headersSent) {
    try { res.end(); } catch { /* noop */ }
    return;
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

export { app };

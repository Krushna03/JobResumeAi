import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

import ResumeRoute from "./routes/resume.routes.js";
import UserRoute from "./routes/user.route.js";
import { issueCsrfToken, verifyCsrfToken, CSRF_COOKIE } from "./middleware/csrf.middleware.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";

const app = express();

// Behind Vercel/any reverse proxy: trust the first hop so rate limiting and
// secure cookies key off the real client IP. Kept as a number to satisfy
// express-rate-limit's permissive-proxy validation.
app.set("trust proxy", 1);

// Security headers. crossOriginResourcePolicy is relaxed so the SPA on a
// different origin can still consume API responses (incl. streamed PDFs).
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

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
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    exposedHeaders: ["X-Resume-Filename", "X-Resume-Id", "Content-Disposition"],
  })
);

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(cookieParser());

// Mint the CSRF secret cookie for every visitor (cheap, idempotent).
app.use(issueCsrfToken);

// --- Lightweight routes that must NEVER depend on Mongo. ---------------
// Registered first so that hitting "/" can verify the function is alive
// even if the DB env vars are wrong.
app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "JobResumeAi API" });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Bootstrap endpoint: hands the SPA the CSRF token to echo back in the
// X-CSRF-Token header on state-changing requests. No DB needed.
app.get("/api/csrf", (req, res) => {
  res.json({ csrfToken: req.cookies?.[CSRF_COOKIE] });
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

// --- API hardening: throttle + reject forged cross-site mutations -------
app.use("/api/v1", apiLimiter);
app.use("/api/v1", verifyCsrfToken);

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

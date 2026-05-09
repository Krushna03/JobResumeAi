import express from 'express'
import cors from "cors"
import cookieParser from 'cookie-parser'

const app = express()

const corsOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8080",
].filter(Boolean);

app.use(
  cors({
    origin: corsOrigins.length ? corsOrigins : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    exposedHeaders: ["X-Resume-Filename", "X-Resume-Id", "Content-Disposition"],
  })
);

app.use(express.json({ limit: '20kb' }))
app.use(express.urlencoded({ extended: true, limit: '20kb' }))
app.use(cookieParser())


import ResumeRoute from "./routes/resume.routes.js";
import UserRoute from "./routes/user.route.js";

app.use("/api/v1/resume", ResumeRoute);
app.use("/api/v1/users", UserRoute);

// 404 for unknown API routes.
app.use((req, res, _next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Express error handler. Without this, a thrown error inside a handler
// can take down the serverless invocation as FUNCTION_INVOCATION_FAILED.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[express error]", err);
  if (res.headersSent) {
    // Response already started streaming; just end it.
    try { res.end(); } catch { /* noop */ }
    return;
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

export { app };

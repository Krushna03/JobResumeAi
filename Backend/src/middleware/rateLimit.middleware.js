import rateLimit from "express-rate-limit";

const isProd = process.env.NODE_ENV === "production";

const jsonMessage = (message) => ({ success: false, message });

const baseOptions = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
};

// Broad guard for the whole API surface to blunt scraping / brute force.
export const apiLimiter = rateLimit({
  ...baseOptions,
  max: 300,
  message: jsonMessage("Too many requests. Please try again in a few minutes."),
});

// Tighter guard for credential endpoints (login/register/google).
export const authLimiter = rateLimit({
  ...baseOptions,
  max: 20,
  message: jsonMessage("Too many authentication attempts. Please try again later."),
});

// Strict guard for the expensive Gemini + PDF render path. Anonymous abuse
// here directly costs money, so keep this aggressive in production.
export const generateResumeLimiter = rateLimit({
  ...baseOptions,
  max: isProd ? 5 : 50,
  message: jsonMessage(
    "Resume generation limit reached. Please wait a few minutes before trying again."
  ),
});

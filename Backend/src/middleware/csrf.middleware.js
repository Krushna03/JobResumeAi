import crypto from "crypto";
import { csrfCookieOptions } from "../utils/cookieOptions.js";

export const CSRF_COOKIE = "csrfToken";
const CSRF_HEADER = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Ensures a CSRF secret cookie exists for the session. The token is exposed
// to the client via the body of GET /api/csrf, never read from this cookie.
export const issueCsrfToken = (req, res, next) => {
  if (!req.cookies?.[CSRF_COOKIE]) {
    const token = crypto.randomBytes(32).toString("hex");
    res.cookie(CSRF_COOKIE, token, csrfCookieOptions());
    // Make the freshly minted token available within this same request.
    req.cookies = req.cookies || {};
    req.cookies[CSRF_COOKIE] = token;
  }
  next();
};

// Double-submit verification: state-changing requests must echo the token
// (from GET /api/csrf) in the X-CSRF-Token header. Cross-site attackers can
// neither read the token nor set this custom header, so forged requests fail.
export const verifyCsrfToken = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get(CSRF_HEADER);

  if (!cookieToken || !headerToken || !timingSafeEqual(cookieToken, headerToken)) {
    return res.status(403).json({
      success: false,
      message: "Invalid or missing CSRF token.",
    });
  }

  next();
};

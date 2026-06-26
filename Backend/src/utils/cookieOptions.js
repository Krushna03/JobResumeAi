const isProd = process.env.NODE_ENV === "production";

/** HttpOnly cookie options: works on localhost (no HTTPS) when secure is false. */
export function accessTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

export function clearAccessTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  };
}

/**
 * CSRF cookie for the double-submit pattern. HttpOnly because the token is
 * also delivered in the response body (the SPA lives on a different origin
 * and cannot read this cookie directly); the client echoes that body value
 * back in the X-CSRF-Token header, which we compare against this cookie.
 */
export function csrfCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

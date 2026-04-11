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

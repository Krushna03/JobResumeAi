import UserModel from "../model/User.models.js";
import { generateAccessAndRefreshTokens } from "../utils/generateTokens.js";
import { accessTokenCookieOptions } from "../utils/cookieOptions.js";
import { getGoogleOAuthClient } from "../config/google.oauth.js";

const userPublicFields = "-password -refreshToken";

function parseExpectedGoogleAudiences(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function tokenAudMatchesExpected(aud, expectedClientIds) {
  if (expectedClientIds.length === 0) return false;
  const tokenAuds = Array.isArray(aud) ? aud : aud != null ? [aud] : [];
  return tokenAuds.some((a) => expectedClientIds.includes(a));
}

/**
 * Accepts Google ID token (credential) from the client.
 * POST body: { idToken: string }  OR  query: ?token= (legacy)
*/
const verifyGoogleToken = async (req, res) => {
  try {
    const idToken = req.body?.idToken || req.query?.token;

    if (!idToken || typeof idToken !== "string") {
      return res.status(400).json({
        success: false,
        message: "idToken is required.",
      });
    }

    const client = getGoogleOAuthClient();

    const expectedAudiences = parseExpectedGoogleAudiences(process.env.GOOGLE_CLIENT_ID);
    
    if (!client || expectedAudiences.length === 0) {
      return res.status(503).json({
        success: false,
        message: "Google sign-in is not configured on the server.",
      });
    }

    const ticket = await client.verifyIdToken({ idToken });

    const payload = ticket.getPayload();
    
    if (!tokenAudMatchesExpected(payload?.aud, expectedAudiences)) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          "[Google auth] ID token aud mismatch. Token aud:",
          payload?.aud,
          "| Set GOOGLE_CLIENT_ID to match VITE_GOOGLE_CLIENT_ID (same OAuth Web client). Expected one of:",
          expectedAudiences,
        );
      }
      return res.status(401).json({
        success: false,
        message:
          "Google sign-in failed: server client ID does not match the app. Use the same OAuth Web client ID in GOOGLE_CLIENT_ID as in VITE_GOOGLE_CLIENT_ID.",
      });
    }
    if (!payload?.email) {
      return res.status(400).json({
        success: false,
        message: "Google account has no email.",
      });
    }

    const email = payload.email.toLowerCase();
    let user = await UserModel.findOne({ email });

    if (!user) {
      const randomPassword =
        Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + "A1!";
      user = await UserModel.create({
        username: payload.name || payload.email.split("@")[0],
        email,
        password: randomPassword,
        authProvider: "google",
        googleId: payload.sub,
      });
    } else if (!user.googleId && payload.sub) {
      user.googleId = payload.sub;
      await user.save({ validateBeforeSave: false });
    }

    const { accessToken } = await generateAccessAndRefreshTokens(user._id);
    const safeUser = await UserModel.findById(user._id).select(userPublicFields);

    return res
      .status(200)
      .cookie("accessToken", accessToken, accessTokenCookieOptions())
      .json({
        success: true,
        message: "Signed in with Google.",
        data: { user: safeUser, accessToken },
      });
  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(401).json({
      success: false,
      message: "Google sign-in failed. Please try again.",
    });
  }
};

export { verifyGoogleToken };

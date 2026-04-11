import { OAuth2Client } from "google-auth-library";

let client = null;

export function getGoogleOAuthClient() {
  const raw = process.env.GOOGLE_CLIENT_ID;
  if (!raw || typeof raw !== "string") return null;
  const clientId = raw.split(",")[0].trim();
  if (!clientId) return null;
  if (!client) client = new OAuth2Client(clientId);
  return client;
}

// Vercel serverless function entry. Imports the Express app and re-exports
// it so Vercel can invoke it as the handler for every request routed here
// by the rewrites in vercel.json.
//
// All real wiring (CORS, routes, models, Mongoose connection) lives in
// ../src/index.js so local `npm run dev` and the Vercel deployment share
// the exact same code path.

// Catch errors thrown anywhere in the async background (e.g. an unhandled
// promise rejection from Mongoose) so a single bad event doesn't crash the
// entire serverless instance and surface as FUNCTION_INVOCATION_FAILED with
// no useful logs.
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});

let appPromise;
let loadError = null;

try {
  appPromise = import("../src/index.js")
    .then((mod) => mod.default)
    .catch((err) => {
      loadError = err;
      console.error("[startup] failed to load src/index.js:", err);
      throw err;
    });
} catch (err) {
  loadError = err;
  console.error("[startup] failed to import src/index.js:", err);
}

export default async function handler(req, res) {
  try {
    if (loadError) {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          success: false,
          message: "Server failed to start",
          error: loadError?.message || String(loadError),
        })
      );
      return;
    }

    const app = await appPromise;
    return app(req, res);
  } catch (err) {
    console.error("[handler] unhandled error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          success: false,
          message: "Server crashed handling the request",
          error: err?.message || String(err),
        })
      );
    } else {
      try { res.end(); } catch { /* noop */ }
    }
  }
}

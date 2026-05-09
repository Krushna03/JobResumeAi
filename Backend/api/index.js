// Vercel serverless function entry. Imports the Express app and re-exports
// it so Vercel can invoke it as the handler for every request routed here
// by the rewrites in vercel.json.
//
// All real wiring (CORS, routes, models, Mongoose connection) lives in
// ../src/index.js so local `npm run dev` and the Vercel deployment share
// the exact same code path.
import app from "../src/index.js";

export default app;

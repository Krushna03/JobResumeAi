import mongoose from "mongoose";

// Cache the connection across serverless invocations. On Vercel, the same
// Node process is reused for "warm" requests, so reusing the connection
// avoids exhausting MongoDB Atlas connection limits with every cold start.
const globalForMongoose = globalThis;

if (!globalForMongoose.__mongoose) {
  globalForMongoose.__mongoose = { conn: null, promise: null };
}

const cached = globalForMongoose.__mongoose;

const DB_NAME = process.env.MONGODB_DB_NAME || "coldmailer";

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not set");
    }

    // Pass `dbName` as an option instead of concatenating onto the URI.
    // Atlas URIs typically include a query string (?retryWrites=...), and
    // concatenating "/dbname" after that produces an invalid URI on some
    // mongoose versions / runtimes.
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI, {
        dbName: DB_NAME,
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
      })
      .then((m) => {
        console.log(
          `MongoDB connected: ${m.connection.host} (db=${m.connection.name})`
        );
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        console.error("MongoDB connection error:", err);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

export default connectDB;

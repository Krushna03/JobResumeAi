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

app.get('/', (_, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export { app };

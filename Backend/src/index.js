import "dotenv/config";
import { app } from "./app.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectDB from "./config/db.js";

const geminiapiKey = process.env.GEMINIAPIKEY;
const genAI = new GoogleGenerativeAI(geminiapiKey);

export const model = genAI.getGenerativeModel({
  model: "gemini-flash-latest",
  generationConfig: {
    maxOutputTokens: 1000,
    temperature: 0.3,
  }
});

app.get('/', (_, res) => {
  res.send('Hello');
});

let isConnected = false

connectDB()
  .then(() => {
    isConnected = true
    app.listen(process.env.PORT, () => {
      console.log(`Server is running at Port : ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log('MongoDBconnection failed !!!', error)
  })

export default app;
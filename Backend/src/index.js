import "dotenv/config";
import { app } from "./app.js";
import connectDB from "./config/db.js";

const isVercel = !!process.env.VERCEL;

if (!isVercel) {
  const port = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      app.listen(port, () => {
        console.log(`Server is running at Port : ${port}`);
      });
    })
    .catch((error) => {
      console.log("MongoDB connection failed !!!", error);
    });
}

export default app;

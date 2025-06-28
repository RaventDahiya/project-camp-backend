import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/db.js";

dotenv.config({
  path: "./.env",
});
const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ sever is running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("❌ Mongo DataBase connection failed", err);
    process.exit(1);
  });

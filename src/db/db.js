import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("connected to Mongo DataBase");
  } catch (error) {
    console.error("Mongo DataBase connection failed ");
    process.exit(1);
  }
};

export default connectDB;

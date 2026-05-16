import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log("MongoDB URI:", uri);

    await mongoose.connect(uri);
    mongoose.connection.on("connected", () => console.log("Database Connected"));
  } catch (error) {
    console.error("DB connection error:", error.message);
  }
};

export default connectDB;

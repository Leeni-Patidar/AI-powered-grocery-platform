import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const getMongoUri = () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured");

  const mongoUri = new URL(uri);
  if (!mongoUri.searchParams.has("authSource")) {
    mongoUri.searchParams.set("authSource", "admin");
  }

  return mongoUri.toString();
};

const connectDB = async () => {
  try {
    const uri = getMongoUri();

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("Database Connected");
  } catch (error) {
    console.error("DB connection error:", error.message);
    if (error.code === 8000 || error.codeName === "AtlasError") {
      console.error(
        "MongoDB Atlas rejected the credentials. Check the database username/password in MONGODB_URI, not your Atlas login password."
      );
    }
    throw error;
  }
};

export default connectDB;

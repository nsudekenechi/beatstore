import User from "@/models/user";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI");
}

// Global cache to prevent multiple connections in development/serverless
let isConnected = false;

const connectDB = async () => {
  mongoose.set("strictQuery", true); // Best practice for Mongoose 7/8
  if (isConnected) return;


  try {
    const db = await mongoose.connect(MONGODB_URI, {
      appName: "ajempirebackend",
      bufferCommands: false, // Don't wait for DB if it's disconnected
      maxPoolSize: 10, // Adjust based on Railway plan
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });

    isConnected = !!db?.connections[0]?.readyState;

    // CREATE ADMIN IF NOT EXISTS
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (adminExists) {
      return;
    }
    const hashPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD as string, 12);
    const adminUser = new User({
      email: process.env.ADMIN_EMAIL as string,
      password: hashPassword,
      role: "admin",
    });
    await adminUser.save();

  } catch (err: unknown) {
    console.error("MongoDB connection failed ❌", err);
    // Don't throw a generic error; let the caller handle it or exit
    process.exit(1);
  }
};

export default connectDB;

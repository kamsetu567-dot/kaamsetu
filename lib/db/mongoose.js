import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Force IPv4 DNS before mongoose loads — fixes Vercel/serverless DNS resolution.
// Static ESM imports are hoisted, so we use require() here to guarantee
// dns config runs before mongoose is ever loaded.
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn("MONGODB_URI not set - database connections will fail");
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

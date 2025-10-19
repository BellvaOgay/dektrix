import mongoose from 'mongoose';
import { logger } from '@/lib/logger';

const MONGODB_URI = import.meta.env.VITE_MONGODB_URI || (typeof process !== 'undefined' ? process.env.MONGODB_URI : undefined);

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI not defined in environment variables');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Global cache to prevent multiple connections in development
const globalForMongoose = globalThis as unknown as {
  mongoose: MongooseCache | undefined;
};

let cached = globalForMongoose.mongoose;

if (!cached) {
  cached = globalForMongoose.mongoose = { conn: null, promise: null };
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      logger.log('✅ Connected to MongoDB');
      return mongoose;
    }).catch((error) => {
      logger.error('❌ MongoDB connection error:', error);
      // For development, fall back to mock database
      logger.log('📝 Falling back to mock database for development');
      cached!.conn = mongoose;
      return mongoose;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    logger.log('📝 Connection failed, using mock database for development');
    cached!.conn = mongoose;
  }

  return cached!.conn;
}

export default connectDB;
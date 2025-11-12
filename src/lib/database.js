import mongoose from 'mongoose';
import { logger } from './logger.js';

const MONGODB_URI = (typeof window === 'undefined' ? process.env.MONGODB_URI : undefined);

const globalForMongoose = globalThis;
let cached = globalForMongoose.mongoose;
if (!cached) {
  cached = globalForMongoose.mongoose = { conn: null, promise: null };
}

export default async function connectDB() {
  if (typeof window !== 'undefined') {
    return mongoose;
  }

  if (!MONGODB_URI) {
    logger.log('📝 MongoDB URI not configured, using mock database');
    return mongoose;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((m) => {
        logger.log('✅ Connected to MongoDB');
        return m;
      })
      .catch((error) => {
        logger.error('❌ MongoDB connection error:', error);
        logger.log('📝 Falling back to mock database for development');
        cached.conn = mongoose;
        return mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    logger.log('📝 Connection failed, using mock database for development');
    cached.conn = mongoose;
  }

  return cached.conn;
}

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI or VITE_MONGODB_URI not defined in environment variables');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalForMongoose = global as unknown as { mongoose: MongooseCache | undefined };
let cached = globalForMongoose.mongoose;

if (!cached) {
  cached = globalForMongoose.mongoose = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached!.conn) return cached!.conn;

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5,
    } as any;

    cached!.promise = mongoose.connect(MONGODB_URI as string, opts).then((m) => {
      return m;
    }).catch((error) => {
      console.error('MongoDB connection error in serverless function:', error);
      throw error;
    });
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}
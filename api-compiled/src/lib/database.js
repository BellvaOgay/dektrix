"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("./logger");
const MONGODB_URI = (typeof process !== 'undefined' ? process.env.MONGODB_URI : undefined);
// Only throw error in server environment, not in browser
if (typeof window === 'undefined' && !MONGODB_URI) {
    throw new Error('MONGODB_URI not defined in environment variables');
}
// Global cache to prevent multiple connections in development
const globalForMongoose = globalThis;
let cached = globalForMongoose.mongoose;
if (!cached) {
    cached = globalForMongoose.mongoose = { conn: null, promise: null };
}
async function connectDB() {
    // In browser environment, return a mock connection
    if (typeof window !== 'undefined') {
        logger_1.logger.log('🌐 Browser environment detected, returning mock database connection');
        return mongoose_1.default;
    }
    if (cached.conn) {
        return cached.conn;
    }
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000, // 5 second timeout
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 5,
        };
        cached.promise = mongoose_1.default.connect(MONGODB_URI, opts).then((mongoose) => {
            logger_1.logger.log('✅ Connected to MongoDB');
            return mongoose;
        }).catch((error) => {
            logger_1.logger.error('❌ MongoDB connection error:', error);
            // For development, fall back to mock database
            logger_1.logger.log('📝 Falling back to mock database for development');
            cached.conn = mongoose_1.default;
            return mongoose_1.default;
        });
    }
    try {
        cached.conn = await cached.promise;
    }
    catch (e) {
        cached.promise = null;
        logger_1.logger.log('📝 Connection failed, using mock database for development');
        cached.conn = mongoose_1.default;
    }
    return cached.conn;
}
exports.default = connectDB;

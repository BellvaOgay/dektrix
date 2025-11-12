"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;
if (!MONGODB_URI) {
    throw new Error('MONGODB_URI or VITE_MONGODB_URI not defined in environment variables');
}
const globalForMongoose = global;
let cached = globalForMongoose.mongoose;
if (!cached) {
    cached = globalForMongoose.mongoose = { conn: null, promise: null };
}
async function connectDB() {
    if (cached.conn)
        return cached.conn;
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 5,
        };
        cached.promise = mongoose_1.default.connect(MONGODB_URI, opts).then((m) => {
            return m;
        }).catch((error) => {
            console.error('MongoDB connection error in serverless function:', error);
            throw error;
        });
    }
    cached.conn = await cached.promise;
    return cached.conn;
}

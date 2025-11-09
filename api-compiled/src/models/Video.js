"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const VideoSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    thumbnail: {
        type: String,
        required: true
    },
    videoUrl: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true,
        min: 1,
        max: 300 // 5 minutes max for micro-content
    },
    category: {
        type: String,
        required: true,
        enum: ['AI Agents', 'DeFi', 'Blockchain', 'NFTs', 'Web3', 'Crypto', 'Smart Contracts', 'DAOs']
    },
    tags: [{
            type: String,
            trim: true,
            maxlength: 30
        }],
    price: {
        type: Number,
        required: true,
        min: 0
    },
    priceDisplay: {
        type: String,
        required: true
    },
    tipAmount: {
        type: Number,
        default: 100000, // Fixed 0.1 USDC in wei (6 decimals)
        required: true
    },
    tipAmountDisplay: {
        type: String,
        default: "0.1 USDC",
        required: true
    },
    difficulty: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner'
    },
    creator: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    totalViews: {
        type: Number,
        default: 0,
        min: 0
    },
    totalUnlocks: {
        type: Number,
        default: 0,
        min: 0
    },
    totalTipsEarned: {
        type: Number,
        default: 0,
        min: 0
    },
    playCount: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    featured: {
        type: Boolean,
        default: false
    },
    isFree: {
        type: Boolean,
        default: false // Default to premium content for safety
    }
}, {
    timestamps: true
});
// Indexes for better query performance (only in server environment)
if (typeof window === 'undefined') {
    VideoSchema.index({ category: 1, isActive: 1 });
    VideoSchema.index({ featured: -1, createdAt: -1 });
    VideoSchema.index({ creator: 1 });
    VideoSchema.index({ totalViews: -1 });
    VideoSchema.index({ price: 1 });
    VideoSchema.index({ tags: 1 });
    VideoSchema.index({ isFree: 1 }); // Index for filtering free vs premium content
}
// Export the Video model with browser compatibility
let Video;
if (typeof window !== 'undefined') {
    // In browser environment, create a mock model
    Video = {};
}
else {
    // In server environment, use the actual mongoose model
    Video = mongoose_1.default.models.Video || mongoose_1.default.model('Video', VideoSchema);
}
exports.default = Video;

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined)
        k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function () { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
    if (k2 === undefined)
        k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function (o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o)
                if (Object.prototype.hasOwnProperty.call(o, k))
                    ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule)
            return mod;
        var result = {};
        if (mod != null)
            for (var k = ownKeys(mod), i = 0; i < k.length; i++)
                if (k[i] !== "default")
                    __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const UserSchema = new mongoose_1.Schema({
    farcasterFid: {
        type: Number,
        unique: true,
        sparse: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    displayName: {
        type: String,
        trim: true,
        maxlength: 50
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true
    },
    avatar: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        maxlength: 500,
        default: ''
    },
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        index: true // Add index for faster queries
    },
    totalTipsEarned: {
        type: Number,
        default: 0,
        min: 0
    },
    totalTipsSpent: {
        type: Number,
        default: 0,
        min: 0
    },
    videosWatched: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Video'
        }],
    videosUnlocked: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Video'
        }],
    videosTipped: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Video'
        }],
    favoriteCategories: [{
            type: String,
            enum: ['AI Agents', 'DeFi', 'Blockchain', 'NFTs', 'Web3', 'Crypto', 'Smart Contracts', 'DAOs']
        }],
    viewCredits: {
        type: Number,
        default: 0,
        min: 0
    },
    // User container for organizing user data
    userContainer: {
        purchasedVideos: [{
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Video'
            }],
        uploadedVideos: [{
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Video'
            }],
        watchHistory: [{
                videoId: {
                    type: mongoose_1.Schema.Types.ObjectId,
                    ref: 'Video',
                    required: true
                },
                watchedAt: {
                    type: Date,
                    default: Date.now
                },
                progress: {
                    type: Number,
                    min: 0,
                    max: 100,
                    default: 0
                }
            }],
        preferences: {
            autoPlay: {
                type: Boolean,
                default: true
            },
            notifications: {
                type: Boolean,
                default: true
            },
            theme: {
                type: String,
                enum: ['light', 'dark', 'auto'],
                default: 'auto'
            }
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLoginAt: {
        type: Date
    }
}, {
    timestamps: true
});
// Indexes for better query performance (only in server environment)
if (typeof window === 'undefined') {
    UserSchema.index({ farcasterFid: 1 });
    UserSchema.index({ username: 1 });
    UserSchema.index({ walletAddress: 1 });
    UserSchema.index({ createdAt: -1 });
}
// Export the User model with browser compatibility
let User;
if (typeof window !== 'undefined') {
    // In browser environment, create a mock model
    User = {};
}
else {
    // In server environment, use the actual mongoose model
    User = mongoose_1.default.models.User || mongoose_1.default.model('User', UserSchema);
}
exports.default = User;

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
const CreatorSchema = new mongoose_1.Schema({
    wallet_address: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30,
        index: true
    },
    bio: {
        type: String,
        maxlength: 500,
        trim: true
    },
    profile_image_url: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                return !v || /^https?:\/\/.+/.test(v);
            },
            message: 'Profile image URL must be a valid HTTP/HTTPS URL'
        }
    },
    total_earned_usdc: {
        type: Number,
        default: 0,
        min: 0,
        index: true
    },
    joined_at: {
        type: Date,
        default: Date.now,
        index: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    socialLinks: {
        twitter: {
            type: String,
            trim: true,
            validate: {
                validator: function (v) {
                    return !v || /^https?:\/\/(www\.)?twitter\.com\/[a-zA-Z0-9_]+$/.test(v);
                },
                message: 'Invalid Twitter URL format'
            }
        },
        instagram: {
            type: String,
            trim: true,
            validate: {
                validator: function (v) {
                    return !v || /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+$/.test(v);
                },
                message: 'Invalid Instagram URL format'
            }
        },
        youtube: {
            type: String,
            trim: true,
            validate: {
                validator: function (v) {
                    return !v || /^https?:\/\/(www\.)?youtube\.com\/(channel\/|c\/|user\/)?[a-zA-Z0-9_-]+$/.test(v);
                },
                message: 'Invalid YouTube URL format'
            }
        },
        website: {
            type: String,
            trim: true,
            validate: {
                validator: function (v) {
                    return !v || /^https?:\/\/.+/.test(v);
                },
                message: 'Website must be a valid HTTP/HTTPS URL'
            }
        }
    },
    uploadedVideos: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Video'
        }],
    totalViews: {
        type: Number,
        default: 0,
        min: 0
    },
    followerCount: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'creators'
});
// Indexes for better query performance
CreatorSchema.index({ wallet_address: 1 });
CreatorSchema.index({ username: 1 });
CreatorSchema.index({ total_earned_usdc: -1 });
CreatorSchema.index({ joined_at: -1 });
CreatorSchema.index({ totalViews: -1 });
CreatorSchema.index({ isActive: 1, isVerified: 1 });
// Virtual for creator profile URL
CreatorSchema.virtual('profileUrl').get(function () {
    return `/creator/${this.username}`;
});
// Method to update earnings
CreatorSchema.methods.updateEarnings = function (amount) {
    this.total_earned_usdc += amount;
    return this.save();
};
// Method to add uploaded video
CreatorSchema.methods.addUploadedVideo = function (videoId) {
    if (!this.uploadedVideos.includes(videoId)) {
        this.uploadedVideos.push(videoId);
        return this.save();
    }
    return Promise.resolve(this);
};
// Static method to find by wallet address
CreatorSchema.statics.findByWallet = function (walletAddress) {
    return this.findOne({ wallet_address: walletAddress.toLowerCase() });
};
// Static method to get top earners
CreatorSchema.statics.getTopEarners = function (limit = 10) {
    return this.find({ isActive: true })
        .sort({ total_earned_usdc: -1 })
        .limit(limit)
        .select('username profile_image_url total_earned_usdc totalViews isVerified');
};
// Pre-save middleware to ensure wallet address is lowercase
CreatorSchema.pre('save', function (next) {
    if (this.wallet_address) {
        this.wallet_address = this.wallet_address.toLowerCase();
    }
    next();
});
const Creator = (mongoose_1.default.models.Creator || mongoose_1.default.model('Creator', CreatorSchema));
exports.default = Creator;

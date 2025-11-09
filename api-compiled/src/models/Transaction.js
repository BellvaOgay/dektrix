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
const TransactionSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    video: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Video',
        required: true
    },
    type: {
        type: String,
        enum: ['unlock', 'tip', 'view', 'refund'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    amountDisplay: {
        type: String,
        required: true
    },
    transactionHash: {
        type: String,
        unique: true,
        sparse: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['crypto', 'farcaster', 'credit', 'basepay'],
        required: true
    },
    metadata: {
        blockNumber: Number,
        gasUsed: Number,
        gasPrice: Number,
        basePayAmount: Number,
        basePayApplied: Boolean
    }
}, {
    timestamps: true
});
// Indexes for better query performance (only in server environment)
if (typeof window === 'undefined') {
    TransactionSchema.index({ user: 1, createdAt: -1 });
    TransactionSchema.index({ video: 1, type: 1 });
    TransactionSchema.index({ transactionHash: 1 });
    TransactionSchema.index({ status: 1, createdAt: -1 });
    TransactionSchema.index({ type: 1, createdAt: -1 });
}
// Export the Transaction model with browser compatibility
let Transaction;
if (typeof window !== 'undefined') {
    // In browser environment, create a mock model
    Transaction = {};
}
else {
    // In server environment, use the actual mongoose model
    Transaction = mongoose_1.default.models.Transaction || mongoose_1.default.model('Transaction', TransactionSchema);
}
exports.default = Transaction;

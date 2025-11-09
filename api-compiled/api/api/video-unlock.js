"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const mongoose_1 = __importDefault(require("mongoose"));
const database_1 = require("../api-compiled/api/_lib/database");
const User_1 = __importDefault(require("../api-compiled/src/models/User"));
const Video_1 = __importDefault(require("../api-compiled/src/models/Video"));
const Transaction_1 = __importDefault(require("../api-compiled/src/models/Transaction"));
const utils_1 = require("../api-compiled/src/lib/utils");
async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
    try {
        await (0, database_1.connectDB)();
        const { userId, videoId, transactionHash, paymentMethod, amount, amountDisplay } = req.body;
        // Validate required fields
        if (!userId || !videoId || !transactionHash || !paymentMethod || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, videoId, transactionHash, paymentMethod, amount'
            });
        }
        // Validate amount is exactly 0.1 USDC (100000 wei)
        if (amount !== 100000) {
            return res.status(400).json({
                success: false,
                error: 'Invalid amount. Videos require exactly 0.1 USDC (100000 wei)'
            });
        }
        // Check if video exists
        const video = await Video_1.default.findById(videoId);
        if (!video) {
            return res.status(404).json({ success: false, error: 'Video not found' });
        }
        // Check if user exists
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        // Check if already unlocked
        if (user.videosUnlocked.includes(new mongoose_1.default.Types.ObjectId(videoId))) {
            return res.status(400).json({
                success: false,
                error: 'Video already unlocked'
            });
        }
        // Check if transaction hash already exists (prevent double spending)
        const existingTransaction = await Transaction_1.default.findOne({ transactionHash });
        if (existingTransaction) {
            return res.status(400).json({
                success: false,
                error: 'Transaction already processed'
            });
        }
        let finalAmount = amount;
        let basePayAmount = 0;
        let basePayApplied = false;
        // Apply BasePay if using basepay payment method
        if (paymentMethod === 'basepay') {
            const basePayResult = (0, utils_1.applyBasePay)(amount);
            finalAmount = basePayResult.finalAmount;
            basePayAmount = basePayResult.basePayAmount;
            basePayApplied = basePayResult.basePayApplied;
        }
        // Create transaction record
        const transaction = new Transaction_1.default({
            user: userId,
            video: videoId,
            type: 'unlock',
            amount: finalAmount,
            amountDisplay: amountDisplay || '0.1 USDC',
            paymentMethod,
            transactionHash,
            status: 'completed',
            metadata: {
                basePayAmount,
                basePayApplied,
                originalAmount: amount
            }
        });
        await transaction.save();
        // Update user's unlocked videos
        user.videosUnlocked.push(new mongoose_1.default.Types.ObjectId(videoId));
        await user.save();
        // Update video stats
        video.totalUnlocks += 1;
        await video.save();
        return res.status(200).json({
            success: true,
            data: {
                message: 'Video unlocked successfully',
                transaction: {
                    id: transaction._id,
                    type: transaction.type,
                    amount: transaction.amount,
                    amountDisplay: transaction.amountDisplay,
                    paymentMethod: transaction.paymentMethod,
                    transactionHash: transaction.transactionHash,
                    status: transaction.status
                },
                video: {
                    id: video._id,
                    title: video.title,
                    totalUnlocks: video.totalUnlocks
                },
                user: {
                    id: user._id,
                    unlockedVideosCount: user.videosUnlocked.length
                }
            }
        });
    }
    catch (error) {
        console.error('Error processing video unlock:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error: ' + error.message
        });
    }
}

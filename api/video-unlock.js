"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const mongoose_1 = __importDefault(require("mongoose"));
const database_1 = __importDefault(require("../src/lib/database"));
const User_js_1 = __importDefault(require("../src/models/User.js"));
const Video_js_1 = __importDefault(require("../src/models/Video.js"));
const Transaction_js_1 = __importDefault(require("../src/models/Transaction.js"));
const utils_1 = require("../src/lib/utils");
async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
    try {
        await (0, database_1.default)();
        const { userId, videoId, transactionHash, paymentMethod, amount, amountDisplay } = req.body;
        // Validate required fields
        if (!userId || !videoId || !transactionHash || !paymentMethod || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, videoId, transactionHash, paymentMethod, amount'
            });
        }
        // Validate amount is either 0.1 USDC (100000 wei) or 1 USDC (1000000 wei)
        if (amount !== 100000 && amount !== 1000000) {
            return res.status(400).json({
                success: false,
                error: 'Invalid amount. Videos require either 0.1 USDC (100000 wei) or 1 USDC (1000000 wei)'
            });
        }
        // Calculate view credits based on payment amount
        let viewCreditsToAdd = 0;
        if (amount === 100000) {
            viewCreditsToAdd = 1; // 0.1 USDC = 1 view credit
        }
        else if (amount === 1000000) {
            viewCreditsToAdd = 12; // 1 USDC = 12 view credits
        }
        // Check if video exists
        const video = await Video_js_1.default.findById(videoId);
        if (!video) {
            return res.status(404).json({ success: false, error: 'Video not found' });
        }
        // Check if user exists
        const user = await User_js_1.default.findById(userId);
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
        const existingTransaction = await Transaction_js_1.default.findOne({ transactionHash });
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
        const transaction = new Transaction_js_1.default({
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
        // Update user's unlocked videos and add view credits
        user.videosUnlocked.push(new mongoose_1.default.Types.ObjectId(videoId));
        user.viewCredits = (user.viewCredits || 0) + viewCreditsToAdd;
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
                    unlockedVideosCount: user.videosUnlocked.length,
                    viewCredits: user.viewCredits,
                    creditsAdded: viewCreditsToAdd
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

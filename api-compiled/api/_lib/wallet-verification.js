"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWalletConnection = verifyWalletConnection;
exports.checkUserCredits = checkUserCredits;
exports.getWalletConnectionStatus = getWalletConnectionStatus;
const database_js_1 = require("./database.js");
const User_js_1 = __importDefault(require("../../src/models/User.js"));
/**
 * Verify wallet connection and get user details
 */
async function verifyWalletConnection(walletAddress) {
    try {
        if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
            return {
                verified: false,
                error: 'Invalid wallet address format'
            };
        }
        await (0, database_js_1.connectDB)();
        // Find user by wallet address
        const user = await User_js_1.default.findOne({
            walletAddress: walletAddress.toLowerCase()
        });
        if (!user) {
            return {
                verified: false,
                error: 'Wallet not connected to any account'
            };
        }
        return {
            verified: true,
            userId: user._id.toString(),
            walletAddress: user.walletAddress,
            credits: user.viewCredits || 0
        };
    }
    catch (error) {
        console.error('Wallet verification error:', error);
        return {
            verified: false,
            error: 'System error during wallet verification'
        };
    }
}
/**
 * Check if user has sufficient credits for video access
 */
async function checkUserCredits(walletAddress, requiredCredits = 1) {
    try {
        const verification = await verifyWalletConnection(walletAddress);
        if (!verification.verified) {
            return {
                hasCredits: false,
                currentCredits: 0,
                requiredCredits
            };
        }
        return {
            hasCredits: (verification.credits || 0) >= requiredCredits,
            currentCredits: verification.credits || 0,
            requiredCredits
        };
    }
    catch (error) {
        console.error('Credit check error:', error);
        return {
            hasCredits: false,
            currentCredits: 0,
            requiredCredits
        };
    }
}
/**
 * Get wallet connection status for a user
 */
async function getWalletConnectionStatus(userId) {
    try {
        await (0, database_js_1.connectDB)();
        const user = await User_js_1.default.findById(userId);
        if (!user || !user.walletAddress) {
            return {
                connected: false
            };
        }
        return {
            connected: true,
            walletAddress: user.walletAddress,
            credits: user.viewCredits || 0
        };
    }
    catch (error) {
        console.error('Wallet status check error:', error);
        return {
            connected: false
        };
    }
}

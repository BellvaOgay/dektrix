"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.getBasePayAmount = getBasePayAmount;
exports.applyBasePay = applyBasePay;
exports.getPerViewChargeAmount = getPerViewChargeAmount;
exports.formatUSDC = formatUSDC;
exports.getPerViewChargeDisplay = getPerViewChargeDisplay;
exports.calculateBasePayPrice = calculateBasePayPrice;
exports.isBasePayEnabled = isBasePayEnabled;
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
// Base Pay helpers
function getBasePayAmount() {
    const envVal = (typeof process !== 'undefined' && process.env)
        ? (process.env.BASE_PAY_AMOUNT || process.env.VITE_BASE_PAY_AMOUNT)
        : undefined;
    const parsed = envVal ? Number(envVal) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
function applyBasePay(amount) {
    const basePayAmount = getBasePayAmount();
    const finalAmount = amount + basePayAmount;
    return {
        finalAmount,
        basePayAmount,
        basePayApplied: basePayAmount > 0
    };
}
// Per-view charge helpers
function getPerViewChargeAmount() {
    const envVal = (typeof process !== 'undefined' && process.env)
        ? (process.env.VIEW_CHARGE_AMOUNT || process.env.VITE_VIEW_CHARGE_AMOUNT)
        : undefined;
    const parsed = envVal ? Number(envVal) : 0.1;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0.1;
}
function formatUSDC(amount) {
    const fixed = Math.round(amount * 1000) / 1000;
    const str = fixed.toFixed(3).replace(/\.0+$/, '').replace(/\.$/, '');
    return `${str} USDC`;
}
function getPerViewChargeDisplay() {
    return formatUSDC(getPerViewChargeAmount());
}
// BasePay direct payment helpers
function calculateBasePayPrice(basePrice) {
    const basePayFee = getBasePayAmount();
    const totalPrice = basePrice + basePayFee;
    return {
        totalPrice,
        basePayFee,
        displayPrice: formatUSDC(totalPrice / 1000000) // Convert from wei to USDC
    };
}
function isBasePayEnabled() {
    return getBasePayAmount() > 0;
}

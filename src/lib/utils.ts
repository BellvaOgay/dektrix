import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Base Pay helpers
export function getBasePayAmount(): number {
  const envVal = (typeof process !== 'undefined' && process.env)
    ? (process.env.BASE_PAY_AMOUNT || process.env.VITE_BASE_PAY_AMOUNT)
    : undefined;
  const parsed = envVal ? Number(envVal) : 0;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function applyBasePay(amount: number): {
  finalAmount: number;
  basePayAmount: number;
  basePayApplied: boolean;
} {
  const basePayAmount = getBasePayAmount();
  const finalAmount = amount + basePayAmount;
  return {
    finalAmount,
    basePayAmount,
    basePayApplied: basePayAmount > 0
  };
}

// Per-view charge helpers
export function getPerViewChargeAmount(): number {
  const envVal = (typeof process !== 'undefined' && process.env)
    ? (process.env.VIEW_CHARGE_AMOUNT || process.env.VITE_VIEW_CHARGE_AMOUNT)
    : undefined;
  const parsed = envVal ? Number(envVal) : 0.1;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0.1;
}

export function formatUSDC(amount: number): string {
  const fixed = Math.round(amount * 1000) / 1000;
  const str = fixed.toFixed(3).replace(/\.0+$/,'').replace(/\.$/, '');
  return `${str} USDC`;
}

export function getPerViewChargeDisplay(): string {
  return formatUSDC(getPerViewChargeAmount());
}

// BasePay direct payment helpers
export function calculateBasePayPrice(basePrice: number): {
  totalPrice: number;
  basePayFee: number;
  displayPrice: string;
} {
  const basePayFee = getBasePayAmount();
  const totalPrice = basePrice + basePayFee;
  
  return {
    totalPrice,
    basePayFee,
    displayPrice: formatUSDC(totalPrice / 1000000) // Convert from wei to USDC
  };
}

export function isBasePayEnabled(): boolean {
  return getBasePayAmount() > 0;
}

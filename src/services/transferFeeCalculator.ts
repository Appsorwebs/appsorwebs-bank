/**
 * Transfer Fee Calculator
 * Calculates fees for domestic and international transfers
 */

export interface TransferFeeInfo {
  amount: number;
  feeType: 'domestic' | 'international';
  baseFee: number;
  percentageFee: number;
  totalFee: number;
  totalWithFee: number;
  exchangeRate?: number;
  recipientAmount?: number;
}

export const TRANSFER_FEES = {
  domestic: {
    baseFee: 0.5,
    percentageFee: 0.01 // 1%
  },
  international: {
    baseFee: 2.5,
    percentageFee: 0.015 // 1.5%
  }
};

/**
 * Calculate transfer fee
 */
export const calculateTransferFee = (
  amount: number,
  type: 'domestic' | 'international'
): TransferFeeInfo => {
  const feeConfig = TRANSFER_FEES[type];
  const baseFee = feeConfig.baseFee;
  const percentageFee = amount * feeConfig.percentageFee;
  const totalFee = baseFee + percentageFee;

  return {
    amount,
    feeType: type,
    baseFee,
    percentageFee: Math.round(percentageFee * 100) / 100,
    totalFee: Math.round(totalFee * 100) / 100,
    totalWithFee: Math.round((amount + totalFee) * 100) / 100
  };
};

/**
 * Get fee breakdown for display
 */
export const getFeeBreakdown = (
  amount: number,
  type: 'domestic' | 'international'
): string => {
  const fee = calculateTransferFee(amount, type);
  const feePercent = ((fee.percentageFee / amount) * 100).toFixed(2);

  return `Base: $${fee.baseFee.toFixed(2)} + ${feePercent}% = $${fee.totalFee.toFixed(2)}`;
};

/**
 * Estimate international transfer (with currency conversion)
 */
export const estimateInternationalTransfer = (
  senderAmount: number,
  exchangeRate: number
): TransferFeeInfo => {
  const fee = calculateTransferFee(senderAmount, 'international');
  const recipientAmount = (senderAmount - fee.totalFee) * exchangeRate;

  return {
    ...fee,
    exchangeRate,
    recipientAmount: Math.round(recipientAmount * 100) / 100
  };
};

/**
 * Check if transfer amount exceeds limits
 */
export const checkTransferLimits = (
  amount: number,
  type: 'domestic' | 'international',
  userDailyLimit?: number,
  userMonthlyLimit?: number
): { allowed: boolean; reason?: string } => {
  const singleTransactionLimit = type === 'domestic' ? 100000 : 50000;

  if (amount > singleTransactionLimit) {
    return {
      allowed: false,
      reason: `Maximum ${type} transfer is $${singleTransactionLimit}`
    };
  }

  if (userDailyLimit && amount > userDailyLimit) {
    return {
      allowed: false,
      reason: `Daily limit exceeded. Available: $${userDailyLimit}`
    };
  }

  if (userMonthlyLimit && amount > userMonthlyLimit) {
    return {
      allowed: false,
      reason: `Monthly limit exceeded. Available: $${userMonthlyLimit}`
    };
  }

  return { allowed: true };
};

/**
 * Get standard transfer times
 */
export const getTransferEstimateTime = (
  type: 'domestic' | 'international'
): string => {
  switch (type) {
    case 'domestic':
      return '1-2 hours';
    case 'international':
      return '1-3 business days';
    default:
      return 'Unknown';
  }
};

/**
 * Get corridor-specific fees (for specific country routes)
 */
export const getCorridorFee = (
  fromCountry: string,
  toCountry: string,
  amount: number
): TransferFeeInfo => {
  // In production, fetch from database based on corridor
  // Different corridors may have different fees
  // For now, use standard international fees
  return calculateTransferFee(amount, 'international');
};

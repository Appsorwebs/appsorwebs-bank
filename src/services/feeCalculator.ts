/**
 * Escrow Fee Calculator
 * Transparent, tiered fee structure for buyer protection
 */

export interface FeeCalculation {
  amount: number;
  fee: number;
  total: number;
  feePercentage: number;
  feeType: 'flat' | 'percentage';
}

export const calculateEscrowFee = (amount: number): FeeCalculation => {
  let fee = 0;
  let feeType: 'flat' | 'percentage' = 'flat';

  if (amount < 100) {
    // $0 - $99.99: $1 flat fee
    fee = 1;
  } else if (amount < 500) {
    // $100 - $499.99: $2 flat fee
    fee = 2;
  } else if (amount < 1000) {
    // $500 - $999.99: $3 flat fee
    fee = 3;
  } else {
    // $1,000+: 2% of total
    fee = amount * 0.02;
    feeType = 'percentage';
  }

  return {
    amount,
    fee: Math.round(fee * 100) / 100,
    total: Math.round((amount + fee) * 100) / 100,
    feePercentage: (fee / amount) * 100,
    feeType
  };
};

/**
 * Get fee information for display
 */
export const getFeeInfo = (amount: number): string => {
  const { fee, feeType } = calculateEscrowFee(amount);

  if (feeType === 'flat') {
    return `$${fee.toFixed(2)} flat fee`;
  } else {
    return `${((fee / amount) * 100).toFixed(2)}% fee ($${fee.toFixed(2)})`;
  }
};

/**
 * Calculate buyer protection guarantee
 * Funds are held and only released when both parties agree or auto-release date passes
 */
export const getAutoReleaseDate = (
  createdDate: Date,
  daysDuration: number = 30
): Date => {
  const releaseDate = new Date(createdDate);
  releaseDate.setDate(releaseDate.getDate() + daysDuration);
  return releaseDate;
};

/**
 * Determine if escrow is eligible for early release
 */
export const isEligibleForEarlyRelease = (
  status: string,
  buyerApproved: boolean,
  sellerApproved: boolean
): boolean => {
  return (
    status === 'active' &&
    buyerApproved &&
    sellerApproved
  );
};

export interface Transaction {
  id: string;
  type: 'escrow' | 'transfer' | 'savings' | 'card' | 'withdrawal';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'disputed' | 'cancelled';
  description: string;
  date: string;
  fromUser?: string;
  toUser?: string;
  escrowId?: string;
}

export interface EscrowTransaction {
  id: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  description: string;
  status: 'active' | 'completed' | 'disputed' | 'cancelled';
  terms: string;
  createdDate: string;
  releaseDate?: string;
  autoReleaseDate: string;
  fee: number;
}

export interface SavingsAccount {
  id: string;
  type: 'spend-save' | 'target-save' | 'fixed-save';
  balance: number;
  currency: string;
  interestRate: number;
  targetAmount?: number;
  targetDate?: string;
  lockPeriod?: number;
  createdDate: string;
  lastTransaction: string;
}

export interface DebitCard {
  id: string;
  cardNumber: string;
  expiryDate: string;
  holderName: string;
  isActive: boolean;
  isVirtual: boolean;
  spendingLimits: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  allowInternational: boolean;
  allowOnline: boolean;
}
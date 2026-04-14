export const mockTransactions = [
  {
    id: '1',
    type: 'escrow',
    amount: 2500.00,
    currency: 'USD',
    status: 'completed',
    description: 'Website Development Project',
    date: '2024-01-20',
    fromUser: 'TechCorp Inc.',
    escrowId: 'ESC001'
  },
  {
    id: '2',
    type: 'transfer',
    amount: 850.00,
    currency: 'EUR',
    status: 'completed',
    description: 'International Transfer',
    date: '2024-01-19',
    toUser: 'Marie Dubois'
  },
  {
    id: '3',
    type: 'savings',
    amount: 125.50,
    currency: 'USD',
    status: 'completed',
    description: 'Automatic Savings Deposit',
    date: '2024-01-18'
  },
  {
    id: '4',
    type: 'card',
    amount: -45.99,
    currency: 'USD',
    status: 'completed',
    description: 'Online Purchase - Amazon',
    date: '2024-01-18'
  }
];

export const mockEscrowTransactions = [
  {
    id: 'ESC001',
    buyerId: '1',
    sellerId: '2',
    amount: 2500.00,
    currency: 'USD',
    description: 'Website Development Project',
    status: 'completed',
    terms: 'Funds to be released upon project completion and buyer approval',
    createdDate: '2024-01-15',
    releaseDate: '2024-01-20',
    autoReleaseDate: '2024-01-30',
    fee: 50.00
  },
  {
    id: 'ESC002',
    buyerId: '1',
    sellerId: '3',
    amount: 1200.00,
    currency: 'EUR',
    description: 'Graphic Design Services',
    status: 'active',
    terms: 'Funds held until design approval and delivery of final files',
    createdDate: '2024-01-18',
    autoReleaseDate: '2024-02-01',
    fee: 24.00
  }
];

export const mockSavingsAccounts = [
  {
    id: 'SAV001',
    type: 'spend-save',
    balance: 1247.89,
    currency: 'USD',
    interestRate: 1.2,
    createdDate: '2024-01-01',
    lastTransaction: '2024-01-20'
  },
  {
    id: 'SAV002',
    type: 'target-save',
    balance: 3567.45,
    currency: 'USD',
    interestRate: 3.5,
    targetAmount: 10000,
    targetDate: '2024-06-01',
    createdDate: '2024-01-05',
    lastTransaction: '2024-01-19'
  },
  {
    id: 'SAV003',
    type: 'fixed-save',
    balance: 25000.00,
    currency: 'USD',
    interestRate: 6.8,
    lockPeriod: 365,
    createdDate: '2024-01-10',
    lastTransaction: '2024-01-10'
  }
];

export const mockDebitCards = [
  {
    id: 'CARD001',
    cardNumber: '**** **** **** 1234',
    expiryDate: '12/27',
    holderName: 'John Doe',
    isActive: true,
    isVirtual: false,
    spendingLimits: {
      daily: 2000,
      weekly: 10000,
      monthly: 25000
    },
    allowInternational: true,
    allowOnline: true
  },
  {
    id: 'CARD002',
    cardNumber: '**** **** **** 5678',
    expiryDate: '08/26',
    holderName: 'John Doe',
    isActive: true,
    isVirtual: true,
    spendingLimits: {
      daily: 500,
      weekly: 2000,
      monthly: 5000
    },
    allowInternational: false,
    allowOnline: true
  }
];

export const calculateEscrowFee = (amount) => {
  if (amount < 100) return 1;
  if (amount < 500) return 2;
  if (amount < 1000) return 3;
  return (amount * 2) / 100;
};
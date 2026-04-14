/**
 * Flutterwave Payment Gateway Adapter
 * Handles multi-currency payments across Africa, Europe, and beyond
 */

export interface FlutterwavePaymentPayload {
  userId: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  amount: number;
  currency: string;
  txRef: string;
  description: string;
  country?: string;
  metadata?: Record<string, any>;
  redirectUrl?: string;
}

export interface FlutterwavePaymentResponse {
  success: boolean;
  paymentLink?: string;
  transactionId?: string;
  txRef?: string;
  status?: 'success' | 'pending' | 'failed';
  error?: string;
  errorCode?: string;
}

export interface FlutterwaveTransactionStatus {
  status: 'success' | 'failed' | 'pending';
  txRef: string;
  flwRef: string;
  amount: number;
  currency: string;
  paymentType: string;
  processorResponse: string;
}

export class FlutterwaveAdapter {
  private static readonly FLUTTERWAVE_KEY = process.env.VITE_FLUTTERWAVE_PUBLIC_KEY || 'pk_test_demo';
  private static readonly FLUTTERWAVE_SECRET = process.env.VITE_FLUTTERWAVE_SECRET_KEY || 'sk_test_demo';
  private static readonly FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

  /**
   * Initialize Flutterwave
   */
  static async initialize(): Promise<boolean> {
    try {
      return !!this.FLUTTERWAVE_KEY;
    } catch (error) {
      console.error('Failed to initialize Flutterwave:', error);
      return false;
    }
  }

  /**
   * Create payment link (recommended method)
   */
  static async createPaymentLink(
    payload: FlutterwavePaymentPayload
  ): Promise<FlutterwavePaymentResponse> {
    try {
      // Validate amount
      if (payload.amount <= 0 || payload.amount > 10000000) {
        return {
          success: false,
          error: 'Invalid payment amount',
          errorCode: 'invalid_amount'
        };
      }

      // Supported currencies: NGN, GHS, ZAR, KES, TZS, UGX, RWF, XOF, USD, EUR, GBP
      const supportedCurrencies = [
        'NGN',
        'GHS',
        'ZAR',
        'KES',
        'TZS',
        'UGX',
        'RWF',
        'XOF',
        'USD',
        'EUR',
        'GBP',
        'CAD',
        'AUD'
      ];

      if (!supportedCurrencies.includes(payload.currency)) {
        return {
          success: false,
          error: `Currency ${payload.currency} not supported`,
          errorCode: 'unsupported_currency'
        };
      }

      // In production: call Flutterwave API
      // const response = await fetch(`${this.FLUTTERWAVE_BASE_URL}/payments`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.FLUTTERWAVE_SECRET}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     tx_ref: payload.txRef,
      //     amount: payload.amount,
      //     currency: payload.currency,
      //     description: payload.description,
      //     customer: {
      //       email: payload.email,
      //       name: payload.fullName,
      //       phonenumber: payload.phoneNumber
      //     },
      //     customizations: {
      //       title: 'Appsorwebs Bank Payment',
      //       logo: 'https://appsorwebs.com/logo.png'
      //     },
      //     redirect_url: payload.redirectUrl,
      //     meta: payload.metadata
      //   })
      // });

      // Mock response
      const link_id = Math.random().toString(36).substring(2, 15);
      const paymentLink = `https://ravemodal.flutterwave.com/?link_id=${link_id}`;

      return {
        success: true,
        paymentLink,
        txRef: payload.txRef,
        status: 'pending'
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create payment';
      return {
        success: false,
        error: message,
        errorCode: 'payment_creation_failed'
      };
    }
  }

  /**
   * Verify payment
   */
  static async verifyPayment(
    txRef: string
  ): Promise<FlutterwaveTransactionStatus | { success: false; error: string }> {
    try {
      // In production: call Flutterwave API
      // const response = await fetch(
      //   `${this.FLUTTERWAVE_BASE_URL}/transactions/verify_by_reference?tx_ref=${txRef}`,
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${this.FLUTTERWAVE_SECRET}`
      //     }
      //   }
      // );

      // Mock response
      return {
        status: 'success',
        txRef,
        flwRef: `FLW${Date.now()}`,
        amount: 50000,
        currency: 'NGN',
        paymentType: 'card',
        processorResponse: 'Approved'
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      return {
        success: false,
        error: message
      };
    }
  }

  /**
   * Initialize bulk transfer (for payouts)
   */
  static async initiateBulkTransfer(
    transfers: Array<{
      account_number: string;
      account_bank: string;
      amount: number;
      currency: string;
      narration: string;
      reference: string;
    }>
  ): Promise<{ success: boolean; batchId?: string; error?: string }> {
    try {
      // In production: call Flutterwave bulk transfer API

      const batchId = `batch_${Date.now()}`;

      return {
        success: true,
        batchId
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bulk transfer failed';
      return {
        success: false,
        error: message
      };
    }
  }

  /**
   * Get transfer status
   */
  static async getTransferStatus(
    transferId: string
  ): Promise<{
    success: boolean;
    status?: 'success' | 'failed' | 'pending';
    error?: string;
  }> {
    try {
      // In production: call Flutterwave API

      return {
        success: true,
        status: 'success'
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get status';
      return {
        success: false,
        error: message
      };
    }
  }

  /**
   * Get banks for specific country
   */
  static async getBanks(countryCode: string): Promise<{
    success: boolean;
    banks?: Array<{ id: number; name: string; code: string }>;
    error?: string;
  }> {
    try {
      // In production: call Flutterwave API
      // const response = await fetch(
      //   `${this.FLUTTERWAVE_BASE_URL}/banks/${countryCode}`,
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${this.FLUTTERWAVE_SECRET}`
      //     }
      //   }
      // );

      // Mock banks for Nigeria
      if (countryCode === 'NG') {
        return {
          success: true,
          banks: [
            { id: 1, name: 'Access Bank', code: '044' },
            { id: 2, name: 'Guaranty Trust Bank', code: '058' },
            { id: 3, name: 'First Bank', code: '011' },
            { id: 4, name: 'United Bank of Africa', code: '033' },
            { id: 5, name: 'Zenith Bank', code: '057' },
            { id: 6, name: 'Diamond Bank', code: '063' },
            { id: 7, name: 'FCMB', code: '070' }
          ]
        };
      }

      return {
        success: true,
        banks: []
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get banks';
      return {
        success: false,
        error: message
      };
    }
  }

  /**
   * Resolve bank account
   */
  static async resolveBankAccount(
    accountNumber: string,
    bankCode: string,
    countryCode: string
  ): Promise<{ success: boolean; accountName?: string; error?: string }> {
    try {
      // In production: call Flutterwave API
      // const response = await fetch(
      //   `${this.FLUTTERWAVE_BASE_URL}/accounts/resolve?account_number=${accountNumber}&account_bank=${bankCode}&country=${countryCode}`,
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${this.FLUTTERWAVE_SECRET}`
      //     }
      //   }
      // );

      // Mock response
      return {
        success: true,
        accountName: 'Sample Account Holder Name'
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Resolution failed';
      return {
        success: false,
        error: message
      };
    }
  }

  /**
   * Get balance
   */
  static async getBalance(): Promise<{
    success: boolean;
    balance?: number;
    currency?: string;
    error?: string;
  }> {
    try {
      // In production: call Flutterwave API

      return {
        success: true,
        balance: 500000,
        currency: 'NGN'
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get balance';
      return {
        success: false,
        error: message
      };
    }
  }

  /**
   * Get transaction fees
   */
  static async getTransactionFees(
    amount: number,
    currency: string
  ): Promise<{
    success: boolean;
    fee?: number;
    total?: number;
    error?: string;
  }> {
    try {
      // In production: call Flutterwave API for accurate fees

      // Mock fees: 1.4% + fixed cost
      const fee = amount * 0.014 + 100;
      const total = amount + fee;

      return {
        success: true,
        fee: Math.round(fee * 100) / 100,
        total: Math.round(total * 100) / 100
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get fees';
      return {
        success: false,
        error: message
      };
    }
  }

  /**
   * Webhook handler
   */
  static async handleWebhook(signature: string, body: string): Promise<boolean> {
    try {
      // In production: verify webhook signature with Flutterwave secret
      // const crypto = require('crypto');
      // const hash = crypto
      //   .createHmac('sha256', this.FLUTTERWAVE_SECRET)
      //   .update(body)
      //   .digest('hex');
      //
      // if (hash !== signature) {
      //   return false;
      // }

      const event = JSON.parse(body);

      switch (event.event) {
        case 'charge.completed':
          console.log('Payment completed:', event.data);
          return true;
        case 'charge.failed':
          console.log('Payment failed:', event.data);
          return true;
        case 'transfer.completed':
          console.log('Transfer completed:', event.data);
          return true;
        default:
          return true;
      }
    } catch (error) {
      console.error('Webhook error:', error);
      return false;
    }
  }
}

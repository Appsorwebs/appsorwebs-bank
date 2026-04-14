/**
 * Paystack Payment Gateway Adapter
 * Handles payments in African markets (Nigeria, Ghana, South Africa, Kenya)
 */

export interface PaystackPaymentPayload {
  userId: string;
  email: string;
  amount: number;
  currency: string;
  description: string;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface PaystackPaymentResponse {
  success: boolean;
  authorizationUrl?: string;
  accessCode?: string;
  reference?: string;
  transactionId?: string;
  status?: 'success' | 'pending' | 'failed';
  error?: string;
}

export interface PaystackTransactionStatus {
  reference: string;
  status: 'success' | 'pending' | 'failed';
  amount: number;
  currency: string;
  paidAt?: string;
  customerEmail?: string;
}

export class PaystackAdapter {
  private static readonly PAYSTACK_KEY = process.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_demo';
  private static readonly PAYSTACK_SECRET = process.env.VITE_PAYSTACK_SECRET_KEY || 'sk_test_demo';
  private static readonly PAYSTACK_BASE_URL = 'https://api.paystack.co';

  /**
   * Initialize Paystack
   */
  static async initialize(): Promise<boolean> {
    try {
      // Verify API key is available
      return !!this.PAYSTACK_KEY;
    } catch (error) {
      console.error('Failed to initialize Paystack:', error);
      return false;
    }
  }

  /**
   * Initialize transaction (get payment link)
   */
  static async initializeTransaction(
    payload: PaystackPaymentPayload
  ): Promise<PaystackPaymentResponse> {
    try {
      // Validate amount (in kobo for Nigerian Naira)
      if (payload.amount <= 0 || payload.amount > 10000000) {
        return {
          success: false,
          error: 'Invalid payment amount'
        };
      }

      // Supported currencies: GHS, ZAR, KES, NGN, USD
      const supportedCurrencies = ['GHS', 'ZAR', 'KES', 'NGN', 'USD'];
      if (!supportedCurrencies.includes(payload.currency)) {
        return {
          success: false,
          error: `Currency ${payload.currency} not supported by Paystack`
        };
      }

      // Generate reference if not provided
      const reference = payload.reference || `txn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // In production: call Paystack API
      // const response = await fetch(`${this.PAYSTACK_BASE_URL}/transaction/initialize`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.PAYSTACK_SECRET}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     email: payload.email,
      //     amount: Math.round(payload.amount * 100), // Convert to smallest unit
      //     currency: payload.currency,
      //     reference,
      //     metadata: payload.metadata
      //   })
      // });

      // Mock response
      const accessCode = Math.random().toString(36).substring(2, 15);
      const authorizationUrl = `https://checkout.paystack.com/${accessCode}`;

      return {
        success: true,
        authorizationUrl,
        accessCode,
        reference,
        status: 'pending'
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize payment';
      return {
        success: false,
        error: message
      };
    }
  }

  /**
   * Verify transaction status
   */
  static async verifyTransaction(
    reference: string
  ): Promise<PaystackTransactionStatus | { success: false; error: string }> {
    try {
      // In production: call Paystack API
      // const response = await fetch(
      //   `${this.PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${this.PAYSTACK_SECRET}`,
      //       'Content-Type': 'application/json'
      //     }
      //   }
      // );

      // Mock response
      return {
        reference,
        status: 'success',
        amount: 10000,
        currency: 'NGN',
        paidAt: new Date().toISOString()
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
   * Get transaction details
   */
  static async getTransaction(transactionId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      // In production: call Paystack API
      // const response = await fetch(
      //   `${this.PAYSTACK_BASE_URL}/transaction/${transactionId}`,
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${this.PAYSTACK_SECRET}`
      //     }
      //   }
      // );

      // Mock response
      return {
        success: true,
        data: {
          id: transactionId,
          reference: `txn_${transactionId}`,
          status: 'success',
          amount: 10000,
          currency: 'NGN',
          customer: {
            email: 'customer@example.com',
            phone: '+234901234567'
          }
        }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get transaction';
      return {
        success: false,
        error: message
      };
    }
  }

  /**
   * Refund transaction
   */
  static async refundTransaction(
    reference: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      // In production: call Paystack API
      // Note: Paystack has specific refund requirements

      // Mock refund
      const refundId = `ref_paystack_${Date.now()}`;

      return {
        success: true,
        refundId
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Refund failed';
      return {
        success: false,
        error: message
      };
    }
  }

  /**
   * Initialize recurring charge (subscription)
   */
  static async initializeRecurringCharge(
    email: string,
    amount: number,
    currency: string,
    planCode?: string,
    authorizationCode?: string
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
      // In production: call Paystack API for subscription setup

      const subscriptionId = `sub_${Date.now()}`;

      return {
        success: true,
        subscriptionId
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Subscription failed';
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
      // In production: verify webhook signature
      // const crypto = require('crypto');
      // const hash = crypto
      //   .createHmac('sha512', this.PAYSTACK_SECRET)
      //   .update(body)
      //   .digest('hex');
      //
      // if (hash !== signature) {
      //   return false;
      // }

      const event = JSON.parse(body);

      switch (event.event) {
        case 'charge.success':
          console.log('Charge successful:', event.data);
          return true;
        case 'charge.failed':
          console.log('Charge failed:', event.data);
          return true;
        case 'customeridentification.success':
          console.log('Customer identified:', event.data);
          return true;
        default:
          return true;
      }
    } catch (error) {
      console.error('Webhook error:', error);
      return false;
    }
  }

  /**
   * Get Paystack supported banks
   */
  static async getBanks(): Promise<{
    success: boolean;
    banks?: Array<{ id: number; name: string; code: string }>;
    error?: string;
  }> {
    try {
      // In production: call Paystack API for list of supported banks
      // This is used for bank transfer payments

      // Mock banks
      return {
        success: true,
        banks: [
          { id: 1, name: 'Access Bank', code: '044' },
          { id: 2, name: 'GTB', code: '058' },
          { id: 3, name: 'First Bank Nigeria', code: '011' },
          { id: 4, name: 'UBA', code: '033' },
          { id: 5, name: 'Zenith Bank', code: '057' }
        ]
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
    bankCode: string
  ): Promise<{ success: boolean; accountName?: string; error?: string }> {
    try {
      // In production: call Paystack API to verify account

      // Mock response
      return {
        success: true,
        accountName: 'Sample Account Holder'
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Account resolution failed';
      return {
        success: false,
        error: message
      };
    }
  }
}

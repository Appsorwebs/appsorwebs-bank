/**
 * Stripe Payment Gateway Adapter
 * Handles credit card, debit card, and wallet payments
 */

export interface StripePaymentPayload {
  userId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  source: 'card' | 'wallet';
  cardToken?: string;
  cardNumber?: string;
  cardExp?: string;
  cardCVC?: string;
  metadata?: Record<string, any>;
}

export interface StripePaymentResponse {
  success: boolean;
  transactionId?: string;
  chargeId?: string;
  status?: 'succeeded' | 'processing' | 'requires_action';
  amount?: number;
  currency?: string;
  error?: string;
  errorCode?: string;
}

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  defaultPaymentMethod?: string;
}

export class StripeAdapter {
  private static readonly STRIPE_KEY = process.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_demo';
  private static readonly STRIPE_SECRET = process.env.VITE_STRIPE_SECRET_KEY || 'sk_test_demo';

  /**
   * Initialize Stripe (in production, use @stripe/stripe-js)
   */
  static async initialize(): Promise<boolean> {
    try {
      // In production: await loadStripe(this.STRIPE_KEY)
      return true;
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      return false;
    }
  }

  /**
   * Create or get Stripe customer
   */
  static async createCustomer(
    userId: string,
    email: string,
    name?: string
  ): Promise<{ success: boolean; customerId?: string; error?: string }> {
    try {
      // In production: call Stripe API to create customer
      // const customer = await stripe.customers.create({
      //   email,
      //   name,
      //   metadata: { appUserId: userId }
      // });

      // Mock response
      const customerId = `cus_${userId.substring(0, 8)}_stripe`;
      return { success: true, customerId };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create customer';
      return { success: false, error: message };
    }
  }

  /**
   * Process card payment
   */
  static async processCardPayment(
    payload: StripePaymentPayload
  ): Promise<StripePaymentResponse> {
    try {
      // Validate amount
      if (payload.amount <= 0 || payload.amount > 100000) {
        return {
          success: false,
          error: 'Invalid payment amount',
          errorCode: 'invalid_amount'
        };
      }

      // Validate currency
      const validCurrencies = ['USD', 'EUR', 'GBP', 'NGN', 'ZAR', 'KES'];
      if (!validCurrencies.includes(payload.currency)) {
        return {
          success: false,
          error: 'Currency not supported by Stripe',
          errorCode: 'invalid_currency'
        };
      }

      // In production: call Stripe API
      // const charge = await stripe.charges.create({
      //   amount: Math.round(payload.amount * 100), // Convert to cents
      //   currency: payload.currency.toLowerCase(),
      //   source: payload.cardToken,
      //   description: payload.description,
      //   metadata: payload.metadata
      // });

      // Mock successful payment
      const transactionId = `txn_${Date.now()}`;
      const chargeId = `ch_${Math.random().toString(36).substring(2, 15)}`;

      return {
        success: true,
        transactionId,
        chargeId,
        status: 'succeeded',
        amount: payload.amount,
        currency: payload.currency
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment processing failed';
      return {
        success: false,
        error: message,
        errorCode: 'payment_failed'
      };
    }
  }

  /**
   * Verify card
   */
  static async verifyCard(
    cardNumber: string,
    expMonth: string,
    expYear: string,
    cvc: string
  ): Promise<{ valid: boolean; network?: string; brand?: string }> {
    try {
      // In production: use Stripe's card validation
      // const result = await stripe.confirmCardPayment(...);

      // Mock validation
      const isValid = cardNumber.length === 16 && cvc.length >= 3;
      const network = cardNumber.startsWith('4') ? 'Visa' : 'MasterCard';

      return {
        valid: isValid,
        brand: network,
        network
      };
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Create payment intent (for 3D Secure, etc.)
   */
  static async createPaymentIntent(
    amount: number,
    currency: string,
    customerId: string,
    description: string
  ): Promise<{ success: boolean; clientSecret?: string; intentId?: string; error?: string }> {
    try {
      // In production: call Stripe API
      // const paymentIntent = await stripe.paymentIntents.create({
      //   amount: Math.round(amount * 100),
      //   currency: currency.toLowerCase(),
      //   customer: customerId,
      //   description,
      //   automatic_payment_methods: { enabled: true }
      // });

      // Mock response
      const intentId = `pi_${Math.random().toString(36).substring(2, 15)}`;
      const clientSecret = `${intentId}_secret_${Math.random().toString(36).substring(2, 25)}`;

      return {
        success: true,
        intentId,
        clientSecret
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create payment intent';
      return { success: false, error: message };
    }
  }

  /**
   * Refund payment
   */
  static async refundPayment(
    chargeId: string,
    amount?: number
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      // In production: call Stripe API
      // const refund = await stripe.refunds.create({
      //   charge: chargeId,
      //   amount: amount ? Math.round(amount * 100) : undefined
      // });

      // Mock refund
      const refundId = `ref_${Date.now()}`;

      return {
        success: true,
        refundId
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Refund failed';
      return { success: false, error: message };
    }
  }

  /**
   * Get payment status
   */
  static async getPaymentStatus(chargeId: string): Promise<{
    status: 'succeeded' | 'failed' | 'processing';
    amount?: number;
    currency?: string;
  }> {
    try {
      // In production: call Stripe API to get charge details
      return {
        status: 'succeeded',
        amount: 100,
        currency: 'USD'
      };
    } catch (error) {
      return {
        status: 'failed'
      };
    }
  }

  /**
   * Save card for future use
   */
  static async saveCard(
    customerId: string,
    cardToken: string,
    isDefault: boolean = false
  ): Promise<{ success: boolean; paymentMethodId?: string; error?: string }> {
    try {
      // In production: call Stripe API
      // const paymentMethod = await stripe.paymentMethods.attach(
      //   cardToken,
      //   { customer: customerId }
      // );

      // Mock save
      const paymentMethodId = `pm_${Math.random().toString(36).substring(2, 15)}`;

      return {
        success: true,
        paymentMethodId
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save card';
      return { success: false, error: message };
    }
  }

  /**
   * Charge saved card
   */
  static async chargeSavedCard(
    customerId: string,
    paymentMethodId: string,
    amount: number,
    currency: string,
    description: string
  ): Promise<StripePaymentResponse> {
    try {
      // In production: create payment intent with saved payment method
      const intentId = `pi_${Math.random().toString(36).substring(2, 15)}`;

      return {
        success: true,
        transactionId: intentId,
        chargeId: `ch_${Math.random().toString(36).substring(2, 15)}`,
        status: 'succeeded',
        amount,
        currency
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment failed';
      return {
        success: false,
        error: message,
        errorCode: 'charge_failed'
      };
    }
  }

  /**
   * Webhook handler for Stripe events
   */
  static async handleWebhook(event: any): Promise<boolean> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          console.log('Payment succeeded:', event.data.object);
          return true;
        case 'payment_intent.payment_failed':
          console.log('Payment failed:', event.data.object);
          return true;
        case 'charge.refunded':
          console.log('Charge refunded:', event.data.object);
          return true;
        default:
          return true;
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
      return false;
    }
  }
}

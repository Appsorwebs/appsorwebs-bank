/**
 * Payment Gateway Service
 * Unified interface for all payment providers
 * Automatically selects best gateway based on currency and region
 */

import { StripeAdapter, StripePaymentResponse } from './stripeAdapter';
import { PaystackAdapter, PaystackPaymentResponse } from './paystackAdapter';
import { FlutterwaveAdapter, FlutterwavePaymentResponse } from './flutterwaveAdapter';
import { auditLogger } from '../lib/supabase';

export type PaymentProvider = 'stripe' | 'paystack' | 'flutterwave' | 'auto';

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  description: string;
  email: string;
  reference: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface PaymentConfig {
  provider?: PaymentProvider;
  email: string;
  amount: number;
  currency: string;
  description: string;
  name?: string;
  phone?: string;
  country?: string;
  userId: string;
  metadata?: Record<string, any>;
}

export class PaymentGatewayService {
  /**
   * Select optimal payment provider based on currency and region
   */
  static selectProvider(currency: string, country?: string): PaymentProvider {
    // African currencies - prioritize Paystack and Flutterwave
    const paystackCurrencies = ['NGN', 'GHS', 'ZAR', 'KES'];
    const flutterwaveCurrencies = [
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
      'GBP'
    ];

    // If in Nigeria, prefer Paystack (best for NGN)
    if (country === 'NG' && paystackCurrencies.includes(currency)) {
      return 'paystack';
    }

    // Multi-currency - use Flutterwave
    if (flutterwaveCurrencies.includes(currency)) {
      return 'flutterwave';
    }

    // Default to Stripe for international
    return 'stripe';
  }

  /**
   * Process payment
   */
  static async processPayment(
    config: PaymentConfig
  ): Promise<{
    success: boolean;
    paymentLink?: string;
    reference?: string;
    error?: string;
    provider: PaymentProvider;
  }> {
    try {
      // Select provider
      const provider = config.provider === 'auto'
        ? this.selectProvider(config.currency, config.country)
        : config.provider || this.selectProvider(config.currency, config.country);

      let result: any;

      switch (provider) {
        case 'paystack':
          result = await PaystackAdapter.initializeTransaction({
            userId: config.userId,
            email: config.email,
            amount: config.amount,
            currency: config.currency,
            description: config.description,
            reference: `paystack_${Date.now()}`,
            metadata: config.metadata
          });
          break;

        case 'flutterwave':
          result = await FlutterwaveAdapter.createPaymentLink({
            userId: config.userId,
            email: config.email,
            fullName: config.name || 'User',
            phoneNumber: config.phone || '',
            amount: config.amount,
            currency: config.currency,
            description: config.description,
            txRef: `flutterwave_${Date.now()}`,
            country: config.country,
            metadata: config.metadata
          });
          break;

        case 'stripe':
        default:
          result = await StripeAdapter.createPaymentIntent(
            config.amount,
            config.currency,
            `cus_${config.userId}`,
            config.description
          );
          break;
      }

      // Audit log
      await auditLogger.log(
        config.userId,
        'payment_initiated',
        `Payment initiated via ${provider}`,
        {
          amount: config.amount,
          currency: config.currency,
          provider,
          reference: result.reference || result.txRef || result.intentId
        }
      );

      return {
        success: result.success,
        paymentLink: result.authorizationUrl || result.paymentLink,
        reference: result.reference || result.txRef || result.intentId,
        error: result.error,
        provider
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment processing failed';

      await auditLogger.log(
        config.userId,
        'payment_failed',
        message,
        config
      );

      return {
        success: false,
        error: message,
        provider: 'stripe'
      };
    }
  }

  /**
   * Verify payment across all providers
   */
  static async verifyPayment(
    reference: string,
    provider: PaymentProvider
  ): Promise<{
    success: boolean;
    status: 'succeeded' | 'failed' | 'pending';
    amount?: number;
    currency?: string;
    error?: string;
  }> {
    try {
      let result: any;

      switch (provider) {
        case 'paystack':
          result = await PaystackAdapter.verifyTransaction(reference);
          break;

        case 'flutterwave':
          result = await FlutterwaveAdapter.verifyPayment(reference);
          break;

        case 'stripe':
        default:
          result = await StripeAdapter.getPaymentStatus(reference);
          break;
      }

      return {
        success: result.status === 'success' || result.status === 'succeeded',
        status: result.status === 'success' || result.status === 'succeeded'
          ? 'succeeded'
          : 'failed',
        amount: result.amount,
        currency: result.currency,
        error: !result.status ? 'Payment verification failed' : undefined
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      return {
        success: false,
        status: 'failed',
        error: message
      };
    }
  }

  /**
   * Refund payment
   */
  static async refundPayment(
    chargeId: string,
    provider: PaymentProvider,
    userId: string,
    amount?: number
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      let result: any;

      switch (provider) {
        case 'paystack':
          result = await PaystackAdapter.refundTransaction(chargeId);
          break;

        case 'flutterwave':
          // Flutterwave doesn't support direct refunds through API
          // Must be done through dashboard
          result = {
            success: false,
            error: 'Flutterwave refunds require dashboard action'
          };
          break;

        case 'stripe':
        default:
          result = await StripeAdapter.refundPayment(chargeId, amount);
          break;
      }

      if (result.success) {
        await auditLogger.log(userId, 'payment_refunded', 'Payment refunded', {
          chargeId,
          provider,
          amount
        });
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Refund failed';
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
    currency: string,
    provider?: PaymentProvider
  ): Promise<{
    provider: PaymentProvider;
    fee: number;
    total: number;
  }> {
    const selectedProvider = provider || this.selectProvider(currency);

    // Default fee structures
    const fees: Record<PaymentProvider, { base: number; percentage: number }> = {
      stripe: { base: 0.3, percentage: 0.029 }, // 2.9% + $0.30
      paystack: { base: 0, percentage: 0.015 }, // 1.5%
      flutterwave: { base: 0, percentage: 0.014 }, // 1.4%
      auto: { base: 0, percentage: 0 }
    };

    const feeConfig = fees[selectedProvider] || fees.stripe;
    const fee = amount * feeConfig.percentage + feeConfig.base;

    return {
      provider: selectedProvider,
      fee: Math.round(fee * 100) / 100,
      total: Math.round((amount + fee) * 100) / 100
    };
  }

  /**
   * Initialize all payment providers
   */
  static async initializeAll(): Promise<{ stripe: boolean; paystack: boolean; flutterwave: boolean }> {
    const results = await Promise.all([
      StripeAdapter.initialize(),
      PaystackAdapter.initialize(),
      FlutterwaveAdapter.initialize()
    ]);

    return {
      stripe: results[0],
      paystack: results[1],
      flutterwave: results[2]
    };
  }

  /**
   * Get provider status
   */
  static async getProviderStatus(provider: PaymentProvider): Promise<boolean> {
    switch (provider) {
      case 'stripe':
        return await StripeAdapter.initialize();
      case 'paystack':
        return await PaystackAdapter.initialize();
      case 'flutterwave':
        return await FlutterwaveAdapter.initialize();
      default:
        return false;
    }
  }

  /**
   * Get supported currencies for provider
   */
  static getSupportedCurrencies(provider: PaymentProvider): string[] {
    const currencies: Record<PaymentProvider, string[]> = {
      stripe: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'],
      paystack: ['NGN', 'GHS', 'ZAR', 'KES', 'USD'],
      flutterwave: [
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
      ],
      auto: ['USD']
    };

    return currencies[provider] || currencies.stripe;
  }
}

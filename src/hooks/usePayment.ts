/**
 * usePayment Hook
 * Custom hook for handling payments in components
 */

import { useState, useCallback } from 'react';
import { PaymentGatewayService, PaymentConfig, PaymentProvider } from '../services/paymentGateway';
import toast from 'react-hot-toast';

export interface PaymentState {
  loading: boolean;
  paymentLink?: string;
  reference?: string;
  status: 'idle' | 'processing' | 'success' | 'failed';
  error?: string;
  provider?: PaymentProvider;
  fees?: {
    fee: number;
    total: number;
    provider: PaymentProvider;
  };
}

export const usePayment = () => {
  const [paymentState, setPaymentState] = useState<PaymentState>({
    loading: false,
    status: 'idle'
  });

  /**
   * Initialize payment
   */
  const initiatePayment = useCallback(async (config: PaymentConfig) => {
    try {
      setPaymentState({
        loading: true,
        status: 'processing'
      });

      const result = await PaymentGatewayService.processPayment(config);

      if (result.success && result.paymentLink) {
        setPaymentState({
          loading: false,
          status: 'success',
          paymentLink: result.paymentLink,
          reference: result.reference,
          provider: result.provider
        });

        toast.success('Payment link generated. Redirecting...');
        return {
          success: true,
          paymentLink: result.paymentLink,
          reference: result.reference,
          provider: result.provider
        };
      } else {
        const error = result.error || 'Payment initiation failed';
        setPaymentState({
          loading: false,
          status: 'failed',
          error
        });

        toast.error(error);
        return {
          success: false,
          error
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment error';
      setPaymentState({
        loading: false,
        status: 'failed',
        error: message
      });

      toast.error(message);
      return {
        success: false,
        error: message
      };
    }
  }, []);

  /**
   * Verify payment
   */
  const verifyPayment = useCallback(
    async (reference: string, provider: PaymentProvider) => {
      try {
        setPaymentState({
          loading: true,
          status: 'processing'
        });

        const result = await PaymentGatewayService.verifyPayment(reference, provider);

        if (result.success) {
          setPaymentState({
            loading: false,
            status: 'success',
            reference
          });

          toast.success('Payment verified successfully!');
          return {
            success: true,
            status: result.status,
            amount: result.amount,
            currency: result.currency
          };
        } else {
          setPaymentState({
            loading: false,
            status: 'failed',
            error: result.error
          });

          toast.error('Payment verification failed');
          return {
            success: false,
            error: result.error
          };
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Verification error';
        setPaymentState({
          loading: false,
          status: 'failed',
          error: message
        });

        return {
          success: false,
          error: message
        };
      }
    },
    []
  );

  /**
   * Refund payment
   */
  const refundPayment = useCallback(
    async (
      chargeId: string,
      provider: PaymentProvider,
      userId: string,
      amount?: number
    ) => {
      try {
        setPaymentState({
          loading: true,
          status: 'processing'
        });

        const result = await PaymentGatewayService.refundPayment(
          chargeId,
          provider,
          userId,
          amount
        );

        if (result.success) {
          setPaymentState({
            loading: false,
            status: 'success'
          });

          toast.success('Payment refunded successfully');
          return {
            success: true,
            refundId: result.refundId
          };
        } else {
          setPaymentState({
            loading: false,
            status: 'failed',
            error: result.error
          });

          toast.error(result.error || 'Refund failed');
          return {
            success: false,
            error: result.error
          };
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Refund error';
        setPaymentState({
          loading: false,
          status: 'failed',
          error: message
        });

        return {
          success: false,
          error: message
        };
      }
    },
    []
  );

  /**
   * Calculate fees
   */
  const calculateFees = useCallback(
    async (amount: number, currency: string, provider?: PaymentProvider) => {
      try {
        const fees = await PaymentGatewayService.getTransactionFees(
          amount,
          currency,
          provider
        );

        setPaymentState((prev) => ({
          ...prev,
          fees
        }));

        return fees;
      } catch (error) {
        console.error('Error calculating fees:', error);
        return {
          provider: provider || 'stripe',
          fee: 0,
          total: amount
        };
      }
    },
    []
  );

  /**
   * Get supported currencies
   */
  const getSupportedCurrencies = useCallback((provider: PaymentProvider) => {
    return PaymentGatewayService.getSupportedCurrencies(provider);
  }, []);

  /**
   * Select best provider
   */
  const selectProvider = useCallback(
    (currency: string, country?: string): PaymentProvider => {
      return PaymentGatewayService.selectProvider(currency, country);
    },
    []
  );

  /**
   * Reset state
   */
  const resetPayment = useCallback(() => {
    setPaymentState({
      loading: false,
      status: 'idle'
    });
  }, []);

  return {
    // State
    paymentState,
    loading: paymentState.loading,
    status: paymentState.status,
    error: paymentState.error,
    reference: paymentState.reference,
    paymentLink: paymentState.paymentLink,
    fees: paymentState.fees,

    // Methods
    initiatePayment,
    verifyPayment,
    refundPayment,
    calculateFees,
    getSupportedCurrencies,
    selectProvider,
    resetPayment
  };
};

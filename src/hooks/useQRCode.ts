/**
 * useQRCode Hook
 * Custom hook for managing QR code payments and scanning
 */

import { useState, useCallback, useEffect } from 'react';
import { QRService, QRPayment, QRTransaction, QRScanResult } from '../services/qrService';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export interface QRCodeState {
  qrPayments: QRPayment[];
  selectedQRPayment?: QRPayment;
  loading: boolean;
  error?: string;
  stats: {
    totalQRCodes: number;
    activeQRCodes: number;
    totalTransactions: number;
    totalRevenue: number;
    averageTransaction: number;
  };
}

export const useQRCode = () => {
  const { user } = useAuth();
  const [qrState, setQRState] = useState<QRCodeState>({
    qrPayments: [],
    loading: false,
    stats: {
      totalQRCodes: 0,
      activeQRCodes: 0,
      totalTransactions: 0,
      totalRevenue: 0,
      averageTransaction: 0
    }
  });

  /**
   * Load user's QR payments
   */
  const loadQRPayments = useCallback(async () => {
    if (!user) return;

    try {
      setQRState((prev) => ({ ...prev, loading: true }));
      const qrPaymentsResult = await QRService.getMerchantQRPayments(user.id);
      const statsResult = await QRService.getQRStats(user.id);

      if (!qrPaymentsResult.success || !statsResult.success) {
        throw new Error(qrPaymentsResult.error || statsResult.error || 'Failed to load QR payments');
      }

      setQRState((prev) => ({
        ...prev,
        qrPayments: qrPaymentsResult.data || [],
        stats: statsResult.data || prev.stats,
        loading: false
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load QR payments';
      setQRState((prev) => ({
        ...prev,
        loading: false,
        error: message
      }));
      toast.error(message);
    }
  }, [user]);

  /**
   * Generate new QR payment
   */
  const generateQRPayment = useCallback(
    async (data: {
      merchantName: string;
      merchantEmail: string;
      merchantPhone: string;
      amount?: number;
      currency: string;
      description: string;
      expiryDays?: number;
    }) => {
      if (!user) {
        toast.error('User not authenticated');
        return null;
      }

      try {
        const result = await QRService.generateQRPayment(user.id, data);
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to generate QR code');
        }

        const qrPayment = result.data;
        const statsResult = await QRService.getQRStats(user.id);

        setQRState((prev) => {
          const updatedQRs = [qrPayment, ...prev.qrPayments];
          return {
            ...prev,
            qrPayments: updatedQRs,
            stats: statsResult.success ? statsResult.data || prev.stats : prev.stats
          };
        });

        toast.success('QR code generated successfully');
        return qrPayment;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate QR code';
        toast.error(message);
        return null;
      }
    },
    [user]
  );

  /**
   * Process QR payment
   */
  const processQRPayment = useCallback(
    async (
      qrPaymentId: string,
      payerId: string,
      payerName: string,
      payerAccountNumber: string,
      amount: number
    ) => {
      try {
        const result = await QRService.processQRPayment(
          qrPaymentId,
          payerId,
          payerName,
          payerAccountNumber,
          amount
        );

        if (!result.success || !result.transaction) {
          throw new Error(result.error || 'Payment processing failed');
        }

        setQRState((prev) => {
          const updatedQRs = prev.qrPayments; // Note: Would need async update in production
          return {
            ...prev,
            qrPayments: updatedQRs
          };
        });

        toast.success(`Payment of ₦${amount.toLocaleString()} processed successfully`);
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to process payment';
        toast.error(message);
        return { success: false, error: message };
      }
    },
    []
  );

  /**
   * Scan QR code
   */
  const scanQRCode = useCallback(async (qrData: string) => {
    const result = await QRService.scanQRCode(qrData);
    return result.success ? result.data : null;
  }, []);

  /**
   * Share QR payment
   */
  const shareQRPayment = useCallback(async (qrPaymentId: string) => {
    try {
      const result = await QRService.shareQRPayment(qrPaymentId);
      if (result.success) {
        toast.success('Share link copied to clipboard');
        return result;
      } else {
        throw new Error(result.error || 'QR payment not found');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to share QR payment';
      toast.error(message);
      return { success: false };
    }
  }, []);

  /**
   * Download QR code
   */
  const downloadQRCode = useCallback(async (qrPaymentId: string) => {
    try {
      const result = await QRService.downloadQRCode(qrPaymentId);
      if (result.success) {
        // In production, this would trigger actual download
        toast.success('QR code ready for download');
        return result;
      } else {
        throw new Error(result.error || 'QR payment not found');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to download QR code';
      toast.error(message);
      return { success: false };
    }
  }, []);

  /**
   * Delete QR payment
   */
  const deleteQRPayment = useCallback(
    async (qrPaymentId: string) => {
      try {
        const result = await QRService.deleteQRPayment(qrPaymentId);
        if (!result.success) {
          throw new Error(result.error || 'QR payment not found');
        }

        setQRState((prev) => {
          const updatedQRs = prev.qrPayments.filter((q) => q.id !== qrPaymentId);

          return {
            ...prev,
            qrPayments: updatedQRs,
            selectedQRPayment:
              prev.selectedQRPayment?.id === qrPaymentId
                ? undefined
                : prev.selectedQRPayment
          };
        });

        toast.success('QR payment deleted');
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete QR payment';
        toast.error(message);
        return false;
      }
    },
    []
  );

  /**
   * Get transaction history
   */
  const getTransactionHistory = useCallback(async (qrPaymentId: string) => {
    const result = await QRService.getQRTransactionHistory(qrPaymentId);
    return result.success ? result.data || [] : [];
  }, []);

  /**
   * Get payment link
   */
  const getPaymentLink = useCallback(async (qrPaymentId: string) => {
    const result = await QRService.getPaymentLink(qrPaymentId);
    return result.success ? result.data : null;
  }, []);

  /**
   * Validate QR amount
   */
  const validateQRAmount = useCallback(async (qrPaymentId: string, amount: number) => {
    const result = await QRService.validateQRAmount(qrPaymentId, amount);
    return result.success ? result.data : false;
  }, []);

  /**
   * Generate bulk QR codes
   */
  const generateBulkQRCodes = useCallback(
    async (
      count: number,
      baseData: {
        merchantName: string;
        merchantEmail: string;
        merchantPhone: string;
        amount?: number;
        currency: string;
        description: string;
      }
    ) => {
      if (!user) {
        toast.error('User not authenticated');
        return [];
      }

      try {
        const result = await QRService.generateBulkQRCodes(user.id, count, baseData);
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to generate bulk QR codes');
        }

        const qrPayments = result.data;
        const statsResult = await QRService.getQRStats(user.id);

        setQRState((prev) => {
          const updatedQRs = [...qrPayments, ...prev.qrPayments];
          return {
            ...prev,
            qrPayments: updatedQRs,
            stats: statsResult.success ? statsResult.data || prev.stats : prev.stats
          };
        });

        toast.success(`${count} QR codes generated successfully`);
        return qrPayments;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate bulk QR codes';
        toast.error(message);
        return [];
      }
    },
    [user]
  );

  /**
   * Initialize - load QR payments on mount
   */
  useEffect(() => {
    loadQRPayments();
  }, [loadQRPayments]);

  return {
    // State
    qrPayments: qrState.qrPayments,
    selectedQRPayment: qrState.selectedQRPayment,
    loading: qrState.loading,
    error: qrState.error,
    stats: qrState.stats,

    // Methods
    loadQRPayments,
    generateQRPayment,
    processQRPayment,
    scanQRCode,
    shareQRPayment,
    downloadQRCode,
    deleteQRPayment,
    getTransactionHistory,
    getPaymentLink,
    validateQRAmount,
    generateBulkQRCodes
  };
};

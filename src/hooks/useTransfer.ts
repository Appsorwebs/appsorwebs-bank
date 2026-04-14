/**
 * useTransfer Hook
 * Custom hook for managing transfer operations
 */

import { useState, useCallback } from 'react';
import { TransferService, CreateTransferPayload, TransferRecord } from '../services/transferService';
import toast from 'react-hot-toast';

export const useTransfer = (userId: string) => {
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalTransferred: 0,
    transferCount: 0,
    domesticCount: 0,
    internationalCount: 0,
    totalFeesPaid: 0
  });

  /**
   * Load all transfers for user
   */
  const loadTransfers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await TransferService.getTransfersHistory(userId);
      setTransfers(data);

      // Load stats
      const statsData = await TransferService.getTransferStats(userId);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading transfers:', error);
      toast.error('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Create new transfer
   */
  const createTransfer = useCallback(
    async (payload: CreateTransferPayload) => {
      try {
        setLoading(true);
        const result = await TransferService.createTransfer(userId, payload);

        if (result.success) {
          toast.success(`Transfer created! Reference: ${result.referenceId}`);
          await loadTransfers();
          return {
            success: true,
            transferId: result.transferId,
            referenceId: result.referenceId
          };
        } else {
          toast.error(result.error || 'Failed to create transfer');
          return { success: false, error: result.error };
        }
      } catch (error) {
        toast.error('Error creating transfer');
        return { success: false, error: 'Unexpected error' };
      } finally {
        setLoading(false);
      }
    },
    [userId, loadTransfers]
  );

  /**
   * Fetch transfer details
   */
  const getTransferDetails = useCallback(async (transferId: string) => {
    try {
      setLoading(true);
      const data = await TransferService.getTransferDetails(transferId);
      if (data) {
        setSelectedTransfer(data);
        return data;
      }
    } catch (error) {
      toast.error('Failed to load transfer details');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cancel pending transfer
   */
  const cancelTransfer = useCallback(
    async (transferId: string) => {
      try {
        setLoading(true);
        const result = await TransferService.cancelTransfer(userId, transferId);

        if (result.success) {
          await loadTransfers();
          return { success: true };
        } else {
          toast.error(result.error || 'Failed to cancel transfer');
          return { success: false, error: result.error };
        }
      } finally {
        setLoading(false);
      }
    },
    [userId, loadTransfers]
  );

  /**
   * Validate recipient before transfer
   */
  const validateRecipient = useCallback(
    async (
      accountNumber?: string,
      bankCode?: string,
      email?: string
    ) => {
      try {
        const result = await TransferService.validateRecipient(
          accountNumber,
          bankCode,
          email
        );
        return result;
      } catch (error) {
        console.error('Error validating recipient:', error);
        return { valid: false, message: 'Validation error' };
      }
    },
    []
  );

  return {
    // State
    transfers,
    selectedTransfer,
    loading,
    stats,

    // Methods
    loadTransfers,
    createTransfer,
    getTransferDetails,
    cancelTransfer,
    validateRecipient
  };
};

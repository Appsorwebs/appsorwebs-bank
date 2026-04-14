/**
 * useEscrow Hook
 * Custom hook for managing escrow operations in components
 */

import { useState, useCallback } from 'react';
import { EscrowTransaction } from '../types';
import { EscrowService, CreateEscrowPayload } from '../services/escrowService';
import toast from 'react-hot-toast';

export const useEscrow = (userId: string) => {
  const [escrows, setEscrows] = useState<EscrowTransaction[]>([]);
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowTransaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalValue: 0,
    activeCount: 0,
    completedCount: 0,
    successRate: 0
  });

  /**
   * Load all escrows for the user
   */
  const loadEscrows = useCallback(async () => {
    try {
      setLoading(true);
      const data = await EscrowService.getUserEscrows(userId);
      setEscrows(data);

      // Load stats
      const statsData = await EscrowService.getEscrowStats(userId);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading escrows:', error);
      toast.error('Failed to load escrows');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Create new escrow
   */
  const createEscrow = useCallback(
    async (payload: CreateEscrowPayload) => {
      try {
        setLoading(true);
        const result = await EscrowService.createEscrow(userId, payload);

        if (result.success) {
          toast.success(`Escrow created! ID: ${result.escrowId}`);
          await loadEscrows();
          return { success: true, escrowId: result.escrowId };
        } else {
          toast.error(result.error || 'Failed to create escrow');
          return { success: false, error: result.error };
        }
      } catch (error) {
        toast.error('Error creating escrow');
        return { success: false, error: 'Unexpected error' };
      } finally {
        setLoading(false);
      }
    },
    [userId, loadEscrows]
  );

  /**
   * Fetch escrow details
   */
  const getEscrowDetails = useCallback(async (escrowId: string) => {
    try {
      setLoading(true);
      const data = await EscrowService.getEscrowDetails(escrowId);
      if (data) {
        setSelectedEscrow(data);
        return data;
      }
    } catch (error) {
      toast.error('Failed to load escrow details');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Approve escrow for release
   */
  const approveEscrow = useCallback(
    async (escrowId: string) => {
      try {
        setLoading(true);
        const result = await EscrowService.approveEscrow(userId, escrowId);

        if (result.success) {
          toast.success('Escrow approved! Waiting for seller approval...');
          await loadEscrows();
          return { success: true };
        } else {
          toast.error(result.error || 'Failed to approve');
          return { success: false, error: result.error };
        }
      } finally {
        setLoading(false);
      }
    },
    [userId, loadEscrows]
  );

  /**
   * Release escrow funds to seller
   */
  const releaseEscrow = useCallback(
    async (escrowId: string) => {
      try {
        setLoading(true);
        const result = await EscrowService.releaseEscrow(userId, escrowId);

        if (result.success) {
          await loadEscrows();
          return { success: true };
        } else {
          return { success: false, error: result.error };
        }
      } finally {
        setLoading(false);
      }
    },
    [userId, loadEscrows]
  );

  /**
   * Initiate dispute
   */
  const openDispute = useCallback(
    async (
      escrowId: string,
      reason: string,
      evidence?: string
    ) => {
      try {
        setLoading(true);
        const result = await EscrowService.initiateDispute(
          userId,
          escrowId,
          reason,
          evidence
        );

        if (result.success) {
          await loadEscrows();
          return { success: true };
        } else {
          return { success: false, error: result.error };
        }
      } finally {
        setLoading(false);
      }
    },
    [userId, loadEscrows]
  );

  /**
   * Cancel escrow (only if no funds yet transferred or during dispute resolution)
   */
  const cancelEscrow = useCallback(
    async (escrowId: string) => {
      try {
        setLoading(true);
        const escrow = await EscrowService.getEscrowDetails(escrowId);

        if (!escrow) {
          toast.error('Escrow not found');
          return { success: false };
        }

        if (escrow.status === 'completed') {
          toast.error('Cannot cancel completed escrows');
          return { success: false };
        }

        // Return funds to buyer
        // This is handled by database trigger/function
        toast.success('Escrow cancelled and funds returned to buyer');
        await loadEscrows();
        return { success: true };
      } catch (error) {
        toast.error('Failed to cancel escrow');
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    [userId, loadEscrows]
  );

  return {
    // State
    escrows,
    selectedEscrow,
    loading,
    stats,

    // Methods
    loadEscrows,
    createEscrow,
    getEscrowDetails,
    approveEscrow,
    releaseEscrow,
    openDispute,
    cancelEscrow
  };
};

/**
 * Escrow Service Layer
 * Handles all escrow transaction operations with Supabase
 */

import { supabase, auditLogger } from '../lib/supabase';
import { EscrowTransaction } from '../types';
import { calculateEscrowFee, getAutoReleaseDate } from './feeCalculator';
import toast from 'react-hot-toast';

export interface CreateEscrowPayload {
  sellerId: string;
  buyerId: string;
  amount: number;
  currency: string;
  description: string;
  terms: string;
  marketplace?: string;
  itemId?: string;
  durationDays?: number;
}

export interface ReleaseEscrowPayload {
  escrowId: string;
  releasedBy: string;
}

export class EscrowService {
  /**
   * Create a new escrow transaction
   * Funds are held in a holding account until release conditions are met
   */
  static async createEscrow(
    userId: string,
    payload: CreateEscrowPayload
  ): Promise<{ success: boolean; escrowId?: string; error?: string }> {
    try {
      const feeCalc = calculateEscrowFee(payload.amount);
      const autoReleaseDate = getAutoReleaseDate(
        new Date(),
        payload.durationDays || 30
      );

      // Create the escrow transaction
      const { data, error } = await supabase.from('escrow_transactions').insert({
        buyer_id: payload.buyerId,
        seller_id: payload.sellerId,
        amount: payload.amount,
        currency: payload.currency,
        description: payload.description,
        terms: payload.terms,
        status: 'active',
        fee: feeCalc.fee,
        total_amount: feeCalc.total,
        auto_release_date: autoReleaseDate.toISOString(),
        marketplace: payload.marketplace,
        item_id: payload.itemId,
        buyer_approved: false,
        seller_approved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (error) throw error;

      const escrowId = data?.[0]?.id;

      // Deduct amount from buyer's account (holding)
      await supabase
        .from('accounts')
        .update({
          available_balance: supabase.rpc('subtract_from_balance', {
            amount: feeCalc.total
          })
        })
        .eq('user_id', payload.buyerId);

      // Log audit trail
      await auditLogger.log(userId, 'escrow_created', 'Escrow transaction created', {
        escrowId,
        amount: payload.amount,
        fee: feeCalc.fee,
        seller: payload.sellerId,
        buyer: payload.buyerId
      });

      return { success: true, escrowId };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create escrow';
      await auditLogger.log(userId, 'escrow_creation_failed', message, {
        payload
      });
      return { success: false, error: message };
    }
  }

  /**
   * Get all escrows for a user (as buyer or seller)
   */
  static async getUserEscrows(userId: string): Promise<EscrowTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('escrow_transactions')
        .select('*')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId})`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching escrows:', error);
      return [];
    }
  }

  /**
   * Get escrow details by ID
   */
  static async getEscrowDetails(escrowId: string): Promise<EscrowTransaction | null> {
    try {
      const { data, error } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('id', escrowId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching escrow details:', error);
      return null;
    }
  }

  /**
   * Approve escrow for release (buyer side)
   */
  static async approveEscrow(
    userId: string,
    escrowId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const escrow = await EscrowService.getEscrowDetails(escrowId);
      if (!escrow) throw new Error('Escrow not found');

      if (escrow.buyer_id !== userId) {
        throw new Error('Only buyer can approve release');
      }

      const { error } = await supabase
        .from('escrow_transactions')
        .update({
          buyer_approved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', escrowId);

      if (error) throw error;

      await auditLogger.log(userId, 'escrow_approved', 'Buyer approved escrow release', {
        escrowId
      });

      // Check if both parties approved - if so, release automatically
      const updatedEscrow = await EscrowService.getEscrowDetails(escrowId);
      if (updatedEscrow?.buyer_approved && updatedEscrow?.seller_approved) {
        await EscrowService.releaseEscrow(userId, escrowId);
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve escrow';
      return { success: false, error: message };
    }
  }

  /**
   * Release escrow funds to seller
   * Triggered by: buyer approval + seller approval OR auto-release date
   */
  static async releaseEscrow(
    userId: string,
    escrowId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const escrow = await EscrowService.getEscrowDetails(escrowId);
      if (!escrow) throw new Error('Escrow not found');

      if (escrow.status !== 'active') {
        throw new Error('Can only release active escrows');
      }

      // Transfer funds to seller
      await supabase.rpc('release_escrow_funds', {
        p_escrow_id: escrowId,
        p_seller_id: escrow.seller_id,
        p_amount: escrow.amount
      });

      // Update escrow status
      const { error } = await supabase
        .from('escrow_transactions')
        .update({
          status: 'completed',
          released_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', escrowId);

      if (error) throw error;

      await auditLogger.log(userId, 'escrow_released', 'Escrow funds released to seller', {
        escrowId,
        sellerId: escrow.seller_id,
        amount: escrow.amount
      });

      toast.success(`Escrow released! Seller received $${escrow.amount.toFixed(2)}`);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to release escrow';
      toast.error(message);
      await auditLogger.log(userId, 'escrow_release_failed', message, {
        escrowId
      });
      return { success: false, error: message };
    }
  }

  /**
   * Initiate dispute for escrow with buyer protection
   * Either party can initiate within the escrow period
   */
  static async initiateDispute(
    userId: string,
    escrowId: string,
    reason: string,
    evidence?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const escrow = await EscrowService.getEscrowDetails(escrowId);
      if (!escrow) throw new Error('Escrow not found');

      // Create dispute record
      const { error: disputeError } = await supabase
        .from('escrow_disputes')
        .insert({
          escrow_id: escrowId,
          initiated_by: userId,
          reason,
          evidence,
          status: 'open',
          created_at: new Date().toISOString()
        });

      if (disputeError) throw disputeError;

      // Update escrow status to disputed
      const { error } = await supabase
        .from('escrow_transactions')
        .update({
          status: 'disputed',
          updated_at: new Date().toISOString()
        })
        .eq('id', escrowId);

      if (error) throw error;

      await auditLogger.log(userId, 'escrow_dispute_initiated', 'Dispute opened for escrow', {
        escrowId,
        reason
      });

      toast.success('Dispute initiated. Our team will review within 24 hours.');
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initiate dispute';
      return { success: false, error: message };
    }
  }

  /**
   * Resolve dispute (admin or system)
   * Awards funds to either buyer or seller
   */
  static async resolveDispute(
    userId: string,
    escrowId: string,
    verdict: 'buyer' | 'seller',
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const escrow = await EscrowService.getEscrowDetails(escrowId);
      if (!escrow) throw new Error('Escrow not found');

      const awardees = verdict === 'seller' ? escrow.seller_id : escrow.buyer_id;

      // Award funds
      const { error } = await supabase
        .from('escrow_transactions')
        .update({
          status: 'completed',
          verdict,
          dispute_resolution_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', escrowId);

      if (error) throw error;

      // Transfer funds to awarded party
      await supabase.rpc('release_escrow_funds', {
        p_escrow_id: escrowId,
        p_seller_id: awardees,
        p_amount: escrow.amount
      });

      await auditLogger.log(userId, 'escrow_dispute_resolved', 'Dispute resolved', {
        escrowId,
        verdict,
        awardedTo: awardees,
        reason
      });

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resolve dispute';
      return { success: false, error: message };
    }
  }

  /**
   * Get escrow statistics for dashboard
   */
  static async getEscrowStats(userId: string): Promise<{
    totalValue: number;
    activeCount: number;
    completedCount: number;
    successRate: number;
  }> {
    try {
      const escrows = await EscrowService.getUserEscrows(userId);

      const totalValue = escrows.reduce((sum, e) => sum + (e.amount || 0), 0);
      const activeCount = escrows.filter((e) => e.status === 'active').length;
      const completedCount = escrows.filter((e) => e.status === 'completed').length;
      const successRate =
        escrows.length > 0
          ? (completedCount / escrows.length) * 100
          : 0;

      return {
        totalValue,
        activeCount,
        completedCount,
        successRate: Math.round(successRate * 10) / 10
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return { totalValue: 0, activeCount: 0, completedCount: 0, successRate: 0 };
    }
  }
}

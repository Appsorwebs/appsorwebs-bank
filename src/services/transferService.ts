/**
 * Transfer Service Layer
 * Handles all transfer operations (domestic and international)
 */

import { supabase, auditLogger, securityUtils } from '../lib/supabase';
import { calculateTransferFee, checkTransferLimits } from './transferFeeCalculator';
import { CurrencyService } from './currencyService';
import toast from 'react-hot-toast';

export interface CreateTransferPayload {
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientBankAccount?: string;
  recipientBankCode?: string;
  amount: number;
  currency: string;
  description: string;
  type: 'domestic' | 'international';
  recipientCountry?: string;
  sourceAccount?: string;
}

export interface TransferRecord {
  id: string;
  referenceId: string;
  senderId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  amount: number;
  currency: string;
  fee: number;
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  type: 'domestic' | 'international';
  description: string;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  riskScore?: number;
}

export class TransferService {
  /**
   * Create a new transfer (domestic or international)
   */
  static async createTransfer(
    userId: string,
    payload: CreateTransferPayload
  ): Promise<{ success: boolean; transferId?: string; referenceId?: string; error?: string }> {
    try {
      // Validate transfer limits
      const limitCheck = checkTransferLimits(payload.amount, payload.type);
      if (!limitCheck.allowed) {
        throw new Error(limitCheck.reason || 'Transfer limit exceeded');
      }

      // Calculate fees
      const feeInfo = calculateTransferFee(payload.amount, payload.type);

      // Check if user has sufficient balance
      const { data: account } = await supabase
        .from('accounts')
        .select('available_balance')
        .eq('user_id', userId)
        .single();

      if (!account || account.available_balance < feeInfo.totalWithFee) {
        throw new Error('Insufficient balance for this transfer');
      }

      // Generate reference ID
      const referenceId = securityUtils.generateReferenceId();

      // Calculate risk score for fraud detection
      const riskScore = await TransferService.calculateTransferRisk(
        userId,
        payload,
        feeInfo.totalWithFee
      );

      // Create transfer record
      const { data, error } = await supabase.from('transfers').insert({
        user_id: userId,
        reference_id: referenceId,
        recipient_name: payload.recipientName,
        recipient_email: payload.recipientEmail,
        recipient_phone: payload.recipientPhone,
        recipient_bank_account: payload.recipientBankAccount,
        recipient_bank_code: payload.recipientBankCode,
        recipient_country: payload.recipientCountry,
        amount: payload.amount,
        currency: payload.currency,
        fee: feeInfo.totalFee,
        total_amount: feeInfo.totalWithFee,
        description: payload.description,
        type: payload.type,
        status: 'pending',
        risk_score: riskScore,
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      const transferId = data?.[0]?.id;

      // Deduct from account balance
      await supabase
        .from('accounts')
        .update({
          available_balance: account.available_balance - feeInfo.totalWithFee
        })
        .eq('user_id', userId);

      // Log audit trail
      await auditLogger.log(userId, 'transfer_created', 'Transfer initiated', {
        transferId,
        referenceId,
        amount: payload.amount,
        fee: feeInfo.totalFee,
        type: payload.type,
        recipient: payload.recipientName,
        riskScore
      });

      // Check if high risk - require additional verification
      if (riskScore > 70) {
        toast.error('High-risk transfer detected. Additional verification required.');
        return {
          success: true,
          transferId,
          referenceId,
          error: 'Requires verification'
        };
      }

      return { success: true, transferId, referenceId };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create transfer';
      toast.error(message);
      await auditLogger.log(userId, 'transfer_creation_failed', message, payload);
      return { success: false, error: message };
    }
  }

  /**
   * Get user's transfer history
   */
  static async getTransfersHistory(userId: string): Promise<TransferRecord[]> {
    try {
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching transfer history:', error);
      return [];
    }
  }

  /**
   * Get transfer details
   */
  static async getTransferDetails(transferId: string): Promise<TransferRecord | null> {
    try {
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .eq('id', transferId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching transfer details:', error);
      return null;
    }
  }

  /**
   * Cancel pending transfer
   */
  static async cancelTransfer(
    userId: string,
    transferId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const transfer = await TransferService.getTransferDetails(transferId);
      if (!transfer) throw new Error('Transfer not found');

      if (transfer.status !== 'pending') {
        throw new Error('Can only cancel pending transfers');
      }

      // Refund the amount to user
      const { data: account } = await supabase
        .from('accounts')
        .select('available_balance')
        .eq('user_id', userId)
        .single();

      if (account) {
        await supabase
          .from('accounts')
          .update({
            available_balance: account.available_balance + transfer.total_amount
          })
          .eq('user_id', userId);
      }

      // Update transfer status
      const { error } = await supabase
        .from('transfers')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', transferId);

      if (error) throw error;

      await auditLogger.log(userId, 'transfer_cancelled', 'Transfer cancelled', {
        transferId,
        amount: transfer.amount
      });

      toast.success('Transfer cancelled and funds refunded');
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel transfer';
      return { success: false, error: message };
    }
  }

  /**
   * Calculate fraud risk score
   * Returns 0-100 risk score
   */
  static async calculateTransferRisk(
    userId: string,
    payload: CreateTransferPayload,
    totalAmount: number
  ): Promise<number> {
    let riskScore = 0;

    // Large amount check
    if (totalAmount > 50000) {
      riskScore += 30;
    } else if (totalAmount > 10000) {
      riskScore += 15;
    }

    // International transfer check
    if (payload.type === 'international') {
      riskScore += 20;
    }

    // New recipient check
    try {
      const { count } = await supabase
        .from('transfers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('recipient_email', payload.recipientEmail || '')
        .eq('status', 'completed');

      if (!count || count === 0) {
        riskScore += 25; // New recipient
      }
    } catch (error) {
      console.error('Error checking recipient history:', error);
    }

    // Velocity check - transfers in last 24 hours
    try {
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { count } = await supabase
        .from('transfers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', last24h.toISOString())
        .neq('status', 'failed');

      if (count && count > 5) {
        riskScore += 20; // High velocity
      }
    } catch (error) {
      console.error('Error checking transfer velocity:', error);
    }

    return Math.min(riskScore, 100);
  }

  /**
   * Get transfer statistics for dashboard
   */
  static async getTransferStats(userId: string): Promise<{
    totalTransferred: number;
    transferCount: number;
    domesticCount: number;
    internationalCount: number;
    totalFeesPaid: number;
  }> {
    try {
      const transfers = await TransferService.getTransfersHistory(userId);

      const totalTransferred = transfers
        .filter((t) => t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalFeesPaid = transfers
        .filter((t) => t.status === 'completed')
        .reduce((sum, t) => sum + t.fee, 0);

      return {
        totalTransferred,
        transferCount: transfers.length,
        domesticCount: transfers.filter((t) => t.type === 'domestic').length,
        internationalCount: transfers.filter((t) => t.type === 'international').length,
        totalFeesPaid
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        totalTransferred: 0,
        transferCount: 0,
        domesticCount: 0,
        internationalCount: 0,
        totalFeesPaid: 0
      };
    }
  }

  /**
   * Validate recipient (bank account, email, phone)
   */
  static async validateRecipient(
    accountNumber?: string,
    bankCode?: string,
    email?: string
  ): Promise<{ valid: boolean; message?: string; recipientName?: string }> {
    try {
      // In production, validate with actual bank APIs
      // For now, basic validation

      if (!accountNumber && !email) {
        return { valid: false, message: 'Must provide account number or email' };
      }

      if (accountNumber && accountNumber.length < 10) {
        return { valid: false, message: 'Invalid account number format' };
      }

      if (email && !email.includes('@')) {
        return { valid: false, message: 'Invalid email format' };
      }

      // Mock validation - in production query bank APIs
      return { valid: true };
    } catch (error) {
      console.error('Error validating recipient:', error);
      return { valid: false, message: 'Validation failed' };
    }
  }
}

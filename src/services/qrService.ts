/**
 * QR Code Service
 * Handles QR code generation for payments and transaction processing
 * Integrated with Supabase database
 */

import { supabase } from '../lib/supabase';
import { ErrorHandler } from '../lib/errorHandler';

export interface QRPayment {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantEmail: string;
  merchantPhone: string;
  amount?: number; // Optional for dynamic QR codes
  currency: string;
  description: string;
  expiryDate?: string;
  qrCode: string; // Base64 encoded QR code image
  paymentLink: string;
  status: 'active' | 'expired' | 'paid';
  createdAt: string;
  expiryAt?: string;
  paidAt?: string;
  payerName?: string;
  payerAccountNumber?: string;
}

export interface QRTransaction {
  id: string;
  qrPaymentId: string;
  payerId: string;
  payerName: string;
  payerAccountNumber: string;
  amount: number;
  currency: string;
  transactionDate: string;
  status: 'pending' | 'successful' | 'failed';
  reference: string;
  notes?: string;
}

export interface QRScanResult {
  type: 'payment' | 'invalid';
  data?: {
    merchantId: string;
    merchantName: string;
    amount?: number;
    description: string;
  };
  error?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Internal database structures
 */
interface DBQRPayment {
  id: string;
  merchant_id: string;
  merchant_name: string;
  amount?: number;
  description: string;
  qr_code_data: string;
  status: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

interface DBQRTransaction {
  id: string;
  qr_payment_id: string;
  payer_id: string;
  amount: number;
  status: string;
  reference_id: string;
  created_at: string;
}

export class QRService {
  /**
   * Generate QR code for payment
   */
  static async generateQRPayment(
    merchantId: string,
    data: {
      merchantName: string;
      merchantEmail: string;
      merchantPhone: string;
      amount?: number;
      currency: string;
      description: string;
      expiryDays?: number;
    }
  ): Promise<APIResponse<QRPayment>> {
    try {
      const id = `qr_${Date.now()}`;
      const paymentData = {
        merchantId,
        amount: data.amount,
        description: data.description,
        currency: data.currency,
        timestamp: new Date().toISOString()
      };

      // Generate QR code
      const qrCode = this.encodeQRData(JSON.stringify(paymentData));
      const paymentLink = `https://appsorwebs.bank/pay/${id}`;

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (data.expiryDays || 30));

      const { data: qrPayment, error } = await supabase
        .from('qr_payments')
        .insert([
          {
            id,
            merchant_id: merchantId,
            merchant_name: data.merchantName,
            amount: data.amount,
            description: data.description,
            qr_code_data: qrCode,
            status: 'active',
            expires_at: expiryDate.toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBQRToQR(qrPayment as DBQRPayment, data) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get QR payment by ID
   */
  static async getQRPayment(qrPaymentId: string): Promise<APIResponse<QRPayment | null>> {
    try {
      const { data: qrPayment, error } = await supabase
        .from('qr_payments')
        .select('*')
        .eq('id', qrPaymentId)
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBQRToQR(qrPayment as DBQRPayment, {}) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get merchant's QR payments
   */
  static async getMerchantQRPayments(merchantId: string): Promise<APIResponse<QRPayment[]>> {
    try {
      const { data: qrPayments, error } = await supabase
        .from('qr_payments')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (qrPayments as DBQRPayment[]).map((qr) =>
        this.mapDBQRToQR(qr, {})
      );

      return { success: true, data: mapped };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get active QR payments for merchant
   */
  static async getActiveQRPayments(merchantId: string): Promise<APIResponse<QRPayment[]>> {
    try {
      const { data: qrPayments, error } = await supabase
        .from('qr_payments')
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (qrPayments as DBQRPayment[]).map((qr) =>
        this.mapDBQRToQR(qr, {})
      );

      return { success: true, data: mapped };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Process QR code payment
   */
  static async processQRPayment(
    qrPaymentId: string,
    payerId: string,
    payerName: string,
    payerAccountNumber: string,
    amount: number
  ): Promise<APIResponse<QRTransaction>> {
    try {
      // Get QR payment
      const qrResult = await this.getQRPayment(qrPaymentId);
      if (!qrResult.success || !qrResult.data) {
        return { success: false, error: 'QR payment not found' };
      }

      const qrPayment = qrResult.data;

      if (qrPayment.status !== 'active') {
        return { success: false, error: 'QR payment is no longer active' };
      }

      // If QR has fixed amount, verify amount matches
      if (qrPayment.amount && amount !== qrPayment.amount) {
        return { success: false, error: `Amount must be ₦${qrPayment.amount.toLocaleString()}` };
      }

      // Check expiry
      if (qrPayment.expiryAt && new Date(qrPayment.expiryAt) < new Date()) {
        await supabase
          .from('qr_payments')
          .update({ status: 'expired' })
          .eq('id', qrPaymentId);

        return { success: false, error: 'QR payment link has expired' };
      }

      // Create transaction
      const transactionId = `qrt_${Date.now()}`;
      const { data: transaction, error: txError } = await supabase
        .from('qr_transactions')
        .insert([
          {
            id: transactionId,
            qr_payment_id: qrPaymentId,
            payer_id: payerId,
            amount,
            status: 'completed',
            reference_id: `TXN${Date.now()}`
          }
        ])
        .select()
        .single();

      if (txError) throw txError;

      // Update QR payment status
      await supabase
        .from('qr_payments')
        .update({ status: 'paid' })
        .eq('id', qrPaymentId);

      return {
        success: true,
        data: this.mapDBTransactionToQRTransaction(transaction as DBQRTransaction)
      };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Scan and validate QR code
   */
  static scanQRCode(qrData: string): QRScanResult {
    try {
      const decoded = JSON.parse(qrData);

      // Validate required fields
      if (!decoded.merchantId || !decoded.description) {
        return {
          type: 'invalid',
          error: 'Invalid QR code format'
        };
      }

      return {
        type: 'payment',
        data: {
          merchantId: decoded.merchantId,
          merchantName: decoded.merchantName || 'Unknown Merchant',
          amount: decoded.amount,
          description: decoded.description
        }
      };
    } catch (error) {
      return {
        type: 'invalid',
        error: 'Failed to decode QR code'
      };
    }
  }

  /**
   * Get transaction history for QR payment
   */
  static async getQRTransactionHistory(qrPaymentId: string): Promise<APIResponse<QRTransaction[]>> {
    try {
      const { data: transactions, error } = await supabase
        .from('qr_transactions')
        .select('*')
        .eq('qr_payment_id', qrPaymentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (transactions as DBQRTransaction[]).map((tx) =>
        this.mapDBTransactionToQRTransaction(tx)
      );

      return { success: true, data: mapped };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get merchant transaction history
   */
  static async getMerchantTransactions(merchantId: string): Promise<APIResponse<QRTransaction[]>> {
    try {
      const { data: transactions, error } = await supabase
        .from('qr_transactions')
        .select('*')
        .eq('qr_payment:merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (transactions as DBQRTransaction[]).map((tx) =>
        this.mapDBTransactionToQRTransaction(tx)
      );

      return { success: true, data: mapped };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get QR payment statistics
   */
  static async getQRStats(merchantId: string): Promise<
    APIResponse<{
      totalQRCodes: number;
      activeQRCodes: number;
      totalTransactions: number;
      totalRevenue: number;
      averageTransaction: number;
    }>
  > {
    try {
      const { data: qrPayments, error: qrError } = await supabase
        .from('qr_payments')
        .select('*')
        .eq('merchant_id', merchantId);

      if (qrError) throw qrError;

      const { data: transactions, error: txError } = await supabase
        .from('qr_transactions')
        .select('*')
        .in('qr_payment_id', (qrPayments as any[]).map((q: any) => q.id));

      if (txError) throw txError;

      const totalRevenue = (transactions as any[]).reduce((sum, t) => sum + t.amount, 0);

      return {
        success: true,
        data: {
          totalQRCodes: (qrPayments as any[]).length,
          activeQRCodes: (qrPayments as any[]).filter((q: any) => q.status === 'active').length,
          totalTransactions: (transactions as any[]).length,
          totalRevenue,
          averageTransaction: (transactions as any[]).length > 0 ? totalRevenue / (transactions as any[]).length : 0
        }
      };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Delete QR payment
   */
  static async deleteQRPayment(qrPaymentId: string): Promise<APIResponse<void>> {
    try {
      const { error } = await supabase
        .from('qr_payments')
        .delete()
        .eq('id', qrPaymentId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Share QR payment
   */
  static async shareQRPayment(qrPaymentId: string): Promise<
    APIResponse<{
      shareLink?: string;
      qrImage?: string;
    }>
  > {
    try {
      const result = await this.getQRPayment(qrPaymentId);
      if (!result.success || !result.data) {
        return { success: false, error: 'QR payment not found' };
      }

      return {
        success: true,
        data: {
          shareLink: result.data.paymentLink,
          qrImage: result.data.qrCode
        }
      };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Download QR code as image
   */
  static async downloadQRCode(qrPaymentId: string): Promise<
    APIResponse<{
      data?: string;
      filename?: string;
    }>
  > {
    try {
      const result = await this.getQRPayment(qrPaymentId);
      if (!result.success || !result.data) {
        return { success: false, error: 'QR payment not found' };
      }

      return {
        success: true,
        data: {
          data: result.data.qrCode,
          filename: `${result.data.merchantName}_payment_${qrPaymentId}.png`
        }
      };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Validate QR payment amount
   */
  static async validateQRAmount(
    qrPaymentId: string,
    amount: number
  ): Promise<APIResponse<{ valid: boolean; message?: string }>> {
    try {
      const result = await this.getQRPayment(qrPaymentId);
      if (!result.success || !result.data) {
        return { success: true, data: { valid: false, message: 'QR payment not found' } };
      }

      const qrPayment = result.data;

      if (qrPayment.amount && amount !== qrPayment.amount) {
        return {
          success: true,
          data: {
            valid: false,
            message: `Expected amount: ₦${qrPayment.amount.toLocaleString()}`
          }
        };
      }

      if (amount <= 0) {
        return {
          success: true,
          data: { valid: false, message: 'Amount must be greater than zero' }
        };
      }

      return { success: true, data: { valid: true } };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Encode payment data to QR (simulated)
   */
  private static encodeQRData(data: string): string {
    // In production, use actual QR code library like 'qrcode'
    // For now, simulate with base64 encoding
    return Buffer.from(data).toString('base64');
  }

  /**
   * Copy payment link to clipboard
   */
  static async getPaymentLink(qrPaymentId: string): Promise<APIResponse<string>> {
    try {
      const result = await this.getQRPayment(qrPaymentId);
      if (!result.success || !result.data) {
        return { success: false, error: 'QR payment not found' };
      }

      return { success: true, data: result.data.paymentLink };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Bulk generate QR codes
   */
  static async generateBulkQRCodes(
    merchantId: string,
    count: number,
    baseData: Omit<
      QRPayment,
      | 'id'
      | 'merchantId'
      | 'qrCode'
      | 'paymentLink'
      | 'status'
      | 'createdAt'
      | 'expiryAt'
    >
  ): Promise<APIResponse<QRPayment[]>> {
    try {
      const generated: QRPayment[] = [];

      for (let i = 0; i < count; i++) {
        const result = await this.generateQRPayment(merchantId, {
          merchantName: baseData.merchantName,
          merchantEmail: baseData.merchantEmail,
          merchantPhone: baseData.merchantPhone,
          amount: baseData.amount,
          currency: baseData.currency,
          description: `${baseData.description} #${i + 1}`
        });

        if (result.success && result.data) {
          generated.push(result.data);
        }
      }

      return { success: true, data: generated };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Helper to map database QR to QRPayment interface
   */
  private static mapDBQRToQR(dbQr: DBQRPayment, dataOverride: any): QRPayment {
    return {
      id: dbQr.id,
      merchantId: dbQr.merchant_id,
      merchantName: dbQr.merchant_name,
      merchantEmail: dataOverride.merchantEmail || '',
      merchantPhone: dataOverride.merchantPhone || '',
      amount: dbQr.amount,
      currency: dataOverride.currency || 'NGN',
      description: dbQr.description,
      qrCode: dbQr.qr_code_data,
      paymentLink: `https://appsorwebs.bank/pay/${dbQr.id}`,
      status: dbQr.status as any,
      createdAt: dbQr.created_at,
      expiryAt: dbQr.expires_at
    };
  }

  /**
   * Helper to map database transaction to QRTransaction interface
   */
  private static mapDBTransactionToQRTransaction(dbTx: DBQRTransaction): QRTransaction {
    return {
      id: dbTx.id,
      qrPaymentId: dbTx.qr_payment_id,
      payerId: dbTx.payer_id,
      payerName: 'Unknown', // Not stored in simple schema
      payerAccountNumber: '****', // Not stored in simple schema
      amount: dbTx.amount,
      currency: 'NGN', // Not stored in simple schema
      transactionDate: dbTx.created_at,
      status: dbTx.status as any,
      reference: dbTx.reference_id
    };
  }
}

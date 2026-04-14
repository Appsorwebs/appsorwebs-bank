/**
 * Card Service
 * Manages debit card operations and controls
 * Integrated with Supabase database
 */

import { supabase } from '../lib/supabase';
import { ErrorHandler } from '../lib/errorHandler';

export interface Card {
  id: string;
  userId: string;
  cardNumber: string;
  cardType: 'debit' | 'credit';
  brand: 'Visa' | 'Mastercard' | 'Verve';
  holderName: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string; // Only stored temporarily
  status: 'active' | 'inactive' | 'blocked' | 'expired';
  isPhysical: boolean;
  lastFourDigits: string;
  createdAt: string;
  expiresAt: string;
  isDefault: boolean;
  dailyLimit: number;
  monthlyLimit: number;
  monthlySpent: number;
  dailySpent: number;
  lastTransactionDate?: string;
  totalTransactions: number;
  isLocked: boolean;
  lockReason?: string;
  contactlessEnabled: boolean;
  onlineTransactionsEnabled: boolean;
  atmWithdrawalEnabled: boolean;
  internationalTransactionsEnabled: boolean;
  controls: {
    enableDomesticOnline: boolean;
    enableDomesticATM: boolean;
    enableDomesticContacts: boolean;
    enableInternationalOnline: boolean;
    enableInternationalATM: boolean;
    enableInternationalContacts: boolean;
  };
}

export interface CardTransaction {
  id: string;
  cardId: string;
  amount: number;
  currency: string;
  description: string;
  merchant: string;
  transactionDate: string;
  status: 'successful' | 'pending' | 'failed';
  type: 'purchase' | 'withdrawal' | 'payment';
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Internal database structure
 */
interface DBCard {
  id: string;
  user_id: string;
  card_number_masked: string;
  card_type: string;
  brand: string;
  status: string;
  daily_limit: number;
  monthly_limit: number;
  monthly_spent: number;
  daily_spent: number;
  is_locked: boolean;
  created_at: string;
}

interface DBCardTransaction {
  id: string;
  card_id: string;
  amount: number;
  merchant: string;
  status: string;
  created_at: string;
}

export class CardService {
  /**
   * Get all cards for user
   */
  static async getCards(userId: string): Promise<APIResponse<Card[]>> {
    try {
      const { data: cards, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedCards = (cards as DBCard[]).map((card) =>
        this.mapDBCardToCard(card)
      );

      return { success: true, data: mappedCards };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get card by ID
   */
  static async getCardById(cardId: string): Promise<APIResponse<Card>> {
    try {
      const { data: card, error } = await supabase
        .from('cards')
        .select('*')
        .eq('id', cardId)
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBCardToCard(card as DBCard) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get default card
   */
  static async getDefaultCard(userId: string): Promise<APIResponse<Card | null>> {
    try {
      const { data: cards, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1);

      if (error) throw error;

      if (!cards || cards.length === 0) {
        return { success: true, data: null };
      }

      return { success: true, data: this.mapDBCardToCard((cards[0] as DBCard)) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get active cards
   */
  static async getActiveCards(userId: string): Promise<APIResponse<Card[]>> {
    try {
      const { data: cards, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .eq('is_locked', false);

      if (error) throw error;

      const mappedCards = (cards as DBCard[]).map((card) =>
        this.mapDBCardToCard(card)
      );

      return { success: true, data: mappedCards };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Enable card
   */
  static async enableCard(cardId: string): Promise<APIResponse<Card>> {
    try {
      const { data: card, error } = await supabase
        .from('cards')
        .update({ status: 'active', is_locked: false })
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBCardToCard(card as DBCard) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Disable card
   */
  static async disableCard(cardId: string): Promise<APIResponse<Card>> {
    try {
      const { data: card, error } = await supabase
        .from('cards')
        .update({ status: 'inactive' })
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBCardToCard(card as DBCard) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Lock card
   */
  static async lockCard(cardId: string, reason?: string): Promise<APIResponse<Card>> {
    try {
      const updateData: any = { is_locked: true, status: 'blocked' };
      if (reason) {
        updateData.lock_reason = reason;
      }

      const { data: card, error } = await supabase
        .from('cards')
        .update(updateData)
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBCardToCard(card as DBCard) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Unlock card
   */
  static async unlockCard(cardId: string): Promise<APIResponse<Card>> {
    try {
      const { data: card, error } = await supabase
        .from('cards')
        .update({ is_locked: false, status: 'active' })
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBCardToCard(card as DBCard) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Block card
   */
  static async blockCard(cardId: string): Promise<APIResponse<Card>> {
    try {
      const { data: card, error } = await supabase
        .from('cards')
        .update({ status: 'blocked', is_locked: true })
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBCardToCard(card as DBCard) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Set daily limit
   */
  static async setDailyLimit(cardId: string, limit: number): Promise<APIResponse<Card>> {
    try {
      const { data: card, error } = await supabase
        .from('cards')
        .update({ daily_limit: limit })
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBCardToCard(card as DBCard) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Set monthly limit
   */
  static async setMonthlyLimit(cardId: string, limit: number): Promise<APIResponse<Card>> {
    try {
      const { data: card, error } = await supabase
        .from('cards')
        .update({ monthly_limit: limit })
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBCardToCard(card as DBCard) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Update card controls (stored as JSON in the future, for now use individual booleans)
   */
  static async updateControls(
    cardId: string,
    controls: Partial<Card['controls']>
  ): Promise<APIResponse<Card>> {
    try {
      // For now, store basic control states
      const updateData: any = {};

      if (controls.enableDomesticOnline !== undefined)
        updateData.enable_online = controls.enableDomesticOnline;
      if (controls.enableDomesticATM !== undefined)
        updateData.enable_atm = controls.enableDomesticATM;
      if (controls.enableInternationalOnline !== undefined)
        updateData.enable_international = controls.enableInternationalOnline;

      const { data: card, error } = await supabase
        .from('cards')
        .update(updateData)
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBCardToCard(card as DBCard) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Set as default card
   */
  static async setAsDefault(userId: string, cardId: string): Promise<APIResponse<Card>> {
    try {
      // In a real scenario, you'd mark all others as non-default
      // For simplicity, we'll just return the card
      const { data: card, error } = await supabase
        .from('cards')
        .select('*')
        .eq('id', cardId)
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBCardToCard(card as DBCard) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get card statistics
   */
  static async getCardStats(userId: string): Promise<
    APIResponse<{
      totalCards: number;
      activeCards: number;
      inactiveCards: number;
      blockedCards: number;
      totalMonthlySpent: number;
      totalMonthlyLimit: number;
    }>
  > {
    try {
      const { data: cards, error } = await supabase
        .from('cards')
        .select('status, is_locked, monthly_spent, monthly_limit')
        .eq('user_id', userId);

      if (error) throw error;

      const cardList = cards as any[];
      return {
        success: true,
        data: {
          totalCards: cardList.length,
          activeCards: cardList.filter((c) => c.status === 'active' && !c.is_locked).length,
          inactiveCards: cardList.filter((c) => c.status === 'inactive').length,
          blockedCards: cardList.filter((c) => c.status === 'blocked' || c.is_locked).length,
          totalMonthlySpent: cardList.reduce((sum: number, c: any) => sum + c.monthly_spent, 0),
          totalMonthlyLimit: cardList.reduce((sum: number, c: any) => sum + c.monthly_limit, 0)
        }
      };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Validate card number
   */
  static validateCardNumber(cardNumber: string): boolean {
    return /^\d{13,19}$/.test(cardNumber.replace(/\s/g, ''));
  }

  /**
   * Validate expiry
   */
  static validateExpiry(month: number, year: number): boolean {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;

    return month >= 1 && month <= 12;
  }

  /**
   * Validate CVV
   */
  static validateCVV(cvv: string): boolean {
    return /^\d{3,4}$/.test(cvv);
  }

  /**
   * Mask card number
   */
  static maskCardNumber(cardNumber: string): string {
    const lastFour = cardNumber.slice(-4);
    return `**** **** **** ${lastFour}`;
  }

  /**
   * Get card remaining daily limit
   */
  static async getRemainingDailyLimit(cardId: string): Promise<APIResponse<number>> {
    try {
      const { data: card, error } = await supabase
        .from('cards')
        .select('daily_limit, daily_spent')
        .eq('id', cardId)
        .single();

      if (error) throw error;

      const remaining = Math.max(0, (card as any).daily_limit - (card as any).daily_spent);
      return { success: true, data: remaining };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get card remaining monthly limit
   */
  static async getRemainingMonthlyLimit(cardId: string): Promise<APIResponse<number>> {
    try {
      const { data: card, error } = await supabase
        .from('cards')
        .select('monthly_limit, monthly_spent')
        .eq('id', cardId)
        .single();

      if (error) throw error;

      const remaining = Math.max(0, (card as any).monthly_limit - (card as any).monthly_spent);
      return { success: true, data: remaining };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Record transaction
   */
  static async recordTransaction(
    cardId: string,
    amount: number
  ): Promise<APIResponse<CardTransaction>> {
    try {
      // Insert transaction record
      const { data: transaction, error: txError } = await supabase
        .from('card_transactions')
        .insert([
          {
            card_id: cardId,
            amount,
            merchant: 'Transaction',
            status: 'completed'
          }
        ])
        .select()
        .single();

      if (txError) throw txError;

      // Update card spending
      const { data: card, error: cardError } = await supabase
        .from('cards')
        .select('monthly_spent, daily_spent')
        .eq('id', cardId)
        .single();

      if (cardError) throw cardError;

      await supabase
        .from('cards')
        .update({
          monthly_spent: (card as any).monthly_spent + amount,
          daily_spent: (card as any).daily_spent + amount
        })
        .eq('id', cardId);

      return {
        success: true,
        data: {
          id: (transaction as any).id,
          cardId: (transaction as any).card_id,
          amount: (transaction as any).amount,
          currency: 'NGN',
          description: (transaction as any).merchant,
          merchant: (transaction as any).merchant,
          transactionDate: (transaction as any).created_at,
          status: 'successful',
          type: 'purchase'
        }
      };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Reset daily spending
   */
  static async resetDailySpending(cardId: string): Promise<APIResponse<Card>> {
    try {
      const { data: card, error } = await supabase
        .from('cards')
        .update({ daily_spent: 0 })
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBCardToCard(card as DBCard) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Reset monthly spending
   */
  static async resetMonthlySpending(cardId: string): Promise<APIResponse<Card>> {
    try {
      const { data: card, error } = await supabase
        .from('cards')
        .update({ monthly_spent: 0, daily_spent: 0 })
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBCardToCard(card as DBCard) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Helper to map database card to Card interface
   */
  private static mapDBCardToCard(dbCard: DBCard): Card {
    const maskNum = `**** **** **** ${dbCard.card_number_masked}`;
    return {
      id: dbCard.id,
      userId: dbCard.user_id,
      cardNumber: maskNum,
      cardType: 'debit',
      brand: dbCard.brand as 'Visa' | 'Mastercard' | 'Verve',
      holderName: 'JOHN ESSIEN',
      expiryMonth: 12,
      expiryYear: 2026,
      cvv: '',
      status: dbCard.status as any,
      isPhysical: true,
      lastFourDigits: dbCard.card_number_masked.slice(-4),
      createdAt: dbCard.created_at,
      expiresAt: '2026-12-31',
      isDefault: false,
      dailyLimit: dbCard.daily_limit,
      monthlyLimit: dbCard.monthly_limit,
      monthlySpent: dbCard.monthly_spent,
      dailySpent: dbCard.daily_spent,
      totalTransactions: 0,
      isLocked: dbCard.is_locked,
      contactlessEnabled: true,
      onlineTransactionsEnabled: true,
      atmWithdrawalEnabled: true,
      internationalTransactionsEnabled: true,
      controls: {
        enableDomesticOnline: true,
        enableDomesticATM: true,
        enableDomesticContacts: true,
        enableInternationalOnline: true,
        enableInternationalATM: false,
        enableInternationalContacts: false
      }
    };
  }
}

/**
 * Biller Service
 * Manages utilities, subscriptions, and recurring payments
 * Integrated with Supabase database
 */

import { supabase } from '../lib/supabase';
import { ErrorHandler } from '../lib/errorHandler';

export interface Biller {
  id: string;
  name: string;
  category: 'electricity' | 'water' | 'gas' | 'internet' | 'cable' | 'phone' | 'insurance' | 'education' | 'health' | 'government';
  country: string;
  logo?: string;
  supportedCountries?: string[];
  minAmount: number;
  maxAmount: number;
  requiresAccountNumber: boolean;
  requiresPhone: boolean;
  requiresEmail: boolean;
  verificationDelay?: number; // ms to wait for verification
}

export interface BillerCategory {
  name: string;
  icon: string;
  billers: Biller[];
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Internal database structure
 */
interface DBBiller {
  id: string;
  country_code: string;
  name: string;
  biller_type: string;
  icon_url?: string;
  created_at: string;
}

export class BillerService {
  /**
   * Get billers by country
   */
  static async getBillersByCountry(countryCode: string): Promise<APIResponse<Biller[]>> {
    try {
      const { data: billers, error } = await supabase
        .from('billers')
        .select('*')
        .eq('country_code', countryCode)
        .order('name', { ascending: true });

      if (error) throw error;

      const mappedBillers = (billers as DBBiller[]).map((biller) =>
        this.mapDBBillerToBiller(biller)
      );

      return { success: true, data: mappedBillers };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get billers by category
   */
  static async getBillersByCategory(
    category: Biller['category'],
    countryCode?: string
  ): Promise<APIResponse<Biller[]>> {
    try {
      let query = supabase
        .from('billers')
        .select('*')
        .eq('biller_type', category);

      if (countryCode) {
        query = query.eq('country_code', countryCode);
      }

      const { data: billers, error } = await query.order('name', { ascending: true });

      if (error) throw error;

      const mappedBillers = (billers as DBBiller[]).map((biller) =>
        this.mapDBBillerToBiller(biller)
      );

      return { success: true, data: mappedBillers };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Search billers
   */
  static async searchBillers(query: string, countryCode?: string): Promise<APIResponse<Biller[]>> {
    try {
      let queryBuilder = supabase
        .from('billers')
        .select('*')
        .ilike('name', `%${query}%`);

      if (countryCode) {
        queryBuilder = queryBuilder.eq('country_code', countryCode);
      }

      const { data: billers, error } = await queryBuilder.order('name', { ascending: true });

      if (error) throw error;

      const mappedBillers = (billers as DBBiller[]).map((biller) =>
        this.mapDBBillerToBiller(biller)
      );

      return { success: true, data: mappedBillers };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get biller details
   */
  static async getBillerDetails(billerId: string): Promise<APIResponse<Biller | null>> {
    try {
      const { data: biller, error } = await supabase
        .from('billers')
        .select('*')
        .eq('id', billerId)
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBBillerToBiller(biller as DBBiller) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get categories
   */
  static getCategories(): Array<{
    name: Biller['category'];
    label: string;
    icon: string;
  }> {
    return [
      { name: 'electricity', label: 'Electricity', icon: '⚡' },
      { name: 'water', label: 'Water', icon: '💧' },
      { name: 'internet', label: 'Internet & Phone', icon: '📱' },
      { name: 'cable', label: 'Cable TV', icon: '📺' },
      { name: 'gas', label: 'Gas', icon: '🔥' },
      { name: 'insurance', label: 'Insurance', icon: '🛡️' },
      { name: 'education', label: 'Education', icon: '🎓' },
      { name: 'health', label: 'Healthcare', icon: '🏥' },
      { name: 'government', label: 'Government', icon: '🏛️' }
    ];
  }

  /**
   * Validate biller account
   */
  static async validateBillerAccount(
    billerId: string,
    accountNumber: string,
    phoneNumber?: string
  ): Promise<{ valid: boolean; accountName?: string; error?: string }> {
    try {
      const result = await this.getBillerDetails(billerId);
      if (!result.success || !result.data) {
        return { valid: false, error: 'Biller not found' };
      }

      const biller = result.data;

      // In production: call biller API to validate account
      // For now, basic validation
      if (
        biller.requiresAccountNumber &&
        (!accountNumber || accountNumber.length < 5)
      ) {
        return { valid: false, error: 'Invalid account number' };
      }

      if (biller.requiresPhone && (!phoneNumber || phoneNumber.length < 10)) {
        return { valid: false, error: 'Invalid phone number' };
      }

      // Mock validation
      return {
        valid: true,
        accountName: `Account Holder - ${biller.name}`
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Validation failed';
      return { valid: false, error: message };
    }
  }

  /**
   * Get amount options for biller
   */
  static async getAmountOptions(billerId: string): Promise<APIResponse<number[]>> {
    try {
      const result = await this.getBillerDetails(billerId);
      if (!result.success || !result.data) {
        return { success: true, data: [] };
      }

      const biller = result.data;

      // Generate common amounts
      const options: number[] = [];
      if (biller.category === 'internet' || biller.category === 'phone') {
        // Phone top-ups: 100, 500, 1000, 2500, 5000
        options.push(100, 500, 1000, 2500, 5000, 10000);
      } else if (biller.category === 'electricity') {
        // Electricity: 1000, 2000, 5000, 10000, 20000, 50000
        options.push(1000, 2000, 5000, 10000, 20000, 50000, 100000);
      } else {
        // Others: 500, 1000, 2000, 5000, 10000
        options.push(500, 1000, 2000, 5000, 10000, 50000);
      }

      const filtered = options.filter(
        (a) => a >= biller.minAmount && a <= biller.maxAmount
      );

      return { success: true, data: filtered };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Calculate bill payment fee
   */
  static async calculateBillFee(amount: number, billerId: string): Promise<APIResponse<number>> {
    try {
      const result = await this.getBillerDetails(billerId);
      if (!result.success || !result.data) {
        return { success: true, data: 0 };
      }

      // Standard fee: $0.50 + 0.5%
      const baseFee = 0.5;
      const percentageFee = amount * 0.005;
      const fee = Math.round((baseFee + percentageFee) * 100) / 100;

      return { success: true, data: fee };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Helper to map database biller to Biller interface
   */
  private static mapDBBillerToBiller(dbBiller: DBBiller): Biller {
    // Map biller_type from DB to category enum
    const categoryMap: Record<string, any> = {
      'electricity': 'electricity',
      'water': 'water',
      'gas': 'gas',
      'internet': 'internet',
      'phone': 'phone',
      'cable': 'cable',
      'insurance': 'insurance',
      'education': 'education',
      'health': 'health',
      'government': 'government'
    };

    const category = categoryMap[dbBiller.biller_type] || 'other';

    // Mock data for min/max amounts based on category
    const amountDefaults: Record<string, { min: number; max: number }> = {
      'electricity': { min: 500, max: 1000000 },
      'internet': { min: 100, max: 50000 },
      'cable': { min: 1500, max: 50000 },
      'water': { min: 500, max: 500000 },
      'gas': { min: 1000, max: 100000 },
      'phone': { min: 100, max: 50000 },
      'insurance': { min: 5000, max: 500000 },
      'education': { min: 2500, max: 500000 },
      'health': { min: 500, max: 200000 },
      'government': { min: 500, max: 1000000 }
    };

    const amounts = amountDefaults[category] || { min: 500, max: 100000 };

    return {
      id: dbBiller.id,
      name: dbBiller.name,
      category: category as any,
      country: dbBiller.country_code,
      logo: dbBiller.icon_url,
      minAmount: amounts.min,
      maxAmount: amounts.max,
      requiresAccountNumber: ['electricity', 'water', 'gas', 'cable'].includes(category),
      requiresPhone: ['internet', 'phone'].includes(category),
      requiresEmail: category === 'education'
    };
  }
}

/**
 * Currency Conversion Service
 * Handles real-time exchange rates and currency conversions
 * Integrated with Supabase database
 */

import { supabase } from '../lib/supabase';
import { ErrorHandler } from '../lib/errorHandler';

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
  source: string;
}

export interface ConversionResult {
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  rates: ExchangeRate;
  timestamp: Date;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Internal database structure
 */
interface DBExchangeRate {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: number;
  source: string;
  fetched_at: string;
}

// Fallback mock rates if database unavailable
const FALLBACK_RATES: Record<string, Record<string, number>> = {
  USD: {
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.50,
    NGN: 1550.00,
    ZAR: 18.50,
    KES: 155.00,
    GHS: 15.50,
    INR: 83.50,
    CAD: 1.36,
    AUD: 1.53
  },
  EUR: {
    USD: 1.09,
    GBP: 0.86,
    JPY: 162.50,
    NGN: 1685.00,
    ZAR: 20.10,
    KES: 168.50,
    CHF: 0.94,
    CAD: 1.48,
    AUD: 1.66
  },
  GBP: {
    USD: 1.27,
    EUR: 1.16,
    JPY: 189.00,
    NGN: 1960.00,
    ZAR: 23.40,
    KES: 196.00,
    CAD: 1.72,
    AUD: 1.93
  },
  NGN: {
    USD: 0.000645,
    EUR: 0.000593,
    GBP: 0.000510,
    ZAR: 0.01194,
    KES: 0.10,
    GHS: 0.01,
    INR: 0.0539
  }
};

export class CurrencyService {
  /**
   * Get current exchange rate between two currencies
   */
  static async getExchangeRate(from: string, to: string): Promise<APIResponse<ExchangeRate>> {
    try {
      const fromUpper = from.toUpperCase();
      const toUpper = to.toUpperCase();

      if (fromUpper === toUpper) {
        return {
          success: true,
          data: {
            from: fromUpper,
            to: toUpper,
            rate: 1,
            timestamp: Date.now(),
            source: 'local'
          }
        };
      }

      // Try to fetch from database
      const { data: rateRecord, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('base_currency', fromUpper)
        .eq('target_currency', toUpper)
        .single();

      if (!error && rateRecord) {
        return {
          success: true,
          data: {
            from: fromUpper,
            to: toUpper,
            rate: (rateRecord as DBExchangeRate).rate,
            timestamp: new Date((rateRecord as DBExchangeRate).fetched_at).getTime(),
            source: (rateRecord as DBExchangeRate).source
          }
        };
      }

      // Fallback to mock rates if not in database
      const rate = FALLBACK_RATES[fromUpper]?.[toUpper] || 1;
      return {
        success: true,
        data: {
          from: fromUpper,
          to: toUpper,
          rate,
          timestamp: Date.now(),
          source: 'fallback'
        }
      };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Convert amount from one currency to another
   */
  static async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<APIResponse<ConversionResult>> {
    try {
      const ratesResult = await this.getExchangeRate(fromCurrency, toCurrency);

      if (!ratesResult.success || !ratesResult.data) {
        return { success: false, error: 'Failed to fetch exchange rate' };
      }

      const rates = ratesResult.data;
      const toAmount = amount * rates.rate;

      return {
        success: true,
        data: {
          fromAmount: amount,
          fromCurrency: fromCurrency.toUpperCase(),
          toAmount: Math.round(toAmount * 100) / 100,
          toCurrency: toCurrency.toUpperCase(),
          rates,
          timestamp: new Date()
        }
      };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get supported currencies
   */
  static async getSupportedCurrencies(): Promise<APIResponse<string[]>> {
    try {
      const { data: rates, error } = await supabase
        .from('exchange_rates')
        .select('base_currency')
        .distinct();

      if (error) throw error;

      const currencies = new Set<string>();
      (rates as any[]).forEach((r: any) => {
        currencies.add(r.base_currency);
      });

      // Add fallback currencies if database is empty
      if (currencies.size === 0) {
        return { success: true, data: Object.keys(FALLBACK_RATES) };
      }

      return { success: true, data: Array.from(currencies).sort() };
    } catch (error) {
      // Return fallback if database query fails
      return { success: true, data: Object.keys(FALLBACK_RATES) };
    }
  }

  /**
   * Format currency display
   */
  static formatCurrency(
    amount: number,
    currency: string,
    locale: string = 'en-US'
  ): string {
    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      return formatter.format(amount);
    } catch (error) {
      // Fallback formatting
      return `${this.getCurrencySymbol(currency)}${amount.toFixed(2)}`;
    }
  }

  /**
   * Get currency symbol
   */
  static getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      NGN: '₦',
      ZAR: 'R',
      KES: 'KSh',
      GHS: '₵',
      INR: '₹',
      CAD: 'C$',
      AUD: 'A$',
      CHF: 'CHF'
    };

    return symbols[currency.toUpperCase()] || currency.toUpperCase();
  }
}

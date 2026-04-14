/**
 * Analytics Service
 * Provides analytics calculations and fraud detection
 * Integrated with Supabase database
 */

import { supabase } from '../lib/supabase';
import { ErrorHandler } from '../lib/errorHandler';

export interface Transaction {
  id: string;
  userId: string;
  type: 'transfer' | 'card' | 'bill' | 'qr' | 'savings' | 'escrow';
  amount: number;
  currency: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  merchant?: string;
  location?: string;
  deviceId?: string;
}

export interface FraudAlert {
  id: string;
  userId: string;
  transactionId?: string;
  type: 'high_amount' | 'unusual_location' | 'rapid_transactions' | 'new_recipient' | 'failed_attempts';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
  action?: string;
}

export interface SpendingPattern {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  count: number;
}

export interface AnalyticsMetrics {
  totalSpending: number;
  averageTransaction: number;
  transactionCount: number;
  topCategories: SpendingPattern[];
  dailyAverage: number;
  monthlyBudgetUsage: number;
  fraudRiskScore: number;
  securityAlerts: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Internal database structures
 */
interface DBTransaction {
  id: string;
  user_id: string;
  transaction_type: string;
  amount: number;
  status: string;
  created_at: string;
}

interface DBFraudAlert {
  id: string;
  user_id: string;
  alert_type: string;
  severity: string;
  message: string;
  resolved: boolean;
  created_at: string;
}

export class AnalyticsService {
  /**
   * Get all transactions for user
   */
  static async getUserTransactions(userId: string, limit?: number): Promise<APIResponse<Transaction[]>> {
    try {
      let query = supabase
        .from('analytics_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data: transactions, error } = await query;

      if (error) throw error;

      const mapped = (transactions as DBTransaction[]).map((t) =>
        this.mapDBToTransaction(t)
      );

      return { success: true, data: mapped };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get transactions by date range
   */
  static async getTransactionsByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<APIResponse<Transaction[]>> {
    try {
      const { data: transactions, error } = await supabase
        .from('analytics_transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (transactions as DBTransaction[]).map((t) =>
        this.mapDBToTransaction(t)
      );

      return { success: true, data: mapped };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Calculate spending analytics
   */
  static async calculateSpendingAnalytics(userId: string): Promise<APIResponse<AnalyticsMetrics>> {
    try {
      const result = await this.getUserTransactions(userId);
      if (!result.success || !result.data) {
        return {
          success: true,
          data: {
            totalSpending: 0,
            averageTransaction: 0,
            transactionCount: 0,
            topCategories: [],
            dailyAverage: 0,
            monthlyBudgetUsage: 0,
            fraudRiskScore: 0,
            securityAlerts: 0
          }
        };
      }

      const transactions = result.data.filter((t) => t.status === 'completed');

      if (transactions.length === 0) {
        return {
          success: true,
          data: {
            totalSpending: 0,
            averageTransaction: 0,
            transactionCount: 0,
            topCategories: [],
            dailyAverage: 0,
            monthlyBudgetUsage: 0,
            fraudRiskScore: 0,
            securityAlerts: 0
          }
        };
      }

      const totalSpending = transactions.reduce((sum, t) => sum + t.amount, 0);
      const averageTransaction = totalSpending / transactions.length;

      // Category breakdown
      const categoryMap = new Map<string, { amount: number; count: number }>();
      transactions.forEach((t) => {
        const existing = categoryMap.get(t.type) || { amount: 0, count: 0 };
        categoryMap.set(t.type, {
          amount: existing.amount + t.amount,
          count: existing.count + 1
        });
      });

      const topCategories: SpendingPattern[] = Array.from(categoryMap.entries())
        .map(([type, data]) => ({
          category: type,
          amount: data.amount,
          percentage: (data.amount / totalSpending) * 100,
          trend: this.calculateTrend(type, transactions),
          count: data.count
        }))
        .sort((a, b) => b.amount - a.amount);

      // Calculate daily average
      const days = 30;
      const dailyAverage = totalSpending / days;

      // Monthly budget usage (assume 500k NGN monthly)
      const monthlyBudget = 500000;
      const monthlyBudgetUsage = (totalSpending / monthlyBudget) * 100;

      // Fraud risk score and security alerts
      const fraudRiskScore = await this.calculateFraudRiskScore(userId);
      const alertsResult = await this.getFraudAlerts(userId);
      const securityAlerts = alertsResult.success && alertsResult.data
        ? alertsResult.data.filter((a) => !a.resolved).length
        : 0;

      return {
        success: true,
        data: {
          totalSpending,
          averageTransaction,
          transactionCount: transactions.length,
          topCategories,
          dailyAverage,
          monthlyBudgetUsage: Math.min(monthlyBudgetUsage, 100),
          fraudRiskScore,
          securityAlerts
        }
      };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Detect fraud patterns
   */
  static async detectFraudPatterns(userId: string): Promise<APIResponse<FraudAlert[]>> {
    try {
      const txnResult = await this.getUserTransactions(userId);
      if (!txnResult.success || !txnResult.data) {
        return { success: true, data: [] };
      }

      const transactions = txnResult.data;
      const alerts: Omit<FraudAlert, 'id'>[] = [];

      // Check for high amount transactions
      const avgAmount = transactions.reduce((sum, t) => sum + t.amount, 0) / (transactions.length || 1);
      transactions.forEach((t) => {
        if (t.amount > avgAmount * 2) {
          alerts.push({
            userId,
            transactionId: t.id,
            type: 'high_amount',
            severity: 'medium',
            message: `High transaction amount: ₦${t.amount.toLocaleString()} (avg: ₦${avgAmount.toLocaleString()})`,
            timestamp: new Date().toISOString(),
            resolved: false
          });
        }
      });

      // Check for rapid transactions
      const lastHour = Date.now() - 3600000;
      const rapidTxns = transactions.filter(
        (t) => new Date(t.timestamp).getTime() > lastHour
      ).length;

      if (rapidTxns > 3) {
        alerts.push({
          userId,
          type: 'rapid_transactions',
          severity: 'high',
          message: `${rapidTxns} transactions in the last hour - unusual activity detected`,
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }

      // Check for failed attempts
      const failedTxns = transactions.filter((t) => t.status === 'failed').length;

      if (failedTxns >= 3) {
        alerts.push({
          userId,
          type: 'failed_attempts',
          severity: 'medium',
          message: `${failedTxns} failed transaction attempts detected`,
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }

      // Save alerts to database
      if (alerts.length > 0) {
        const { error: insertError } = await supabase
          .from('fraud_alerts')
          .insert(
            alerts.map((a) => ({
              user_id: a.userId,
              alert_type: a.type,
              severity: a.severity,
              message: a.message,
              resolved: a.resolved
            }))
          );

        if (insertError) throw insertError;
      }

      // Get all alerts for user
      const allAlertsResult = await this.getFraudAlerts(userId);
      return allAlertsResult;
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Calculate fraud risk score (0-100)
   */
  static async calculateFraudRiskScore(userId: string): Promise<number> {
    try {
      let score = 0;

      const txnResult = await this.getUserTransactions(userId);
      if (!txnResult.success || !txnResult.data) {
        return 0;
      }

      const transactions = txnResult.data;
      const avgAmount = transactions.reduce((sum, t) => sum + t.amount, 0) / (transactions.length || 1);

      // Check for high amount variance
      const highAmountTxns = transactions.filter((t) => t.amount > avgAmount * 2).length;
      score += highAmountTxns * 10;

      // Check for failed transactions
      const failedTxns = transactions.filter((t) => t.status === 'failed').length;
      score += failedTxns * 15;

      // Check for unusual locations
      const locations = new Set(transactions.map((t) => t.location).filter(Boolean));
      if (locations.size > 3) score += 15;

      // Get unresolved alerts
      const alertsResult = await this.getFraudAlerts(userId);
      if (alertsResult.success && alertsResult.data) {
        const unresolved = alertsResult.data.filter((a) => !a.resolved);
        score += unresolved.length * 5;
      }

      return Math.min(score, 100);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get category trend
   */
  private static calculateTrend(type: string, transactions: Transaction[]): 'up' | 'down' | 'stable' {
    const typeTransactions = transactions.filter((t) => t.type === type);
    if (typeTransactions.length < 2) return 'stable';

    const recent = typeTransactions.slice(0, Math.ceil(typeTransactions.length / 2));
    const older = typeTransactions.slice(Math.ceil(typeTransactions.length / 2));

    const recentAvg = recent.reduce((sum, t) => sum + t.amount, 0) / recent.length;
    const olderAvg = older.reduce((sum, t) => sum + t.amount, 0) / older.length;

    if (recentAvg > olderAvg * 1.1) return 'up';
    if (recentAvg < olderAvg * 0.9) return 'down';
    return 'stable';
  }

  /**
   * Resolve fraud alert
   */
  static async resolveFraudAlert(alertId: string, userId: string): Promise<APIResponse<FraudAlert>> {
    try {
      const { data: alert, error } = await supabase
        .from('fraud_alerts')
        .update({ resolved: true })
        .eq('id', alertId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBToFraudAlert(alert as DBFraudAlert) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get spending forecast
   */
  static async getSpendingForecast(userId: string, days: number = 30): Promise<
    APIResponse<
      {
        date: string;
        projected: number;
        confidence: number;
      }[]
    >
  > {
    try {
      const txnResult = await this.getUserTransactions(userId);
      if (!txnResult.success || !txnResult.data) {
        return { success: true, data: [] };
      }

      const transactions = txnResult.data;
      const avgDaily = transactions.reduce((sum, t) => sum + t.amount, 0) / 30;

      const forecast = [];
      for (let i = 1; i <= days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);

        forecast.push({
          date: date.toISOString().split('T')[0],
          projected: Math.round(avgDaily + Math.random() * (avgDaily * 0.2)),
          confidence: 85 + Math.random() * 10
        });
      }

      return { success: true, data: forecast };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get merchant insights
   */
  static async getMerchantInsights(userId: string): Promise<
    APIResponse<
      {
        merchant: string;
        totalSpent: number;
        transactionCount: number;
        lastTransaction: string;
        frequency: string;
      }[]
    >
  > {
    try {
      const txnResult = await this.getUserTransactions(userId);
      if (!txnResult.success || !txnResult.data) {
        return { success: true, data: [] };
      }

      const transactions = txnResult.data.filter((t) => t.merchant);

      const merchantMap = new Map<
        string,
        { amount: number; count: number; lastDate: string }
      >();

      transactions.forEach((t) => {
        if (t.merchant) {
          const existing = merchantMap.get(t.merchant) || {
            amount: 0,
            count: 0,
            lastDate: t.timestamp
          };
          merchantMap.set(t.merchant, {
            amount: existing.amount + t.amount,
            count: existing.count + 1,
            lastDate: t.timestamp > existing.lastDate ? t.timestamp : existing.lastDate
          });
        }
      });

      const insights = Array.from(merchantMap.entries())
        .map(([merchant, data]) => ({
          merchant,
          totalSpent: data.amount,
          transactionCount: data.count,
          lastTransaction: data.lastDate,
          frequency: data.count > 5 ? 'Regular' : data.count > 2 ? 'Occasional' : 'Rare'
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent);

      return { success: true, data: insights };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get security score (0-100)
   */
  static async getSecurityScore(userId: string): Promise<APIResponse<number>> {
    try {
      let score = 100;

      // Get unresolved alerts
      const alertsResult = await this.getFraudAlerts(userId);
      if (alertsResult.success && alertsResult.data) {
        const unresolved = alertsResult.data.filter((a) => !a.resolved);
        score -= unresolved.length * 10;
      }

      // Get failed transactions
      const txnResult = await this.getUserTransactions(userId);
      if (txnResult.success && txnResult.data) {
        const failedTxns = txnResult.data.filter((t) => t.status === 'failed').length;
        score -= failedTxns * 5;

        // Deduct for high fraud risk
        const fraudRisk = await this.calculateFraudRiskScore(userId);
        score -= (fraudRisk / 100) * 20;
      }

      return { success: true, data: Math.max(score, 0) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Add transaction
   */
  static async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<APIResponse<Transaction>> {
    try {
      const { data: newTx, error } = await supabase
        .from('analytics_transactions')
        .insert([
          {
            user_id: transaction.userId,
            transaction_type: transaction.type,
            amount: transaction.amount,
            status: transaction.status
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBToTransaction(newTx as DBTransaction) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get daily summary
   */
  static async getDailySummary(userId: string, date: string): Promise<
    APIResponse<{
      date: string;
      totalTransactions: number;
      totalAmount: number;
      categories: Record<string, number>;
    }>
  > {
    try {
      const dayStart = new Date(date).toISOString();
      const dayEnd = new Date(new Date(date).getTime() + 86400000).toISOString();

      const { data: transactions, error } = await supabase
        .from('analytics_transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', dayStart)
        .lt('created_at', dayEnd);

      if (error) throw error;

      const categories: Record<string, number> = {};
      let totalAmount = 0;

      (transactions as DBTransaction[]).forEach((t) => {
        categories[t.transaction_type] = (categories[t.transaction_type] || 0) + t.amount;
        totalAmount += t.amount;
      });

      return {
        success: true,
        data: {
          date,
          totalTransactions: (transactions as DBTransaction[]).length,
          totalAmount,
          categories
        }
      };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get fraud alerts
   */
  static async getFraudAlerts(userId: string): Promise<APIResponse<FraudAlert[]>> {
    try {
      const { data: alerts, error } = await supabase
        .from('fraud_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (alerts as DBFraudAlert[]).map((a) =>
        this.mapDBToFraudAlert(a)
      );

      return { success: true, data: mapped };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Helper to map database transaction to Transaction interface
   */
  private static mapDBToTransaction(dbTx: DBTransaction): Transaction {
    return {
      id: dbTx.id,
      userId: dbTx.user_id,
      type: dbTx.transaction_type as any,
      amount: dbTx.amount,
      currency: 'NGN',
      description: 'Transaction',
      status: dbTx.status as any,
      timestamp: dbTx.created_at
    };
  }

  /**
   * Helper to map database fraud alert to FraudAlert interface
   */
  private static mapDBToFraudAlert(dbAlert: DBFraudAlert): FraudAlert {
    return {
      id: dbAlert.id,
      userId: dbAlert.user_id,
      type: dbAlert.alert_type as any,
      severity: dbAlert.severity as any,
      message: dbAlert.message,
      timestamp: dbAlert.created_at,
      resolved: dbAlert.resolved
    };
  }
}

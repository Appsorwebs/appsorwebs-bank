/**
 * useAnalytics Hook
 * Custom hook for analytics and fraud detection
 */

import { useState, useCallback, useEffect } from 'react';
import {
  AnalyticsService,
  AnalyticsMetrics,
  FraudAlert,
  Transaction
} from '../services/analyticsService';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export interface AnalyticsState {
  metrics: AnalyticsMetrics;
  fraudAlerts: FraudAlert[];
  transactions: Transaction[];
  loading: boolean;
  error?: string;
  securityScore: number;
  fraudRiskScore: number;
}

export const useAnalytics = () => {
  const { user } = useAuth();
  const [analyticsState, setAnalyticsState] = useState<AnalyticsState>({
    metrics: {
      totalSpending: 0,
      averageTransaction: 0,
      transactionCount: 0,
      topCategories: [],
      dailyAverage: 0,
      monthlyBudgetUsage: 0,
      fraudRiskScore: 0,
      securityAlerts: 0
    },
    fraudAlerts: [],
    transactions: [],
    loading: false,
    securityScore: 100,
    fraudRiskScore: 0
  });

  /**
   * Load analytics data
   */
  const loadAnalytics = useCallback(async () => {
    if (!user) return;

    try {
      setAnalyticsState((prev) => ({ ...prev, loading: true }));

      const metricsResult = await AnalyticsService.calculateSpendingAnalytics(user.id);
      const fraudAlertsResult = await AnalyticsService.detectFraudPatterns(user.id);
      const transactionsResult = await AnalyticsService.getUserTransactions(user.id, 20);
      const securityScoreResult = await AnalyticsService.getSecurityScore(user.id);
      const fraudRiskScoreResult = await AnalyticsService.calculateFraudRiskScore(user.id);

      if (
        !metricsResult.success ||
        !fraudAlertsResult.success ||
        !transactionsResult.success ||
        !securityScoreResult.success ||
        !fraudRiskScoreResult.success
      ) {
        throw new Error('Failed to load analytics');
      }

      setAnalyticsState((prev) => ({
        ...prev,
        metrics: metricsResult.data || prev.metrics,
        fraudAlerts: fraudAlertsResult.data || [],
        transactions: transactionsResult.data || [],
        securityScore: securityScoreResult.data || 100,
        fraudRiskScore: fraudRiskScoreResult.data || 0,
        loading: false
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load analytics';
      setAnalyticsState((prev) => ({
        ...prev,
        loading: false,
        error: message
      }));
      toast.error(message);
    }
  }, [user]);

  /**
   * Get spending forecast
   */
  const getSpendingForecast = useCallback(async (days?: number) => {
    if (!user) return [];
    try {
      const result = await AnalyticsService.getSpendingForecast(user.id, days);
      if (!result.success) {
        throw new Error(result.error || 'Failed to get forecast');
      }
      return result.data || [];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get forecast';
      toast.error(message);
      return [];
    }
  }, [user]);

  /**
   * Get merchant insights
   */
  const getMerchantInsights = useCallback(async () => {
    if (!user) return [];
    try {
      const result = await AnalyticsService.getMerchantInsights(user.id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to get insights');
      }
      return result.data || [];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get insights';
      toast.error(message);
      return [];
    }
  }, [user]);

  /**
   * Get daily summary
   */
  const getDailySummary = useCallback(async (date: string) => {
    if (!user) return null;
    const result = await AnalyticsService.getDailySummary(user.id, date);
    return result.success ? result.data : null;
  }, [user]);

  /**
   * Get transactions by date range
   */
  const getTransactionsByDateRange = useCallback(async (startDate: string, endDate: string) => {
    if (!user) return [];
    try {
      const result = await AnalyticsService.getTransactionsByDateRange(user.id, startDate, endDate);
      if (!result.success) {
        throw new Error(result.error || 'Failed to get transactions');
      }
      return result.data || [];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get transactions';
      toast.error(message);
      return [];
    }
  }, [user]);

  /**
   * Resolve fraud alert
   */
  const resolveFraudAlert = useCallback(
    async (alertId: string) => {
      if (!user) {
        toast.error('User not authenticated');
        return null;
      }

      try {
        const result = await AnalyticsService.resolveFraudAlert(alertId, user.id);
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Alert not found');
        }

        const resolved = result.data;
        setAnalyticsState((prev) => ({
          ...prev,
          fraudAlerts: prev.fraudAlerts.map((a) => (a.id === alertId ? resolved : a))
        }));

        toast.success('Alert resolved');
        return resolved;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to resolve alert';
        toast.error(message);
        return null;
      }
    },
    [user]
  );

  /**
   * Refresh analytics
   */
  const refreshAnalytics = useCallback(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  /**
   * Initialize - load analytics on mount
   */
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    // State
    metrics: analyticsState.metrics,
    fraudAlerts: analyticsState.fraudAlerts,
    transactions: analyticsState.transactions,
    loading: analyticsState.loading,
    error: analyticsState.error,
    securityScore: analyticsState.securityScore,
    fraudRiskScore: analyticsState.fraudRiskScore,

    // Methods
    loadAnalytics,
    refreshAnalytics,
    getSpendingForecast,
    getMerchantInsights,
    getDailySummary,
    getTransactionsByDateRange,
    resolveFraudAlert
  };
};

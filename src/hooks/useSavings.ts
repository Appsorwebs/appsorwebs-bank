/**
 * useSavings Hook
 * Custom hook for managing savings accounts and operations
 */

import { useState, useCallback, useEffect } from 'react';
import { SavingsService, SavingsAccount } from '../services/savingsService';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export interface SavingsState {
  accounts: SavingsAccount[];
  selectedAccount?: SavingsAccount;
  loading: boolean;
  error?: string;
  stats: {
    totalBalance: number;
    totalInterestEarned: number;
    accountCount: number;
    goalAccountsCount: number;
    averageRate: number;
  };
}

export const useSavings = () => {
  const { user } = useAuth();
  const [savingsState, setSavingsState] = useState<SavingsState>({
    accounts: [],
    loading: false,
    stats: {
      totalBalance: 0,
      totalInterestEarned: 0,
      accountCount: 0,
      goalAccountsCount: 0,
      averageRate: 0
    }
  });

  /**
   * Load all savings accounts
   */
  const loadAccounts = useCallback(async () => {
    if (!user) return;

    try {
      setSavingsState((prev) => ({ ...prev, loading: true }));
      const accountsResult = await SavingsService.getSavingsAccounts(user.id);
      const statsResult = await SavingsService.getSavingsStats(user.id);

      if (!accountsResult.success || !statsResult.success) {
        throw new Error(accountsResult.error || statsResult.error || 'Failed to load accounts');
      }

      setSavingsState((prev) => ({
        ...prev,
        accounts: accountsResult.data || [],
        stats: statsResult.data || prev.stats,
        loading: false
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load accounts';
      setSavingsState((prev) => ({
        ...prev,
        loading: false,
        error: message
      }));
      toast.error(message);
    }
  }, [user]);

  /**
   * Select account
   */
  const selectAccount = useCallback(async (accountId: string) => {
    try {
      const result = await SavingsService.getAccountById(accountId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Account not found');
      }

      const account = result.data;
      setSavingsState((prev) => ({
        ...prev,
        selectedAccount: account
      }));

      return account;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to select account';
      toast.error(message);
      return null;
    }
  }, []);

  /**
   * Create new savings account
   */
  const createAccount = useCallback(
    async (
      data: Omit<
        SavingsAccount,
        | 'id'
        | 'userId'
        | 'createdAt'
        | 'updatedAt'
        | 'interestEarned'
        | 'lastInterestAccrual'
        | 'transactions'
      >
    ) => {
      if (!user) {
        toast.error('User not authenticated');
        return null;
      }

      try {
        // Validate
        if (!SavingsService.validateAccountName(data.name)) {
          throw new Error('Account name must be 3-50 characters');
        }

        if (!SavingsService.validateInterestRate(data.interestRate)) {
          throw new Error('Interest rate must be between 0-50%');
        }

        const result = await SavingsService.createAccount(user.id, data);
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to create account');
        }

        const newAccount = result.data;
        const statsResult = await SavingsService.getSavingsStats(user.id);

        setSavingsState((prev) => {
          const updatedAccounts = [newAccount, ...prev.accounts];
          return {
            ...prev,
            accounts: updatedAccounts,
            stats: statsResult.success ? statsResult.data || prev.stats : prev.stats
          };
        });

        toast.success(`Savings account "${newAccount.name}" created`);
        return newAccount;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create account';
        toast.error(message);
        return null;
      }
    },
    [user]
  );

  /**
   * Deposit money
   */
  const deposit = useCallback(
    async (accountId: string, amount: number, description: string) => {
      try {
        const result = await SavingsService.deposit(accountId, amount, description);

        if (!result.success || !result.account) {
          throw new Error(result.error || 'Deposit failed');
        }

        setSavingsState((prev) => {
          const updatedAccounts = prev.accounts.map((a) =>
            a.id === accountId ? result.account! : a
          );

          return {
            ...prev,
            accounts: updatedAccounts,
            selectedAccount:
              prev.selectedAccount?.id === accountId ? result.account : prev.selectedAccount
          };
        });

        toast.success(`Deposited ₦${amount.toLocaleString()}`);
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to deposit';
        toast.error(message);
        return { success: false, error: message };
      }
    },
    []
  );

  /**
   * Withdraw money
   */
  const withdraw = useCallback(
    async (accountId: string, amount: number, description: string) => {
      try {
        const result = await SavingsService.withdraw(accountId, amount, description);

        if (!result.success || !result.account) {
          throw new Error(result.error || 'Withdrawal failed');
        }

        setSavingsState((prev) => {
          const updatedAccounts = prev.accounts.map((a) =>
            a.id === accountId ? result.account! : a
          );

          return {
            ...prev,
            accounts: updatedAccounts,
            selectedAccount:
              prev.selectedAccount?.id === accountId ? result.account : prev.selectedAccount
          };
        });

        toast.success(`Withdrawn ₦${amount.toLocaleString()}`);
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to withdraw';
        toast.error(message);
        return { success: false, error: message };
      }
    },
    []
  );

  /**
   * Accrue interest
   */
  const accrueInterest = useCallback(async (accountId: string) => {
    try {
      const result = await SavingsService.accrueInterest(accountId);

      if (!result.success || !result.account) {
        throw new Error(result.error || 'Failed to accrue interest');
      }

      setSavingsState((prev) => {
        const updatedAccounts = prev.accounts.map((a) =>
            a.id === accountId ? result.account! : a
        );

        return {
          ...prev,
          accounts: updatedAccounts,
          selectedAccount:
            prev.selectedAccount?.id === accountId ? result.account : prev.selectedAccount
        };
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to accrue interest';
      console.error(message);
      return { success: false, error: message };
    }
  }, []);

  /**
   * Calculate interest projection
   */
  const calculateProjection = useCallback(async (accountId: string) => {
    const result = await SavingsService.calculateInterestProjection(accountId);
    return result.success ? result.data : null;
  }, []);

  /**
   * Lock account
   */
  const lockAccount = useCallback(async (accountId: string, days: number) => {
    try {
      const result = await SavingsService.lockAccount(accountId, days);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Account not found');
      }

      const updated = result.data;
      setSavingsState((prev) => ({
        ...prev,
        accounts: prev.accounts.map((a) => (a.id === accountId ? updated : a)),
        selectedAccount:
          prev.selectedAccount?.id === accountId ? updated : prev.selectedAccount
      }));

      toast.success(`Account locked for ${days} days`);
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to lock account';
      toast.error(message);
      return null;
    }
  }, []);

  /**
   * Unlock account
   */
  const unlockAccount = useCallback(async (accountId: string) => {
    try {
      const result = await SavingsService.unlockAccount(accountId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Account not found');
      }

      const updated = result.data;
      setSavingsState((prev) => ({
        ...prev,
        accounts: prev.accounts.map((a) => (a.id === accountId ? updated : a)),
        selectedAccount:
          prev.selectedAccount?.id === accountId ? updated : prev.selectedAccount
      }));

      toast.success('Account unlocked');
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unlock account';
      toast.error(message);
      return null;
    }
  }, []);

  /**
   * Update auto deposit
   */
  const updateAutoDeposit = useCallback(
    async (accountId: string, autoDeposit: SavingsAccount['autoDeposit']) => {
      try {
        const result = await SavingsService.updateAutoDeposit(accountId, autoDeposit);
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Account not found');
        }

        const updated = result.data;
        setSavingsState((prev) => ({
          ...prev,
          accounts: prev.accounts.map((a) => (a.id === accountId ? updated : a)),
          selectedAccount:
            prev.selectedAccount?.id === accountId ? updated : prev.selectedAccount
        }));

        toast.success(
          `Auto-deposit ${autoDeposit.enabled ? 'enabled' : 'disabled'}`
        );
        return updated;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update';
        toast.error(message);
        return null;
      }
    },
    []
  );

  /**
   * Get transaction history
   */
  const getTransactionHistory = useCallback(async (accountId: string, limit?: number) => {
    const result = await SavingsService.getTransactionHistory(accountId, limit);
    return result.success ? result.data : [];
  }, []);

  /**
   * Initialize - load accounts on mount
   */
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  return {
    // State
    accounts: savingsState.accounts,
    selectedAccount: savingsState.selectedAccount,
    loading: savingsState.loading,
    error: savingsState.error,
    stats: savingsState.stats,

    // Methods
    loadAccounts,
    selectAccount,
    createAccount,
    deposit,
    withdraw,
    accrueInterest,
    calculateProjection,
    lockAccount,
    unlockAccount,
    updateAutoDeposit,
    getTransactionHistory
  };
};

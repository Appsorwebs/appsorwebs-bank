/**
 * Savings Service
 * Manages savings accounts with interest calculation and goals
 * Integrated with Supabase database
 */

import { supabase } from '../lib/supabase';
import { ErrorHandler } from '../lib/errorHandler';

export interface SavingsAccount {
  id: string;
  userId: string;
  name: string;
  accountType: 'standard' | 'goal' | 'investment';
  balance: number;
  currency: string;
  interestRate: number; // Annual percentage
  interestEarned: number;
  lastInterestAccrual: string;
  minBalance: number;
  maxBalance?: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  description?: string;
  goalAmount?: number; // For goal savings
  goalDeadline?: string;
  goalProgress?: number;
  autoDeposit?: {
    enabled: boolean;
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  };
  lockPeriod?: number; // Days (0 = no lock)
  lockedUntil?: string;
  transactions: SavingsTransaction[];
}

export interface SavingsTransaction {
  id: string;
  accountId: string;
  type: 'deposit' | 'withdrawal' | 'interest' | 'transfer_in' | 'transfer_out';
  amount: number;
  balance: number;
  description: string;
  timestamp: string;
  reference: string;
}

export interface InterestCalculation {
  monthlyRate: number;
  annualRate: number;
  earnedThisMonth: number;
  earnedThisYear: number;
  projectedAnnual: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Internal database structures
 */
interface DBSavingsAccount {
  id: string;
  user_id: string;
  name: string;
  account_type: string;
  balance: number;
  currency: string;
  interest_rate: number;
  interest_earned: number;
  last_interest_accrual: string;
  min_balance: number;
  max_balance?: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  description?: string;
  goal_amount?: number;
  goal_deadline?: string;
  auto_deposit_enabled?: boolean;
  locked_until?: string;
}

interface DBSavingsTransaction {
  id: string;
  account_id: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  created_at: string;
  reference_id: string;
}

export class SavingsService {
  /**
   * Get all savings accounts for user
   */
  static async getSavingsAccounts(userId: string): Promise<APIResponse<SavingsAccount[]>> {
    try {
      const { data: accounts, error } = await supabase
        .from('savings_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch transactions for each account
      const accountsWithTxns = await Promise.all(
        (accounts as DBSavingsAccount[]).map(async (account) => {
          const { data: transactions } = await supabase
            .from('savings_transactions')
            .select('*')
            .eq('account_id', account.id)
            .order('created_at', { ascending: false });

          return this.mapDBAccountToAccount(account, transactions || []);
        })
      );

      return { success: true, data: accountsWithTxns };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get savings account by ID
   */
  static async getAccountById(accountId: string): Promise<APIResponse<SavingsAccount>> {
    try {
      const { data: account, error: acctError } = await supabase
        .from('savings_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (acctError) throw acctError;

      const { data: transactions } = await supabase
        .from('savings_transactions')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      const result = this.mapDBAccountToAccount(account as DBSavingsAccount, transactions || []);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Create new savings account
   */
  static async createAccount(
    userId: string,
    data: Omit<
      SavingsAccount,
      'id' | 'userId' | 'createdAt' | 'updatedAt' | 'interestEarned' | 'lastInterestAccrual' | 'transactions'
    >
  ): Promise<APIResponse<SavingsAccount>> {
    try {
      const { data: account, error } = await supabase
        .from('savings_accounts')
        .insert([
          {
            user_id: userId,
            name: data.name,
            account_type: data.accountType,
            balance: data.balance || 0,
            currency: data.currency,
            interest_rate: data.interestRate,
            interest_earned: 0,
            last_interest_accrual: new Date().toISOString().split('T')[0],
            min_balance: data.minBalance,
            max_balance: data.maxBalance,
            is_active: data.isActive,
            description: data.description,
            goal_amount: data.goalAmount,
            goal_deadline: data.goalDeadline,
            auto_deposit_enabled: data.autoDeposit?.enabled || false
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: this.mapDBAccountToAccount(account as DBSavingsAccount, [])
      };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Deposit money to savings account
   */
  static async deposit(
    accountId: string,
    amount: number,
    description: string
  ): Promise<APIResponse<{ account: SavingsAccount; transaction: SavingsTransaction }>> {
    try {
      // Get account
      const { data: account, error: acctError } = await supabase
        .from('savings_accounts')
        .select('balance, max_balance')
        .eq('id', accountId)
        .single();

      if (acctError) throw acctError;

      if (amount <= 0) throw new Error('Amount must be positive');
      if ((account as any).max_balance && (account as any).balance + amount > (account as any).max_balance) {
        throw new Error('Maximum balance limit exceeded');
      }

      // Update balance
      const newBalance = (account as any).balance + amount;
      const { data: updated } = await supabase
        .from('savings_accounts')
        .update({ balance: newBalance })
        .eq('id', accountId)
        .select()
        .single();

      // Create transaction
      const { data: transaction } = await supabase
        .from('savings_transactions')
        .insert([
          {
            account_id: accountId,
            type: 'deposit',
            amount,
            balance: newBalance,
            description,
            reference_id: `DEP${Date.now()}`
          }
        ])
        .select()
        .single();

      return {
        success: true,
        data: {
          account: this.mapDBAccountToAccount(updated as DBSavingsAccount, []),
          transaction: this.mapDBTransactionToTransaction(transaction as DBSavingsTransaction)
        }
      };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Withdraw money from savings account
   */
  static async withdraw(
    accountId: string,
    amount: number,
    description: string
  ): Promise<APIResponse<{ account: SavingsAccount; transaction: SavingsTransaction }>> {
    try {
      // Get account
      const { data: account, error: acctError } = await supabase
        .from('savings_accounts')
        .select('balance, min_balance, locked_until')
        .eq('id', accountId)
        .single();

      if (acctError) throw acctError;

      if (amount <= 0) throw new Error('Amount must be positive');
      if ((account as any).balance < amount) throw new Error('Insufficient balance');
      if ((account as any).balance - amount < (account as any).min_balance) {
        throw new Error(`Cannot withdraw below minimum balance of ${(account as any).min_balance}`);
      }

      // Check lock
      if ((account as any).locked_until) {
        if (new Date() < new Date((account as any).locked_until)) {
          throw new Error(`Account locked until ${(account as any).locked_until}`);
        }
      }

      // Update balance
      const newBalance = (account as any).balance - amount;
      const { data: updated } = await supabase
        .from('savings_accounts')
        .update({ balance: newBalance })
        .eq('id', accountId)
        .select()
        .single();

      // Create transaction
      const { data: transaction } = await supabase
        .from('savings_transactions')
        .insert([
          {
            account_id: accountId,
            type: 'withdrawal',
            amount,
            balance: newBalance,
            description,
            reference_id: `WTH${Date.now()}`
          }
        ])
        .select()
        .single();

      return {
        success: true,
        data: {
          account: this.mapDBAccountToAccount(updated as DBSavingsAccount, []),
          transaction: this.mapDBTransactionToTransaction(transaction as DBSavingsTransaction)
        }
      };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Calculate and accrue interest
   */
  static async accrueInterest(accountId: string): Promise<APIResponse<SavingsAccount>> {
    try {
      const { data: account, error: acctError } = await supabase
        .from('savings_accounts')
        .select('balance, interest_rate, interest_earned')
        .eq('id', accountId)
        .single();

      if (acctError) throw acctError;

      const monthlyRate = (account as any).interest_rate / 12;
      const monthlyInterest = ((account as any).balance * monthlyRate) / 100;
      const roundedInterest = Math.round(monthlyInterest * 100) / 100;

      if (roundedInterest > 0) {
        const newBalance = (account as any).balance + roundedInterest;
        const newInterestEarned = (account as any).interest_earned + roundedInterest;

        const { data: updated } = await supabase
          .from('savings_accounts')
          .update({
            balance: newBalance,
            interest_earned: newInterestEarned,
            last_interest_accrual: new Date().toISOString().split('T')[0]
          })
          .eq('id', accountId)
          .select()
          .single();

        // Create interest transaction
        await supabase.from('savings_transactions').insert([
          {
            account_id: accountId,
            type: 'interest',
            amount: roundedInterest,
            balance: newBalance,
            description: `Monthly interest accrual (${(account as any).interest_rate}% p.a.)`,
            reference_id: `INT${new Date().toISOString().split('T')[0].replace(/-/g, '')}`
          }
        ]);

        return {
          success: true,
          data: this.mapDBAccountToAccount(updated as DBSavingsAccount, [])
        };
      }

      // Return account as-is if no interest
      const { data: notUpdated } = await supabase
        .from('savings_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      return {
        success: true,
        data: this.mapDBAccountToAccount(notUpdated as DBSavingsAccount, [])
      };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Calculate interest projections
   */
  static async calculateInterestProjection(accountId: string): Promise<APIResponse<InterestCalculation>> {
    try {
      const { data: account, error } = await supabase
        .from('savings_accounts')
        .select('balance, interest_rate, interest_earned')
        .eq('id', accountId)
        .single();

      if (error) throw error;

      const monthlyRate = (account as any).interest_rate / 12;
      const monthlyInterest = ((account as any).balance * monthlyRate) / 100;
      const annualProjection = monthlyInterest * 12;

      return {
        success: true,
        data: {
          monthlyRate,
          annualRate: (account as any).interest_rate,
          earnedThisMonth: Math.round(monthlyInterest * 100) / 100,
          earnedThisYear: Math.round((account as any).interest_earned * 100) / 100,
          projectedAnnual: Math.round(annualProjection * 100) / 100
        }
      };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get savings statistics
   */
  static async getSavingsStats(userId: string): Promise<
    APIResponse<{
      totalBalance: number;
      totalInterestEarned: number;
      accountCount: number;
      goalAccountsCount: number;
      averageRate: number;
    }>
  > {
    try {
      const { data: accounts, error } = await supabase
        .from('savings_accounts')
        .select('balance, interest_earned, interest_rate, account_type')
        .eq('user_id', userId);

      if (error) throw error;

      const accountList = accounts as any[];
      const totalBalance = accountList.reduce((sum: number, a: any) => sum + a.balance, 0);
      const totalInterest = accountList.reduce((sum: number, a: any) => sum + a.interest_earned, 0);
      const goalAccounts = accountList.filter((a) => a.account_type === 'goal');
      const averageRate =
        accountList.length > 0
          ? accountList.reduce((sum: number, a: any) => sum + a.interest_rate, 0) / accountList.length
          : 0;

      return {
        success: true,
        data: {
          totalBalance,
          totalInterestEarned: totalInterest,
          accountCount: accountList.length,
          goalAccountsCount: goalAccounts.length,
          averageRate: Math.round(averageRate * 100) / 100
        }
      };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get transaction history
   */
  static async getTransactionHistory(
    accountId: string,
    limit: number = 50
  ): Promise<APIResponse<SavingsTransaction[]>> {
    try {
      const { data: transactions, error } = await supabase
        .from('savings_transactions')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const mapped = (transactions as DBSavingsTransaction[]).map((t) => this.mapDBTransactionToTransaction(t));
      return { success: true, data: mapped };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Lock account
   */
  static async lockAccount(accountId: string, days: number): Promise<APIResponse<SavingsAccount>> {
    try {
      const lockDate = new Date();
      lockDate.setDate(lockDate.getDate() + days);

      const { data: account, error } = await supabase
        .from('savings_accounts')
        .update({ locked_until: lockDate.toISOString().split('T')[0] })
        .eq('id', accountId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBAccountToAccount(account as DBSavingsAccount, []) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Unlock account
   */
  static async unlockAccount(accountId: string): Promise<APIResponse<SavingsAccount>> {
    try {
      const { data: account, error } = await supabase
        .from('savings_accounts')
        .update({ locked_until: null })
        .eq('id', accountId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBAccountToAccount(account as DBSavingsAccount, []) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Validate account name
   */
  static validateAccountName(name: string): boolean {
    return name.length >= 3 && name.length <= 50;
  }

  /**
   * Validate interest rate
   */
  static validateInterestRate(rate: number): boolean {
    return rate >= 0 && rate <= 50;
  }

  /**
   * Close account
   */
  static async closeAccount(accountId: string): Promise<APIResponse<SavingsAccount>> {
    try {
      const { data: account, error: checkError } = await supabase
        .from('savings_accounts')
        .select('balance')
        .eq('id', accountId)
        .single();

      if (checkError) throw checkError;

      if ((account as any).balance > 0) {
        throw new Error('Cannot close account with balance');
      }

      const { data: closed, error } = await supabase
        .from('savings_accounts')
        .update({ is_active: false })
        .eq('id', accountId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBAccountToAccount(closed as DBSavingsAccount, []) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Helper to map database account to SavingsAccount interface
   */
  private static mapDBAccountToAccount(dbAccount: DBSavingsAccount, transactions: any[]): SavingsAccount {
    const goalProgress = dbAccount.goal_amount
      ? (dbAccount.balance / dbAccount.goal_amount) * 100
      : undefined;

    return {
      id: dbAccount.id,
      userId: dbAccount.user_id,
      name: dbAccount.name,
      accountType: dbAccount.account_type as any,
      balance: dbAccount.balance,
      currency: dbAccount.currency,
      interestRate: dbAccount.interest_rate,
      interestEarned: dbAccount.interest_earned,
      lastInterestAccrual: dbAccount.last_interest_accrual,
      minBalance: dbAccount.min_balance,
      maxBalance: dbAccount.max_balance,
      createdAt: dbAccount.created_at,
      updatedAt: dbAccount.updated_at,
      isActive: dbAccount.is_active,
      description: dbAccount.description,
      goalAmount: dbAccount.goal_amount,
      goalDeadline: dbAccount.goal_deadline,
      goalProgress,
      lockedUntil: dbAccount.locked_until,
      transactions: transactions.map((t) => this.mapDBTransactionToTransaction(t))
    };
  }

  /**
   * Helper to map database transaction to SavingsTransaction interface
   */
  private static mapDBTransactionToTransaction(dbTx: DBSavingsTransaction): SavingsTransaction {
    return {
      id: dbTx.id,
      accountId: dbTx.account_id,
      type: dbTx.type as any,
      amount: dbTx.amount,
      balance: dbTx.balance,
      description: dbTx.description,
      timestamp: dbTx.created_at,
      reference: dbTx.reference_id
    };
  }
}

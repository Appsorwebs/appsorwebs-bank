import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Shield,
  PiggyBank,
  TrendingUp,
  Globe,
  Users
} from 'lucide-react';
import { StatsCard } from './StatsCard';
import { QuickActions } from './QuickActions';
import { RecentTransactions } from './RecentTransactions';
import { BalanceChart } from './BalanceChart';
import { mockTransactions } from '../../data/mockData';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardProps {
  onActionClick: (action: string) => void;
}

interface AccountData {
  balance: number;
  available_balance: number;
}

interface StatItem {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'neutral' | 'negative';
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onActionClick }) => {
  const { profile, user } = useAuth();
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [escrowCount, setEscrowCount] = useState(0);
  const [savingsBalance, setSavingsBalance] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load account balance
      const { data: accounts } = await supabase
        .from('accounts')
        .select('balance, available_balance')
        .eq('user_id', user?.id)
        .single();

      if (accounts) {
        setAccountData(accounts);
      }

      // Load escrow count
      const { count: escrows } = await supabase
        .from('escrow_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_id', user?.id)
        .in('status', ['active', 'pending_dispute']);

      setEscrowCount(escrows || 0);

      // Load savings balance
      const { data: savings } = await supabase
        .from('savings_accounts')
        .select('current_balance')
        .eq('user_id', user?.id);

      const total = savings?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;
      setSavingsBalance(total);

      // Load transaction count
      const { count: transactions } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      setTransactionCount(transactions || 0);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '$0.00';
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const statsData: StatItem[] = [
    {
      title: 'Total Balance',
      value: formatCurrency(accountData?.balance),
      change: '+12.5% from last month',
      changeType: 'positive',
      icon: Wallet,
      gradient: 'from-primary-600 to-primary-700'
    },
    {
      title: 'Active Escrows',
      value: escrowCount.toString(),
      change: `${Math.max(0, escrowCount - 2)} active transactions`,
      changeType: 'neutral',
      icon: Shield,
      gradient: 'from-secondary-600 to-secondary-700'
    },
    {
      title: 'Savings Balance',
      value: formatCurrency(savingsBalance),
      change: '+8.2% monthly growth',
      changeType: 'positive',
      icon: PiggyBank,
      gradient: 'from-accent-600 to-accent-700'
    },
    {
      title: 'Monthly Transactions',
      value: transactionCount.toString(),
      change: '+18.3% from last month',
      changeType: 'positive',
      icon: TrendingUp,
      gradient: 'from-purple-600 to-purple-700'
    }
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-gray-200 dark:bg-dark-700 animate-pulse h-32 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-200 dark:bg-dark-700 animate-pulse h-24 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-primary-600 via-secondary-600 to-accent-600 rounded-2xl p-8 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.first_name || 'User'}! 👋
          </h1>
          <p className="text-primary-100 mb-6">
            Your global financial hub is ready. Manage escrows, savings, and transfers with confidence.
          </p>
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>150+ Countries Supported</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>1M+ Trusted Users</span>
            </div>
          </div>
        </div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Quick Actions and Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <QuickActions onActionClick={onActionClick} />
        </motion.div>
        
        <motion.div
          className="xl:col-span-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <BalanceChart />
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <RecentTransactions transactions={mockTransactions} />
      </motion.div>
    </div>
  );
};
/**
 * Savings Dashboard
 * Manage savings accounts with interest calculation
 */

import React, { useState } from 'react';
import {
  PiggyBank,
  TrendingUp,
  Lock,
  Unlock,
  Plus,
  Percent,
  Target,
  Zap,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { useSavings } from '../../hooks/useSavings';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export const SavingsDashboard: React.FC = () => {
  const {
    accounts,
    stats,
    loading,
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
  } = useSavings();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [hideBalance, setHideBalance] = useState(true);
  const [newAccountData, setNewAccountData] = useState({
    name: '',
    accountType: 'standard' as const,
    currency: 'NGN',
    interestRate: 8.5,
    minBalance: 100000
  });

  const selectedAccount = selectedAccountId
    ? accounts.find((a) => a.id === selectedAccountId)
    : null;

  const projection = selectedAccount ? calculateProjection(selectedAccount.id) : null;

  const handleCreateAccount = () => {
    if (!newAccountData.name) {
      toast.error('Account name is required');
      return;
    }

    const result = createAccount({
      ...newAccountData,
      balance: 0,
      isActive: true
    });

    if (result) {
      setNewAccountData({
        name: '',
        accountType: 'standard',
        currency: 'NGN',
        interestRate: 8.5,
        minBalance: 100000
      });
      setShowCreateForm(false);
    }
  };

  const handleDeposit = () => {
    if (!selectedAccount || !depositAmount) {
      toast.error('Please enter an amount');
      return;
    }

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid amount');
      return;
    }

    deposit(selectedAccount.id, amount, 'Manual deposit');
    setDepositAmount('');
    setShowDepositForm(false);
  };

  const handleWithdraw = () => {
    if (!selectedAccount || !withdrawAmount) {
      toast.error('Please enter an amount');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid amount');
      return;
    }

    withdraw(selectedAccount.id, amount, 'Manual withdrawal');
    setWithdrawAmount('');
    setShowWithdrawForm(false);
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return <Target className="w-6 h-6" />;
      case 'investment':
        return <TrendingUp className="w-6 h-6" />;
      default:
        return <PiggyBank className="w-6 h-6" />;
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'goal':
        return 'from-blue-600 to-blue-700';
      case 'investment':
        return 'from-purple-600 to-purple-700';
      default:
        return 'from-green-600 to-green-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Savings & Investments
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Grow your wealth with our competitive interest rates
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Open New Account
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Total Savings</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-900">
              ₦{(stats.totalBalance / 1000000).toFixed(1)}M
            </p>
            <PiggyBank className="w-5 h-5 text-green-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <p className="text-sm font-medium text-gray-600 mb-2">Interest Earned</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-900">
              ₦{(stats.totalInterestEarned / 1000).toFixed(0)}K
            </p>
            <Percent className="w-5 h-5 text-blue-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <p className="text-sm font-medium text-gray-600 mb-2">Total Accounts</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-900">{stats.accountCount}</p>
            <PiggyBank className="w-5 h-5 text-purple-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <p className="text-sm font-medium text-gray-600 mb-2">Avg. Interest Rate</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-900">{stats.averageRate}%</p>
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </div>
        </motion.div>
      </div>

      {/* Create Account Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Create Savings Account</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={newAccountData.name}
                    onChange={(e) =>
                      setNewAccountData({ ...newAccountData, name: e.target.value })
                    }
                    placeholder="e.g., Emergency Fund"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Type
                  </label>
                  <select
                    value={newAccountData.accountType}
                    onChange={(e) =>
                      setNewAccountData({
                        ...newAccountData,
                        accountType: e.target.value as any
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="standard">Standard</option>
                    <option value="goal">Goal Savings</option>
                    <option value="investment">Investment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Rate (% p.a.)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={newAccountData.interestRate}
                    onChange={(e) =>
                      setNewAccountData({
                        ...newAccountData,
                        interestRate: parseFloat(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Balance (₦)
                  </label>
                  <input
                    type="number"
                    step="10000"
                    min="0"
                    value={newAccountData.minBalance}
                    onChange={(e) =>
                      setNewAccountData({
                        ...newAccountData,
                        minBalance: parseInt(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleCreateAccount}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Create Account
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-12">Loading accounts...</div>
        ) : accounts.length > 0 ? (
          accounts.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition"
              onClick={() => setSelectedAccountId(account.id)}
            >
              {/* Account Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${getAccountTypeColor(
                      account.accountType
                    )} rounded-lg flex items-center justify-center text-white`}
                  >
                    {getAccountTypeIcon(account.accountType)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{account.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">
                      {account.accountType} • {account.interestRate}% p.a.
                    </p>
                  </div>
                </div>

                {account.isActive && account.lockedUntil && (
                  <Lock className="w-5 h-5 text-red-600" />
                )}
              </div>

              {/* Balance Display */}
              <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Current Balance</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-gray-900">
                    {hideBalance ? '••••••••' : `₦${account.balance.toLocaleString()}`}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setHideBalance(!hideBalance);
                    }}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {hideBalance ? (
                      <Eye className="w-4 h-4 text-gray-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Interest Information */}
              {projection && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
                  <p className="text-gray-600 mb-2">Interest Earned This Month</p>
                  <p className="font-semibold text-gray-900">
                    ₦{projection.earnedThisMonth.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Projected Annual: ₦{projection.projectedAnnual.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Goal Progress */}
              {account.goalAmount && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Goal Progress</span>
                    <span className="font-medium text-gray-900">
                      {account.goalProgress?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-blue-700 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${account.goalProgress || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ₦{(account.goalAmount - account.balance).toLocaleString()} to goal
                    {account.goalDeadline && ` by ${account.goalDeadline}`}
                  </p>
                </div>
              )}

              {/* Lock Status */}
              {account.lockedUntil && (
                <div className="mb-4 p-3 bg-orange-50 rounded-lg text-sm">
                  <p className="text-gray-600">Locked until {account.lockedUntil}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAccountId(account.id);
                    setShowDepositForm(true);
                  }}
                  className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition text-sm"
                >
                  Deposit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAccountId(account.id);
                    setShowWithdrawForm(true);
                  }}
                  disabled={account.lockedUntil && new Date(account.lockedUntil) > new Date()}
                  className="flex-1 py-2 px-3 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 font-medium rounded-lg transition text-sm"
                >
                  Withdraw
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-2 bg-white rounded-lg shadow p-12 text-center">
            <PiggyBank className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No savings accounts yet</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              Create Your First Account
            </button>
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      <AnimatePresence>
        {showDepositForm && selectedAccount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Deposit Funds</h2>
                <button
                  onClick={() => setShowDepositForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₦)
                  </label>
                  <input
                    type="number"
                    step="10000"
                    min="0"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="text-sm text-gray-600">
                  <p>
                    Current Balance: ₦{selectedAccount.balance.toLocaleString()}
                  </p>
                  <p className="mt-1">
                    Interest Rate: {selectedAccount.interestRate}% p.a.
                  </p>
                </div>

                <button
                  onClick={handleDeposit}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Deposit Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawForm && selectedAccount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Withdraw Funds</h2>
                <button
                  onClick={() => setShowWithdrawForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₦)
                  </label>
                  <input
                    type="number"
                    step="10000"
                    min="0"
                    max={selectedAccount.balance - selectedAccount.minBalance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available: ₦
                    {(selectedAccount.balance - selectedAccount.minBalance).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={selectedAccount.lockedUntil && new Date(selectedAccount.lockedUntil) > new Date()}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Withdraw Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Savings Features */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Savings Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600 mb-2" />
            <h4 className="font-semibold text-gray-900 mb-1">Competitive Rates</h4>
            <p className="text-sm text-gray-600">Earn up to 9.5% interest per annum on your savings</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <Target className="w-6 h-6 text-blue-600 mb-2" />
            <h4 className="font-semibold text-gray-900 mb-1">Set Goals</h4>
            <p className="text-sm text-gray-600">Track progress toward your financial goals</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <Zap className="w-6 h-6 text-purple-600 mb-2" />
            <h4 className="font-semibold text-gray-900 mb-1">Auto Deposit</h4>
            <p className="text-sm text-gray-600">Set up automatic monthly deposits and watch your savings grow</p>
          </div>
        </div>
      </div>
    </div>
  );
};

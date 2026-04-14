/**
 * Analytics Page
 * Comprehensive analytics and fraud detection dashboard
 */

import React, { useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Shield,
  BarChart3,
  PieChart,
  Calendar,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AnalyticsPage: React.FC = () => {
  const {
    metrics,
    fraudAlerts,
    transactions,
    securityScore,
    fraudRiskScore,
    loading,
    refreshAnalytics,
    resolveFraudAlert,
    getMerchantInsights
  } = useAnalytics();

  const [hideBalances, setHideBalances] = useState(true);
  const merchantInsights = getMerchantInsights();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics & Security
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor your spending patterns and detect suspicious activities
          </p>
        </div>
        <button
          onClick={refreshAnalytics}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Security Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow p-6 border border-green-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded">
              Good
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Security Score</p>
          <p className="text-4xl font-bold text-gray-900">{securityScore}</p>
          <p className="text-xs text-gray-600 mt-2">Account is secure</p>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all"
              style={{ width: `${securityScore}%` }}
            ></div>
          </div>
        </motion.div>

        {/* Fraud Risk Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`bg-gradient-to-br rounded-lg shadow p-6 border ${
            fraudRiskScore < 30
              ? 'from-green-50 to-emerald-50 border-green-200'
              : fraudRiskScore < 60
              ? 'from-yellow-50 to-amber-50 border-yellow-200'
              : 'from-red-50 to-pink-50 border-red-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className={`p-3 rounded-lg ${
                fraudRiskScore < 30
                  ? 'bg-green-100'
                  : fraudRiskScore < 60
                  ? 'bg-yellow-100'
                  : 'bg-red-100'
              }`}
            >
              <AlertCircle
                className={`w-6 h-6 ${
                  fraudRiskScore < 30
                    ? 'text-green-600'
                    : fraudRiskScore < 60
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              />
            </div>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded ${
                fraudRiskScore < 30
                  ? 'bg-green-100 text-green-700'
                  : fraudRiskScore < 60
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {fraudRiskScore < 30 ? 'Low' : fraudRiskScore < 60 ? 'Medium' : 'High'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Fraud Risk</p>
          <p className="text-4xl font-bold text-gray-900">{fraudRiskScore}</p>
          <p className="text-xs text-gray-600 mt-2">
            {fraudRiskScore === 0
              ? 'No suspicious activity detected'
              : `${fraudAlerts.filter((a) => !a.resolved).length} active alert(s)`}
          </p>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                fraudRiskScore < 30
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                  : fraudRiskScore < 60
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600'
                  : 'bg-gradient-to-r from-red-500 to-pink-600'
              }`}
              style={{ width: `${fraudRiskScore}%` }}
            ></div>
          </div>
        </motion.div>

        {/* Active Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg shadow p-6 border border-blue-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">
              Active
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Security Alerts</p>
          <p className="text-4xl font-bold text-gray-900">
            {fraudAlerts.filter((a) => !a.resolved).length}
          </p>
          <p className="text-xs text-gray-600 mt-2">Unresolved alerts</p>
          <div className="mt-3 space-y-1">
            {fraudAlerts
              .filter((a) => !a.resolved)
              .slice(0, 2)
              .map((alert) => (
                <div key={alert.id} className="text-xs text-blue-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                  {alert.type.replace(/_/g, ' ').toUpperCase()}
                </div>
              ))}
          </div>
        </motion.div>
      </div>

      {/* Spending Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-lg shadow p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Spending Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Spending</p>
            <p className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {hideBalances ? '••••••••' : `₦${(metrics.totalSpending / 1000000).toFixed(1)}M`}
              <button
                onClick={() => setHideBalances(!hideBalances)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {hideBalances ? (
                  <Eye className="w-4 h-4 text-gray-400" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </p>
            <p className="text-xs text-gray-600 mt-1">{metrics.transactionCount} transactions</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Average Transaction</p>
            <p className="text-2xl font-bold text-gray-900">
              {hideBalances ? '••••••••' : `₦${(metrics.averageTransaction / 1000).toFixed(0)}K`}
            </p>
            <p className="text-xs text-gray-600 mt-1">Per transaction</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Daily Average</p>
            <p className="text-2xl font-bold text-gray-900">
              {hideBalances ? '••••••••' : `₦${(metrics.dailyAverage / 1000).toFixed(0)}K`}
            </p>
            <p className="text-xs text-gray-600 mt-1">Over 30 days</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Budget Usage</p>
            <p className="text-2xl font-bold text-gray-900">{Math.round(metrics.monthlyBudgetUsage)}%</p>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${
                  metrics.monthlyBudgetUsage > 80
                    ? 'bg-red-500'
                    : metrics.monthlyBudgetUsage > 60
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${metrics.monthlyBudgetUsage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Top Categories */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Spending by Category</h3>
          <div className="space-y-3">
            {metrics.topCategories.map((category, index) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {category.category}
                    </p>
                    <span className="text-xs font-semibold text-gray-600">
                      {hideBalances ? '•••' : `₦${(category.amount / 1000).toFixed(0)}K`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        index === 0
                          ? 'bg-blue-500'
                          : index === 1
                          ? 'bg-purple-500'
                          : index === 2
                          ? 'bg-green-500'
                          : 'bg-orange-500'
                      }`}
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {category.percentage.toFixed(1)}% • {category.count} transactions
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Security Alerts */}
      {fraudAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-400"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            Security Alerts
          </h2>

          <div className="space-y-3">
            {fraudAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-lg border ${
                  alert.resolved
                    ? 'bg-gray-50 border-gray-200'
                    : alert.severity === 'critical'
                    ? 'bg-red-50 border-red-200'
                    : alert.severity === 'high'
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">
                        {alert.type.replace(/_/g, ' ').toUpperCase()}
                      </p>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          alert.resolved
                            ? 'bg-gray-100 text-gray-700'
                            : alert.severity === 'critical'
                            ? 'bg-red-100 text-red-700'
                            : alert.severity === 'high'
                            ? 'bg-orange-100 text-orange-700'
                            : alert.severity === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {alert.severity.toUpperCase()}
                      </span>
                      {alert.resolved && <CheckCircle className="w-4 h-4 text-green-600" />}
                    </div>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>

                  {!alert.resolved && (
                    <button
                      onClick={() => resolveFraudAlert(alert.id)}
                      className="ml-4 text-sm font-semibold text-blue-600 hover:text-blue-700 transition whitespace-nowrap"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Top Merchants */}
      {merchantInsights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Top Merchants
          </h2>

          <div className="space-y-3">
            {merchantInsights.slice(0, 5).map((merchant, index) => (
              <motion.div
                key={merchant.merchant}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-900">{merchant.merchant}</p>
                  <p className="text-xs text-gray-600">
                    {merchant.transactionCount} transactions • {merchant.frequency}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ₦{(merchant.totalSpent / 1000).toFixed(0)}K
                  </p>
                  <p className="text-xs text-gray-500">{merchant.lastTransaction.split('T')[0]}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>

          <div className="space-y-2">
            {transactions.slice(0, 10).map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-xs text-gray-600">
                    {new Date(transaction.timestamp).toLocaleString()} • {transaction.type.toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {hideBalances ? '••••' : `₦${transaction.amount.toLocaleString()}`}
                  </p>
                  <span
                    className={`text-xs font-semibold ${
                      transaction.status === 'completed'
                        ? 'text-green-600'
                        : transaction.status === 'pending'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AnalyticsPage;

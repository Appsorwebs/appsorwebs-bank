/**
 * Bill Payment Page
 * Manage utility and subscription bill payments
 */

import React, { useState } from 'react';
import { Zap, Droplets, Wifi, Flame, Phone, CreditCard, History } from 'lucide-react';
import { motion } from 'framer-motion';

type TabType = 'pay' | 'history' | 'settings';

export const BillPaymentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('pay');

  const billCategories = [
    { id: 'electricity', name: 'Electricity', icon: Zap, color: 'from-yellow-400 to-orange-500' },
    { id: 'water', name: 'Water', icon: Droplets, color: 'from-blue-400 to-cyan-500' },
    { id: 'internet', name: 'Internet', icon: Wifi, color: 'from-purple-400 to-pink-500' },
    { id: 'gas', name: 'Gas', icon: Flame, color: 'from-red-400 to-orange-500' },
    { id: 'phone', name: 'Phone', icon: Phone, color: 'from-green-400 to-teal-500' },
    { id: 'insurance', name: 'Insurance', icon: CreditCard, color: 'from-indigo-400 to-blue-500' }
  ];

  const tabs = [
    { id: 'pay', label: 'Pay Bills', icon: CreditCard },
    { id: 'history', label: 'Payment History', icon: History },
    { id: 'settings', label: 'Settings', icon: CreditCard }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-950 dark:to-dark-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Bill Payments
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Pay your utilities and subscriptions directly from your account
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-dark-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <tab.icon size={18} />
                {tab.label}
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'pay' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Select a bill category
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {billCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <motion.button
                      key={category.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-6 rounded-xl bg-gradient-to-br ${category.color} text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer`}
                    >
                      <Icon size={32} className="mb-4" />
                      <h3 className="text-lg font-semibold">{category.name}</h3>
                      <p className="text-sm opacity-90 mt-2">Pay your {category.name.toLowerCase()} bills</p>
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-8 bg-white dark:bg-dark-800 rounded-xl p-8 border border-gray-200 dark:border-dark-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Pay
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Biller
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white">
                      <option>Choose a biller...</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount
                    </label>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                  </div>
                  <button className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 rounded-lg transition-colors">
                    Continue Payment
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-dark-800 rounded-xl p-8 border border-gray-200 dark:border-dark-700"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Payment History
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              No payments made yet. Start paying your bills to see your history here.
            </p>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-dark-800 rounded-xl p-8 border border-gray-200 dark:border-dark-700"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Settings
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Auto Pay</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Enable automatic bill payments</p>
                </div>
                <input type="checkbox" className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

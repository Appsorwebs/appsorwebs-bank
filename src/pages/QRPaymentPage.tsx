/**
 * QR Payment Page
 * Main page for QR code payment management
 */

import React, { useState } from 'react';
import { QRCodeGenerator } from '../components/qr/QRCodeGenerator';
import { QRCodeScanner } from '../components/qr/QRCodeScanner';
import { QrCode, Send, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

type TabType = 'generate' | 'scan' | 'analytics';

export const QRPaymentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('generate');

  const tabs = [
    {
      id: 'generate',
      label: 'Generate QR Code',
      icon: QrCode,
      description: 'Create payment QR codes for your business'
    },
    {
      id: 'scan',
      label: 'Scan & Pay',
      icon: Send,
      description: 'Scan QR codes and make payments'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'View QR payment statistics'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            QR Code Payments
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Generate unique QR codes for payments or scan codes to make instant transfers
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: QrCode,
              title: 'Easy Generation',
              description: 'Create QR codes in seconds with custom amounts',
              color: 'blue'
            },
            {
              icon: Send,
              title: 'Quick Payments',
              description: 'Scan and pay without entering account details',
              color: 'green'
            },
            {
              icon: BarChart3,
              title: 'Track Analytics',
              description: 'Monitor all QR payment transactions',
              color: 'purple'
            }
          ].map((feature, index) => {
            const Icon = feature.icon;
            const colorClasses = {
              blue: 'from-blue-400 to-blue-600',
              green: 'from-green-400 to-green-600',
              purple: 'from-purple-400 to-purple-600'
            };

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-lg p-6"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[feature.color as keyof typeof colorClasses]} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-t-lg shadow-lg overflow-hidden">
          <div className="flex flex-col sm:flex-row border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex-1 px-6 py-4 font-medium transition ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 border-b-2 border-transparent hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'generate' && <QRCodeGenerator />}
              {activeTab === 'scan' && <QRCodeScanner />}
              {activeTab === 'analytics' && <QRAnalytics />}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * QR Analytics Component
 */
const QRAnalytics: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">QR Payment Analytics</h2>
        <p className="text-gray-600 mt-1">Monitor your QR code payment performance</p>
      </div>

      {/* Chart Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Volume Over Time</h3>
          <div className="h-64 bg-white rounded flex items-center justify-center border-2 border-dashed border-blue-300">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-blue-400 mx-auto mb-2" />
              <p className="text-gray-600">Chart visualization would appear here</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Success Rate</h3>
          <div className="h-64 bg-white rounded flex items-center justify-center border-2 border-dashed border-green-300">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-green-400 mx-auto mb-2" />
              <p className="text-gray-600">Success rate chart would appear here</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Summary Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Summary Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total QR Codes', value: '12', icon: QrCode, color: 'blue' },
            { label: 'Active Codes', value: '8', icon: QrCode, color: 'green' },
            { label: 'Total Payments', value: '45', icon: Send, color: 'purple' },
            { label: 'Total Revenue', value: '₦2.3M', icon: BarChart3, color: 'orange' }
          ].map((stat, index) => {
            const Icon = stat.icon;
            const colorClasses = {
              blue: 'bg-blue-50 text-blue-600',
              green: 'bg-green-50 text-green-600',
              purple: 'bg-purple-50 text-purple-600',
              orange: 'bg-orange-50 text-orange-600'
            };

            return (
              <div key={index} className={`rounded-lg p-4 ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                <p className="text-sm font-medium opacity-75 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg shadow p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {[
            { description: 'Coffee Shop Payment', amount: '₦5,000', date: '2024-04-14', status: 'Completed' },
            { description: 'Restaurant Bill', amount: '₦12,500', date: '2024-04-13', status: 'Completed' },
            { description: 'Service Fee', amount: '₦3,200', date: '2024-04-12', status: 'Completed' },
            { description: 'Product Purchase', amount: '₦25,000', date: '2024-04-11', status: 'Completed' }
          ].map((transaction, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{transaction.description}</p>
                <p className="text-xs text-gray-600">{transaction.date}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{transaction.amount}</p>
                <p className="text-xs text-green-600">{transaction.status}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default QRPaymentPage;

import React, { useState, useEffect } from 'react';
import {
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Repeat2,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SendMoneyForm } from './SendMoneyForm';
import { useAuth } from '../../contexts/AuthContext';
import { useTransfer } from '../../hooks/useTransfer';
import { useSearch } from '../../hooks/useSearch';
import { motion } from 'framer-motion';

export const TransfersPage: React.FC = () => {
  const { user } = useAuth();
  const { transfers, loading, loadTransfers, stats } = useTransfer(user?.id || '');
  const [showSendForm, setShowSendForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { results: filteredTransfers, handleSearch } = useSearch(
    transfers,
    ['description', 'recipientEmail', 'recipientName'] as any[],
    { minChars: 1 }
  );

  useEffect(() => {
    if (user?.id) {
      loadTransfers();
    }
  }, [user?.id, loadTransfers]);

  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      case 'processing':
        return <Repeat2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading && transfers.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 dark:bg-dark-700 rounded-lg"></div>
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-dark-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Money Transfers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Send money domestically and internationally
          </p>
        </div>
        <Button
          onClick={() => setShowSendForm(true)}
          className="sm:w-auto"
        >
          <Send className="w-4 h-4 mr-2" />
          Send Money
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Transferred
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                ${stats.totalTransferred.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Transfers
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.transferCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Domestic vs International
              </p>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {stats.domesticCount}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">/</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {stats.internationalCount}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Fees Paid
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                ${stats.totalFeesPaid.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg flex items-center justify-center">
              <Repeat2 className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Transfer History */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Transfer History
          </h3>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search transfers..."
              className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-700 border border-transparent rounded-lg focus:outline-none focus:border-primary-500 w-64 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredTransfers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No transfers yet</p>
            </div>
          ) : (
            filteredTransfers.map((transfer, index) => (
              <motion.div
                key={transfer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-gray-200 dark:border-dark-600 rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                      <ArrowUpRight className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {transfer.description}
                        </h4>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                            transfer.status
                          )}`}
                        >
                          {getStatusIcon(transfer.status)}
                          <span className="ml-1 capitalize">{transfer.status}</span>
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                          {transfer.type === 'international' ? '🌍 International' : '🏠 Domestic'}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        To: {transfer.recipientEmail || transfer.recipientPhone || 'Unknown recipient'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(transfer.createdAt).toLocaleDateString()} -{' '}
                        {transfer.referenceId}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      ${transfer.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Fee: ${transfer.fee.toFixed(2)}
                    </p>
                  </div>
                </div>

                {transfer.status === 'failed' && transfer.errorMessage && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-600">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Error: {transfer.errorMessage}
                    </p>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </Card>

      {/* Send Money Modal */}
      {showSendForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-dark-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Send Money</h2>
            </div>

            <div className="p-6">
              <SendMoneyForm
                onSuccess={() => {
                  setShowSendForm(false);
                  loadTransfers();
                }}
                onCancel={() => setShowSendForm(false)}
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

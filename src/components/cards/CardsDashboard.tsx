/**
 * Cards Dashboard
 * Manage debit cards with real-time controls
 */

import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Eye,
  EyeOff,
  Settings,
  Globe,
  ShoppingCart,
  Lock,
  Unlock,
  Zap,
  Wallet,
  X
} from 'lucide-react';
import { useCards } from '../../hooks/useCards';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export const CardsDashboard: React.FC = () => {
  const {
    cards,
    stats,
    loading,
    selectCard,
    enableCard,
    disableCard,
    lockCard,
    unlockCard,
    enableOnline,
    disableOnline,
    enableInternational,
    disableInternational,
    enableContactless,
    disableContactless,
    setDailyLimit,
    setMonthlyLimit,
    setAsDefault,
    getRemainingDailyLimit,
    getRemainingMonthlyLimit
  } = useCards();

  const [showCardNumbers, setShowCardNumbers] = useState<{ [key: string]: boolean }>({});
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState<string | null>(null);
  const [tempDailyLimit, setTempDailyLimit] = useState('');
  const [tempMonthlyLimit, setTempMonthlyLimit] = useState('');

  const selectedCard = selectedCardId ? cards.find((c) => c.id === selectedCardId) : null;

  const toggleCardVisibility = (cardId: string) => {
    setShowCardNumbers((prev) => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const handleLimitUpdate = (cardId: string, type: 'daily' | 'monthly') => {
    const limit = parseInt(type === 'daily' ? tempDailyLimit : tempMonthlyLimit);
    if (isNaN(limit) || limit <= 0) {
      toast.error('Limit must be a positive number');
      return;
    }

    if (type === 'daily') {
      setDailyLimit(cardId, limit);
      setTempDailyLimit('');
    } else {
      setMonthlyLimit(cardId, limit);
      setTempMonthlyLimit('');
    }

    setShowSettings(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Debit Cards</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your physical and virtual cards with real-time controls
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition">
            <Wallet className="w-5 h-5" />
            Virtual Card
          </button>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
            <Plus className="w-5 h-5" />
            Request Card
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow p-4">
          <p className="text-xs font-medium text-gray-600 mb-1">Total Cards</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalCards}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-lg shadow p-4">
          <p className="text-xs font-medium text-gray-600 mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.activeCards}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-lg shadow p-4">
          <p className="text-xs font-medium text-gray-600 mb-1">Inactive</p>
          <p className="text-2xl font-bold text-gray-600">{stats.inactiveCards}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-lg shadow p-4">
          <p className="text-xs font-medium text-gray-600 mb-1">Blocked</p>
          <p className="text-2xl font-bold text-red-600">{stats.blockedCards}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-lg shadow p-4">
          <p className="text-xs font-medium text-gray-600 mb-1">Monthly Spent</p>
          <p className="text-2xl font-bold text-blue-600">₦{(stats.totalMonthlySpent / 1000000).toFixed(1)}M</p>
        </motion.div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-8">Loading cards...</div>
        ) : cards.length > 0 ? (
          cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
              onClick={() => setSelectedCardId(card.id)}
            >
              {/* Card Visual */}
              <div className="relative mb-6">
                <div
                  className={`w-full h-48 rounded-xl p-6 text-white relative overflow-hidden ${
                    card.status === 'active' && !card.isLocked
                      ? 'bg-gradient-to-br from-blue-600 to-blue-800'
                      : 'bg-gradient-to-br from-gray-600 to-gray-800'
                  }`}
                >
                  {/* Card Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-4 right-4 w-12 h-12 border-2 border-white/20 rounded-full"></div>
                    <div className="absolute bottom-4 left-4 w-16 h-16 border border-white/10 rotate-45"></div>
                  </div>

                  {/* Card Content */}
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-6 h-6" />
                        <span className="text-sm font-medium">Appsorwebs Bank</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {card.isPhysical ? (
                          <span className="px-2 py-1 bg-white/20 text-white text-xs rounded">Physical</span>
                        ) : (
                          <span className="px-2 py-1 bg-blue-300/20 text-blue-100 text-xs rounded">Virtual</span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded capitalize ${getStatusColor(card.status)}`}>
                          {card.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <p className="text-lg font-mono tracking-wider">
                          {showCardNumbers[card.id]
                            ? card.cardNumber
                            : '**** **** **** ' + card.lastFourDigits}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCardVisibility(card.id);
                          }}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          {showCardNumbers[card.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-white/70">CARDHOLDER</p>
                          <p className="text-sm font-medium">{card.holderName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/70">EXPIRES</p>
                          <p className="text-sm font-medium">
                            {card.expiryMonth}/{card.expiryYear}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Controls */}
              <div className="space-y-4">
                {/* Toggle Buttons */}
                <div className="space-y-3">
                  {/* Card Status */}
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {card.isLocked ? (
                        <Lock className="w-4 h-4 text-red-600" />
                      ) : (
                        <Unlock className="w-4 h-4 text-green-600" />
                      )}
                      <span className="text-sm font-medium text-gray-700">Card Status</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (card.isLocked) {
                          unlockCard(card.id);
                        } else {
                          lockCard(card.id, 'Locked by user');
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        !card.isLocked ? 'bg-green-600' : 'bg-red-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          !card.isLocked ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Online Transactions */}
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <ShoppingCart
                        className={`w-4 h-4 ${
                          card.onlineTransactionsEnabled ? 'text-green-600' : 'text-gray-400'
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-700">Online Payments</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        card.onlineTransactionsEnabled ? disableOnline(card.id) : enableOnline(card.id);
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        card.onlineTransactionsEnabled ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          card.onlineTransactionsEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* International */}
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Globe
                        className={`w-4 h-4 ${
                          card.internationalTransactionsEnabled ? 'text-green-600' : 'text-gray-400'
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-700">International</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        card.internationalTransactionsEnabled
                          ? disableInternational(card.id)
                          : enableInternational(card.id);
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        card.internationalTransactionsEnabled ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          card.internationalTransactionsEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Contactless */}
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Zap className={`w-4 h-4 ${card.contactlessEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className="text-sm font-medium text-gray-700">Contactless</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        card.contactlessEnabled ? disableContactless(card.id) : enableContactless(card.id);
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        card.contactlessEnabled ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          card.contactlessEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Spending Limits */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Spending Limits</h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-gradient-to-b from-blue-50 to-white rounded-lg p-2 border border-blue-200">
                      <p className="text-xs text-gray-600">Daily</p>
                      <p className="text-sm font-bold text-gray-900">
                        ₦{card.dailyLimit.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRemainingDailyLimit(card.id).toLocaleString()} left
                      </p>
                    </div>
                    <div className="bg-gradient-to-b from-green-50 to-white rounded-lg p-2 border border-green-200">
                      <p className="text-xs text-gray-600">Monthly</p>
                      <p className="text-sm font-bold text-gray-900">
                        ₦{card.monthlyLimit.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRemainingMonthlyLimit(card.id).toLocaleString()} left
                      </p>
                    </div>
                    <div className="bg-gradient-to-b from-purple-50 to-white rounded-lg p-2 border border-purple-200">
                      <p className="text-xs text-gray-600">Spent</p>
                      <p className="text-sm font-bold text-gray-900">
                        ₦{card.monthlySpent.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {((card.monthlySpent / card.monthlyLimit) * 100).toFixed(0)}% used
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAsDefault(card.id);
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition text-sm ${
                      card.isDefault
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {card.isDefault ? '✓ Default' : 'Set Default'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSettings(card.id);
                    }}
                    className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition text-sm flex items-center justify-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-2 bg-white rounded-lg shadow p-12 text-center">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No cards found</p>
            <button className="flex items-center justify-center gap-2 mx-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition">
              <Plus className="w-5 h-5" />
              Request Your First Card
            </button>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowSettings(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Card Settings</h2>
                <button
                  onClick={() => setShowSettings(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Daily Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Limit (₦)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={tempDailyLimit}
                      onChange={(e) => setTempDailyLimit(e.target.value)}
                      placeholder={selectedCard.dailyLimit.toString()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => handleLimitUpdate(selectedCard.id, 'daily')}
                      disabled={!tempDailyLimit}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                      Set
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Current: ₦{selectedCard.dailyLimit.toLocaleString()}</p>
                </div>

                {/* Monthly Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Limit (₦)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={tempMonthlyLimit}
                      onChange={(e) => setTempMonthlyLimit(e.target.value)}
                      placeholder={selectedCard.monthlyLimit.toString()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => handleLimitUpdate(selectedCard.id, 'monthly')}
                      disabled={!tempMonthlyLimit}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                      Set
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Current: ₦{selectedCard.monthlyLimit.toLocaleString()}
                  </p>
                </div>

                {/* Card Info */}
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Card Info</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Card Type:</span>
                      <span className="font-medium capitalize">
                        {selectedCard.brand} {selectedCard.cardType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span className="font-medium">{selectedCard.createdAt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transactions:</span>
                      <span className="font-medium">{selectedCard.totalTransactions}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Features */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Card Features & Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Global Acceptance</h4>
            <p className="text-sm text-gray-600">Use anywhere Visa/Mastercard is accepted worldwide</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Real-time Controls</h4>
            <p className="text-sm text-gray-600">Instant lock/unlock and spending limit adjustments</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Virtual Cards</h4>
            <p className="text-sm text-gray-600">Generate instant virtual cards for secure online shopping</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Advanced Security</h4>
            <p className="text-sm text-gray-600">3D Secure, fraud monitoring, and biometric authentication</p>
          </div>
        </div>
      </div>
    </div>
  );
};

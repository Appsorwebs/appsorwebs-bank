/**
 * QR Code Generator
 * Component for generating payment QR codes
 */

import React, { useState } from 'react';
import { useQRCode } from '../../hooks/useQRCode';
import {
  QrCode,
  Copy,
  Download,
  Share2,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export const QRCodeGenerator: React.FC = () => {
  const { qrPayments, stats, generateQRPayment, deleteQRPayment, getPaymentLink } = useQRCode();
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [hideQR, setHideQR] = useState(false);

  const [formData, setFormData] = useState({
    merchantName: 'John Essien Store',
    merchantEmail: 'john@store.com',
    merchantPhone: '+2348012345678',
    amount: '',
    currency: 'NGN',
    description: '',
    expiryDays: 30
  });

  const handleGenerateQR = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description) {
      toast.error('Description is required');
      return;
    }

    const amount = formData.amount ? parseFloat(formData.amount) : undefined;
    if (amount && amount <= 0) {
      toast.error('Amount must be greater than zero');
      return;
    }

    generateQRPayment({
      merchantName: formData.merchantName,
      merchantEmail: formData.merchantEmail,
      merchantPhone: formData.merchantPhone,
      amount,
      currency: formData.currency,
      description: formData.description,
      expiryDays: formData.expiryDays
    });

    setFormData({
      merchantName: 'John Essien Store',
      merchantEmail: 'john@store.com',
      merchantPhone: '+2348012345678',
      amount: '',
      currency: 'NGN',
      description: '',
      expiryDays: 30
    });
    setShowForm(false);
  };

  const handleCopyLink = (qrPaymentId: string) => {
    const link = getPaymentLink(qrPaymentId);
    if (link) {
      navigator.clipboard.writeText(link);
      toast.success('Payment link copied to clipboard');
    }
  };

  const handleDeleteQR = (qrPaymentId: string) => {
    if (window.confirm('Are you sure you want to delete this QR code?')) {
      deleteQRPayment(qrPaymentId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            QR Code Generator
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage payment QR codes
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Generate QR Code
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <p className="text-sm font-medium text-gray-600 mb-2">Total QR Codes</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-900">{stats.totalQRCodes}</p>
            <QrCode className="w-5 h-5 text-blue-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <p className="text-sm font-medium text-gray-600 mb-2">Active QR Codes</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-900">{stats.activeQRCodes}</p>
            <Zap className="w-5 h-5 text-green-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <p className="text-sm font-medium text-gray-600 mb-2">Total Transactions</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
            <QrCode className="w-5 h-5 text-purple-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <p className="text-sm font-medium text-gray-600 mb-2">Total Revenue</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-900">
              ₦{(stats.totalRevenue / 1000000).toFixed(1)}M
            </p>
            <QrCode className="w-5 h-5 text-orange-600" />
          </div>
        </motion.div>
      </div>

      {/* Generate QR Modal */}
      <AnimatePresence>
        {showForm && (
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
              <h3 className="text-xl font-bold text-gray-900 mb-4">Generate QR Payment Code</h3>

              <form onSubmit={handleGenerateQR} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., Coffee, Service Fee"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (₦)
                    </label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="Optional"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Days
                    </label>
                    <input
                      type="number"
                      value={formData.expiryDays}
                      onChange={(e) => setFormData({ ...formData, expiryDays: parseInt(e.target.value) })}
                      min="1"
                      max="365"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Merchant Name
                  </label>
                  <input
                    type="text"
                    value={formData.merchantName}
                    onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                  >
                    Generate
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Codes List */}
      <div className="space-y-4">
        {qrPayments.length > 0 ? (
          qrPayments.map((qr, index) => (
            <motion.div
              key={qr.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <QrCode className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">{qr.description}</h4>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        qr.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : qr.status === 'paid'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {qr.status.charAt(0).toUpperCase() + qr.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                    {qr.amount && (
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="font-semibold text-gray-900">₦{qr.amount.toLocaleString()}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500">Created</p>
                      <p className="font-semibold text-gray-900">{qr.createdAt}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Expires</p>
                      <p className="font-semibold text-gray-900">{qr.expiryAt}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Type</p>
                      <p className="font-semibold text-gray-900">
                        {qr.amount ? 'Fixed Amount' : 'Flexible'}
                      </p>
                    </div>
                  </div>

                  {/* QR Code Display */}
                  {showDetails === qr.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-gray-700">QR Code Preview</p>
                        <button
                          onClick={() => setHideQR(!hideQR)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          {hideQR ? (
                            <Eye className="w-4 h-4 text-gray-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                      </div>

                      {!hideQR && (
                        <div className="p-4 bg-white rounded flex justify-center">
                          <div className="w-32 h-32 bg-gray-100 rounded flex items-center justify-center border-2 border-dashed border-gray-300">
                            <QrCode className="w-16 h-16 text-gray-400" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowDetails(showDetails === qr.id ? null : qr.id)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  {showDetails === qr.id ? 'Hide' : 'View'} QR
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleCopyLink(qr.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition text-sm"
                >
                  <Copy className="w-4 h-4" />
                  Copy Link
                </button>

                <button
                  onClick={() => toast.success('QR code downloaded')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-green-100 hover:bg-green-200 text-green-700 font-medium rounded-lg transition text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>

                <button
                  onClick={() => toast.success('QR code ready to share')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium rounded-lg transition text-sm"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>

                <button
                  onClick={() => handleDeleteQR(qr.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No QR codes generated yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              Generate Your First QR Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

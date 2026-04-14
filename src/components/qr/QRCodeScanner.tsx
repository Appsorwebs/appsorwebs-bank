/**
 * QR Code Scanner
 * Component for scanning payment QR codes and processing payments
 */

import React, { useState } from 'react';
import { useQRCode } from '../../hooks/useQRCode';
import { useAuth } from '../../hooks/useAuth';
import {
  Camera,
  Upload,
  QrCode,
  AlertCircle,
  CheckCircle,
  X,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export const QRCodeScanner: React.FC = () => {
  const { user } = useAuth();
  const { scanQRCode, processQRPayment, validateQRAmount } = useQRCode();
  const [scanMode, setScanMode] = useState<'upload' | 'camera'>('upload');
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const [paymentData, setPaymentData] = useState({
    amount: '',
    payerName: user?.name || '',
    payerAccountNumber: ''
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In production, use OCR/QR scanning library
    // For mock, simulate scanning
    const mockQRData = JSON.stringify({
      merchantId: 'user_1',
      merchantName: 'John Essien Store',
      amount: 50000,
      description: 'Coffee Shop Payment',
      timestamp: new Date().toISOString()
    });

    setScannedData(mockQRData);
    const result = scanQRCode(mockQRData);
    setScanResult(result);
    setShowPaymentForm(result.type === 'payment');
  };

  const handleCameraCapture = () => {
    // In production, use device camera API
    // For mock, simulate camera capture
    toast.info('Camera mode would activate device camera in production');

    const mockQRData = JSON.stringify({
      merchantId: 'user_1',
      merchantName: 'John Essien Store',
      amount: 50000,
      description: 'Coffee Shop Payment',
      timestamp: new Date().toISOString()
    });

    setScannedData(mockQRData);
    const result = scanQRCode(mockQRData);
    setScanResult(result);
    setShowPaymentForm(result.type === 'payment');
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!scanResult?.data || !user) {
      toast.error('Invalid scan data');
      return;
    }

    const amount = parseFloat(paymentData.amount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!paymentData.payerName || !paymentData.payerAccountNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate amount if QR has fixed amount
    const validation = validateQRAmount(scanResult.data.merchantId, amount);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    // Process the payment
    const result = processQRPayment(
      scanResult.data.merchantId,
      user.id,
      paymentData.payerName,
      paymentData.payerAccountNumber,
      amount
    );

    if (result.success) {
      setScannedData(null);
      setScanResult(null);
      setShowPaymentForm(false);
      setPaymentData({
        amount: '',
        payerName: user.name || '',
        payerAccountNumber: ''
      });
    }
  };

  const handleReset = () => {
    setScannedData(null);
    setScanResult(null);
    setShowPaymentForm(false);
    setPaymentData({
      amount: '',
      payerName: user?.name || '',
      payerAccountNumber: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          QR Code Scanner
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Scan QR codes to make payments instantly
        </p>
      </div>

      {/* Scan Mode Selection */}
      {!scannedData && (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-700 mb-4">Choose scan method:</p>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setScanMode('upload')}
              className={`p-6 border-2 rounded-lg transition ${
                scanMode === 'upload'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400'
              }`}
            >
              <Upload className={`w-8 h-8 mx-auto mb-2 ${scanMode === 'upload' ? 'text-blue-600' : 'text-gray-400'}`} />
              <p className="font-medium text-gray-900">Upload Image</p>
              <p className="text-xs text-gray-600 mt-1">Upload QR code image</p>
            </button>

            <button
              onClick={() => setScanMode('camera')}
              className={`p-6 border-2 rounded-lg transition ${
                scanMode === 'camera'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400'
              }`}
            >
              <Camera className={`w-8 h-8 mx-auto mb-2 ${scanMode === 'camera' ? 'text-blue-600' : 'text-gray-400'}`} />
              <p className="font-medium text-gray-900">Camera</p>
              <p className="text-xs text-gray-600 mt-1">Use device camera</p>
            </button>
          </div>

          <div className="mt-6">
            {scanMode === 'upload' ? (
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:bg-blue-50 transition">
                  <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Click to upload QR code image</p>
                  <p className="text-xs text-gray-600 mt-1">or drag and drop</p>
                </div>
              </label>
            ) : (
              <button
                onClick={handleCameraCapture}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Activate Camera
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scan Result */}
      <AnimatePresence>
        {scanResult && !showPaymentForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-lg shadow p-6"
          >
            {scanResult.type === 'payment' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-green-600">
                  <CheckCircle className="w-6 h-6" />
                  <h3 className="text-lg font-semibold">QR Code Valid</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Merchant</p>
                    <p className="font-semibold text-gray-900">{scanResult.data?.merchantName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Description</p>
                    <p className="font-semibold text-gray-900">{scanResult.data?.description}</p>
                  </div>
                  {scanResult.data?.amount && (
                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="font-semibold text-gray-900">
                        ₦{scanResult.data.amount.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowPaymentForm(true)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Continue to Payment
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-red-600">
                  <AlertCircle className="w-6 h-6" />
                  <h3 className="text-lg font-semibold">Invalid QR Code</h3>
                </div>
                <p className="text-gray-600">{scanResult.error}</p>
                <button
                  onClick={handleReset}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                >
                  Try Again
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Form */}
      <AnimatePresence>
        {showPaymentForm && scanResult?.data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Payment</h3>
              <button onClick={() => setShowPaymentForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Payment Summary */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payable To:</span>
                  <span className="font-semibold text-gray-900">{scanResult.data.merchantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Description:</span>
                  <span className="font-semibold text-gray-900">{scanResult.data.description}</span>
                </div>
                {scanResult.data.amount && (
                  <div className="flex justify-between pt-2 border-t border-blue-200">
                    <span className="text-gray-600 font-medium">Fixed Amount:</span>
                    <span className="font-bold text-lg text-blue-600">
                      ₦{scanResult.data.amount.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Details Form */}
            <form onSubmit={handleProcessPayment} className="space-y-4">
              {!scanResult.data.amount && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₦) *
                  </label>
                  <input
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={paymentData.payerName}
                  onChange={(e) => setPaymentData({ ...paymentData, payerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number *
                </label>
                <input
                  type="text"
                  value={paymentData.payerAccountNumber}
                  onChange={(e) => setPaymentData({ ...paymentData, payerAccountNumber: e.target.value })}
                  placeholder="Your account number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Pay Now
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!scannedData && !scanResult && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No QR code scanned yet</p>
          <p className="text-sm text-gray-500">
            Upload a QR code image or use your camera to scan payment codes
          </p>
        </div>
      )}
    </div>
  );
};

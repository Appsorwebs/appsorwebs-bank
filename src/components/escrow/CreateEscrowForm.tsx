import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, AlertCircle, DollarSign } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useEscrow } from '../../hooks/useEscrow';
import { calculateEscrowFee, getFeeInfo } from '../../services/feeCalculator';
import { motion } from 'framer-motion';

const createEscrowSchema = z.object({
  sellerId: z.string().min(1, 'Seller ID is required'),
  sellerEmail: z.string().email('Invalid seller email'),
  amount: z.number().min(1, 'Amount must be greater than 0').max(1000000, 'Amount too large'),
  currency: z.string().default('USD'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  terms: z.string().min(20, 'Terms must be at least 20 characters'),
  marketplace: z.string().optional(),
  durationDays: z.number().min(1).max(365).default(30)
});

type CreateEscrowFormData = z.infer<typeof createEscrowSchema>;

interface CreateEscrowFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateEscrowForm: React.FC<CreateEscrowFormProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const { createEscrow, loading } = useEscrow(user?.id || '');
  const [amount, setAmount] = useState<number>(0);
  const feeInfo = calculateEscrowFee(amount);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CreateEscrowFormData>({
    resolver: zodResolver(createEscrowSchema),
    defaultValues: {
      currency: 'USD',
      durationDays: 30,
      marketplace: 'other'
    }
  });

  const watchAmount = watch('amount');
  React.useEffect(() => {
    setAmount(watchAmount || 0);
  }, [watchAmount]);

  const onSubmit = async (data: CreateEscrowFormData) => {
    if (!user?.id) return;

    const result = await createEscrow({
      buyerId: user.id,
      sellerId: data.sellerId,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      terms: data.terms,
      marketplace: data.marketplace,
      durationDays: data.durationDays
    });

    if (result.success) {
      onSuccess();
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-dark-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Escrow Transaction
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Security Notice */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium">Buyer Protection Enabled</p>
              <p className="mt-1">Your funds will be held securely until the transaction is confirmed by both parties.</p>
            </div>
          </div>

          {/* Seller Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Seller Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seller Email
              </label>
              <input
                {...register('sellerEmail')}
                type="email"
                placeholder="seller@example.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
              />
              {errors.sellerEmail && (
                <p className="text-red-600 text-sm mt-1">{errors.sellerEmail.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seller ID
              </label>
              <input
                {...register('sellerId')}
                type="text"
                placeholder="Seller's unique ID or phone"
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
              />
              {errors.sellerId && (
                <p className="text-red-600 text-sm mt-1">{errors.sellerId.message}</p>
              )}
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    {...register('amount', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  />
                </div>
                {errors.amount && (
                  <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currency
                </label>
                <select
                  {...register('currency')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="NGN">NGN</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Marketplace
              </label>
              <select
                {...register('marketplace')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
              >
                <option value="other">Other / Direct Transaction</option>
                <option value="amazon">Amazon</option>
                <option value="ebay">eBay</option>
                <option value="etsy">Etsy</option>
                <option value="facebook">Facebook Marketplace</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (days)
              </label>
              <input
                {...register('durationDays', { valueAsNumber: true })}
                type="number"
                min="1"
                max="365"
                placeholder="30"
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Funds auto-release after this period if not disputed
              </p>
            </div>
          </div>

          {/* Item Description */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Item / Service Info</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <input
                {...register('description')}
                type="text"
                placeholder="What are you purchasing?"
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Terms
              </label>
              <textarea
                {...register('terms')}
                placeholder="Define the terms of this transaction (e.g., delivery method, condition requirements, etc.)"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white resize-none"
              />
              {errors.terms && (
                <p className="text-red-600 text-sm mt-1">{errors.terms.message}</p>
              )}
            </div>
          </div>

          {/* Fee Summary */}
          {amount > 0 && (
            <div className="p-4 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-dark-700 dark:to-dark-600 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Fee Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Amount to Seller:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Service Fee:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${feeInfo.fee.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-gray-300 dark:border-dark-500 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">Total to Hold:</span>
                  <span className="font-bold text-primary-600 dark:text-primary-400 text-lg">
                    ${feeInfo.total.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {getFeeInfo(amount)}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-dark-700">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={onClose}
              disabled={isSubmitting || loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={isSubmitting || loading}
            >
              Create Escrow
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

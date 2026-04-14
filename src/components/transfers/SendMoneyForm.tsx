import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Send,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Globe,
  Home,
  Mail,
  Phone,
  Building
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useTransfer } from '../../hooks/useTransfer';
import { calculateTransferFee, getTransferEstimateTime } from '../../services/transferFeeCalculator';
import { CurrencyService } from '../../services/currencyService';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const sendMoneySchema = z.object({
  transferType: z.enum(['domestic', 'international']),
  recipientName: z.string().min(2, 'Name must be at least 2 characters'),
  recipientEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  recipientPhone: z.string().min(10, 'Phone must be at least 10 digits').optional().or(z.literal('')),
  recipientBankAccount: z.string().min(10, 'Invalid account number'),
  recipientBankCode: z.string().optional(),
  recipientCountry: z.string().optional(),
  amount: z.number().min(1, 'Amount must be greater than 0').max(100000, 'Amount too large'),
  currency: z.string().default('USD'),
  targetCurrency: z.string().optional(),
  description: z.string().min(5, 'Description required').max(100),
  acceptTerms: z.boolean().refine((val) => val === true, 'You must accept terms')
});

type SendMoneyFormData = z.infer<typeof sendMoneySchema>;

interface SendMoneyFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const SendMoneyForm: React.FC<SendMoneyFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const { user } = useAuth();
  const { createTransfer, loading, validateRecipient } = useTransfer(user?.id || '');
  const [amount, setAmount] = useState(0);
  const [transferType, setTransferType] = useState<'domestic' | 'international'>('domestic');
  const [recipientValidated, setRecipientValidated] = useState(false);
  const [validatingRecipient, setValidatingRecipient] = useState(false);
  const [conversionResult, setConversionResult] = useState<any>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setValue
  } = useForm<SendMoneyFormData>({
    resolver: zodResolver(sendMoneySchema),
    defaultValues: {
      transferType: 'domestic',
      currency: 'USD',
      targetCurrency: 'USD'
    }
  });

  const watchAmount = watch('amount');
  const watchCurrency = watch('currency');
  const watchTargetCurrency = watch('targetCurrency');
  const watchAccountNumber = watch('recipientBankAccount');
  const watchEmail = watch('recipientEmail');
  const watchPhone = watch('recipientPhone');

  const feeInfo = calculateTransferFee(watchAmount || 0, transferType);
  const estimateTime = getTransferEstimateTime(transferType);

  // Handle currency conversion for international transfers
  useEffect(() => {
    if (transferType === 'international' && watchAmount > 0 && watchTargetCurrency) {
      const conversion = CurrencyService.convert(
        watchAmount,
        watchCurrency,
        watchTargetCurrency
      );
      setConversionResult(conversion);
    }
  }, [watchAmount, watchCurrency, watchTargetCurrency, transferType]);

  const handleValidateRecipient = async () => {
    try {
      setValidatingRecipient(true);
      const result = await validateRecipient(
        watchAccountNumber,
        undefined,
        watchEmail
      );

      if (result.valid) {
        setRecipientValidated(true);
        toast.success('Recipient validated!');
      } else {
        toast.error(result.message || 'Invalid recipient');
        setRecipientValidated(false);
      }
    } catch (error) {
      toast.error('Validation failed');
      setRecipientValidated(false);
    } finally {
      setValidatingRecipient(false);
    }
  };

  useEffect(() => {
    setAmount(watchAmount || 0);
  }, [watchAmount]);

  const onSubmit = async (data: SendMoneyFormData) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    if (!recipientValidated) {
      toast.error('Please validate recipient first');
      return;
    }

    const result = await createTransfer({
      recipientName: data.recipientName,
      recipientEmail: data.recipientEmail || undefined,
      recipientPhone: data.recipientPhone || undefined,
      recipientBankAccount: data.recipientBankAccount,
      recipientBankCode: data.recipientBankCode,
      recipientCountry: data.recipientCountry,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      type: data.transferType
    });

    if (result.success) {
      onSuccess?.();
    }
  };

  const currencies = CurrencyService.getSupportedCurrencies();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Transfer Type Selection */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-900 dark:text-white">
          Transfer Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label
            className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              transferType === 'domestic'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-dark-600 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              {...register('transferType')}
              value="domestic"
              onChange={(e) => {
                setTransferType(e.target.value as 'domestic' | 'international');
                setValue('transferType', 'domestic');
              }}
              className="sr-only"
            />
            <div className="flex items-center space-x-3 flex-1">
              <Home className="w-5 h-5 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Domestic</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Same country</p>
              </div>
            </div>
          </label>

          <label
            className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              transferType === 'international'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-dark-600 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              {...register('transferType')}
              value="international"
              onChange={(e) => {
                setTransferType(e.target.value as 'domestic' | 'international');
                setValue('transferType', 'international');
              }}
              className="sr-only"
            />
            <div className="flex items-center space-x-3 flex-1">
              <Globe className="w-5 h-5 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">International</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Different country</p>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Recipient Information */}
      <Card className="p-6 border border-gray-200 dark:border-dark-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Recipient Details</h3>
          {recipientValidated && (
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Verified</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recipient Name *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                {...register('recipientName')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                placeholder="Full name"
              />
            </div>
            {errors.recipientName && (
              <p className="text-red-600 text-sm mt-1">{errors.recipientName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...register('recipientEmail')}
                  type="email"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...register('recipientPhone')}
                  type="tel"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bank Account Number *
            </label>
            <input
              {...register('recipientBankAccount')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
              placeholder="10+ digit account number"
            />
            {errors.recipientBankAccount && (
              <p className="text-red-600 text-sm mt-1">{errors.recipientBankAccount.message}</p>
            )}
          </div>

          {transferType === 'international' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bank Code
                </label>
                <input
                  {...register('recipientBankCode')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  placeholder="e.g., SWIFT code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country
                </label>
                <input
                  {...register('recipientCountry')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  placeholder="e.g., UK, Nigeria"
                />
              </div>
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            className="w-full justify-center"
            onClick={handleValidateRecipient}
            loading={validatingRecipient}
            disabled={!watchAccountNumber || (!watchEmail && !watchPhone)}
          >
            {recipientValidated ? 'Recipient Verified' : 'Validate Recipient'}
          </Button>
        </div>
      </Card>

      {/* Amount & Currency */}
      <Card className="p-6 border border-gray-200 dark:border-dark-600">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Amount</h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                {...register('amount', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="1"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                placeholder="0.00"
              />
            </div>
            {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From Currency
            </label>
            <select
              {...register('currency')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
            >
              {currencies.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {transferType === 'international' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To Currency
            </label>
            <select
              {...register('targetCurrency')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
            >
              {currencies.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>
          </div>
        )}
      </Card>

      {/* Fee Breakdown */}
      {amount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-dark-700 dark:to-dark-600 border border-primary-200 dark:border-primary-800 rounded-lg"
        >
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Transfer Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Amount:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {CurrencyService.formatCurrency(amount, watchCurrency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Base Fee:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                ${feeInfo.baseFee.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Service ({(feeInfo.percentageFee / amount * 100).toFixed(2)}%):</span>
              <span className="font-medium text-gray-900 dark:text-white">
                ${feeInfo.percentageFee.toFixed(2)}
              </span>
            </div>
            <div className="border-t border-primary-300 dark:border-primary-700 pt-2 flex justify-between">
              <span className="font-semibold text-gray-900 dark:text-white">You Pay:</span>
              <span className="font-bold text-primary-600 dark:text-primary-400 text-lg">
                {CurrencyService.formatCurrency(feeInfo.totalWithFee, watchCurrency)}
              </span>
            </div>

            {conversionResult && transferType === 'international' && (
              <div className="border-t border-primary-300 dark:border-primary-700 pt-2 flex justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">Recipient Gets:</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {CurrencyService.formatCurrency(
                    conversionResult.toAmount,
                    watchTargetCurrency
                  )}
                </span>
              </div>
            )}

            <div className="pt-2 text-xs text-gray-600 dark:text-gray-400">
              Estimated delivery: {estimateTime}
            </div>
          </div>
        </motion.div>
      )}

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description *
        </label>
        <input
          {...register('description')}
          type="text"
          className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
          placeholder="Payment for..."
        />
        {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>}
      </div>

      {/* Terms */}
      <label className="flex items-start space-x-3">
        <input
          {...register('acceptTerms')}
          type="checkbox"
          className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          I agree to the{' '}
          <a href="#" className="text-primary-600 hover:underline">
            Terms of Service
          </a>{' '}
          and understand the fees
        </span>
      </label>
      {errors.acceptTerms && <p className="text-red-600 text-sm">{errors.acceptTerms.message}</p>}

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel} disabled={isSubmitting || loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          loading={isSubmitting || loading}
          disabled={!recipientValidated}
        >
          <Send className="w-4 h-4 mr-2" />
          Send Money
        </Button>
      </div>
    </form>
  );
};

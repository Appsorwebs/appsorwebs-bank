import React from 'react';
import { X, Mail, CheckCircle } from 'lucide-react';
import { ResendVerificationButton } from './ResendVerificationButton';

interface ResendVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicantId: string;
  userName?: string;
  userEmail?: string;
  onResend: (applicantId: string) => Promise<{
    success: boolean;
    message?: string;
    error?: string;
    sdkToken?: string;
  }>;
  onSuccess?: (sdkToken: string) => void;
}

/**
 * Resend IDV Verification Modal
 * Displays information and resend button for verification link
 */
export const ResendVerificationModal: React.FC<ResendVerificationModalProps> = ({
  isOpen,
  onClose,
  applicantId,
  userName,
  userEmail,
  onResend,
  onSuccess
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Resend Verification
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          {/* Description */}
          <div className="text-center space-y-3">
            <p className="text-gray-700 dark:text-gray-300">
              {userName && (
                <>
                  <strong className="block">Hello, {userName}!</strong>{' '}
                </>
              )}
              Your identity verification link has expired or is pending. We'll send you a new one to complete your verification.
            </p>

            {userEmail && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We'll send it to <strong>{userEmail}</strong>
              </p>
            )}
          </div>

          {/* Why Verify */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 text-sm">
              Why verify your identity?
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Enable full account features
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Increase transaction limits
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Comply with financial regulations
              </li>
            </ul>
          </div>

          {/* Resend Button */}
          <div>
            <ResendVerificationButton
              applicantId={applicantId}
              onResend={onResend}
              onSuccess={onSuccess}
              variant="primary"
              size="lg"
            />
          </div>

          {/* Legal Notice */}
          <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
            By verifying, you agree to our{' '}
            <a href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
              Privacy Policy
            </a>
            {' '}and{' '}
            <a href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">
              Terms of Service
            </a>
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-dark-700 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

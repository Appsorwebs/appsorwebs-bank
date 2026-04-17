import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface ResendVerificationButtonProps {
  applicantId: string;
  onResend: (applicantId: string) => Promise<{
    success: boolean;
    message?: string;
    error?: string;
    sdkToken?: string;
  }>;
  onSuccess?: (sdkToken: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
}

/**
 * Resend IDV Verification Button Component
 * Allows users to request a new verification link when pending, expired, or rejected
 */
export const ResendVerificationButton: React.FC<ResendVerificationButtonProps> = ({
  applicantId,
  onResend,
  onSuccess,
  disabled = false,
  size = 'md',
  variant = 'primary'
}) => {
  const [loading, setLoading] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [messageText, setMessageText] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-blue-500 hover:bg-blue-600 text-white',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
  };

  // Cleanup timer on unmount or cooldown completion
  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  const handleResend = async () => {
    setLoading(true);
    setShowMessage(false);

    try {
      const result = await onResend(applicantId);

      if (result.success) {
        setMessageType('success');
        setMessageText(result.message || 'Verification link resent successfully!');

        if (result.sdkToken && onSuccess) {
          onSuccess(result.sdkToken);
        }

        // Start cooldown timer (5 minutes)
        setCooldown(300);
      } else {
        setMessageType('error');
        setMessageText(result.error || 'Failed to resend verification link');
      }

      setShowMessage(true);
    } catch (error: any) {
      setMessageType('error');
      setMessageText(error.message || 'An error occurred while sending the link');
      setShowMessage(true);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = disabled || loading || cooldown > 0;
  const buttonText = cooldown > 0
    ? `Resend in ${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, '0')}`
    : 'Resend Verification Link';

  return (
    <div className="w-full">
      <button
        onClick={handleResend}
        disabled={isDisabled}
        className={`
          w-full rounded-lg font-semibold transition-colors flex items-center justify-center gap-2
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Sending...
          </>
        ) : cooldown > 0 ? (
          <>
            <RefreshCw className="w-4 h-4" />
            {buttonText}
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            {buttonText}
          </>
        )}
      </button>

      {/* Message Display */}
      {showMessage && (
        <div className={`
          mt-3 p-4 rounded-lg flex items-start gap-3
          ${messageType === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }
        `}>
          {messageType === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${
            messageType === 'success'
              ? 'text-green-800 dark:text-green-200'
              : 'text-red-800 dark:text-red-200'
          }`}>
            {messageText}
          </p>
        </div>
      )}
    </div>
  );
};

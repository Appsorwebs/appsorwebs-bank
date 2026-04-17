import { useState, useCallback, useEffect, useRef } from 'react';
import { KYCService, KYCVerification } from '../services/kycService';
import { AMLService } from '../services/amlService';

interface KYCState {
  loading: boolean;
  error: string | null;
  verification: KYCVerification | null;
  tier: 'tier_1' | 'tier_2' | 'tier_3' | null;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  sdkToken: string | null;
  transactionLimit: number;
}

/**
 * Hook for managing KYC (Know Your Customer) verification
 * Handles Onfido integration and verification status
 */
export const useKYC = (userId: string | null) => {
  const [state, setState] = useState<KYCState>({
    loading: false,
    error: null,
    verification: null,
    tier: null,
    verificationStatus: 'unverified',
    sdkToken: null,
    transactionLimit: 100000
  });

  // Prevent multiple concurrent requests
  const requestInProgress = useRef(false);

  /**
   * Initialize KYC process for new user
   */
  const initiateKYC = useCallback(
    async (firstName: string, lastName: string, email: string, phone: string) => {
      if (!userId || requestInProgress.current) return;
      requestInProgress.current = true;

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Step 1: Create Onfido applicant
        const applicantResult = await KYCService.createApplicant(
          userId,
          firstName,
          lastName,
          email,
          phone
        );

        if (!applicantResult.success) {
          throw new Error(applicantResult.error);
        }

        const applicantId = applicantResult.data!.applicant_id;

        // Step 2: Get SDK token for Onfido web SDK
        const tokenResult = await KYCService.getSDKToken(userId, applicantId);

        if (!tokenResult.success) {
          throw new Error(tokenResult.error);
        }

        setState(prev => ({
          ...prev,
          loading: false,
          sdkToken: tokenResult.data!.sdk_token
        }));
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to initiate KYC'
        }));
      } finally {
        requestInProgress.current = false;
      }
    },
    [userId]
  );

  /**
   * Get current verification status
   */
  const getVerificationStatus = useCallback(async () => {
    if (!userId || requestInProgress.current) return;
    requestInProgress.current = true;

    setState(prev => ({ ...prev, loading: true }));

    try {
      // Get KYC tier
      const tierResult = await KYCService.getUserKYCTier(userId);

      if (!tierResult.success) {
        throw new Error(tierResult.error);
      }

      const tierData = tierResult.data!;

      setState(prev => ({
        ...prev,
        loading: false,
        tier: tierData.tier,
        verificationStatus: tierData.verification_status as any,
        transactionLimit: tierData.transaction_limit
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to get verification status'
      }));
    } finally {
      requestInProgress.current = false;
    }
  }, [userId]);

  /**
   * Check if user can perform transaction
   */
  const canPerformTransaction = useCallback(
    async (amount: number) => {
      if (!userId) return { allowed: false, reason: 'User not authenticated' };

      try {
        const result = await KYCService.canPerformTransaction(userId, amount);

        if (!result.success) {
          throw new Error(result.error);
        }

        return result.data;
      } catch (error: any) {
        return {
          allowed: false,
          reason: error.message || 'Failed to verify transaction eligibility'
        };
      }
    },
    [userId]
  );

  /**
   * Load verification status on mount
   */
  useEffect(() => {
    if (userId) {
      getVerificationStatus();
    }
  }, [userId, getVerificationStatus]);

  /**
   * Handle verification completion (webhook or SDK callback)
   */
  const handleVerificationComplete = useCallback(
    async (applicantId: string) => {
      if (!userId) return;

      setState(prev => ({ ...prev, loading: true }));

      try {
        // Refresh verification status
        const result = await KYCService.getVerificationStatus(userId, applicantId);

        if (!result.success) {
          throw new Error(result.error);
        }

        const verification = result.data!;

        setState(prev => ({
          ...prev,
          loading: false,
          verification,
          verificationStatus: verification.status === 'verified' ? 'verified' : 'pending'
        }));

        // Get updated tier
        await getVerificationStatus();
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to complete verification'
        }));
      }
    },
    [userId, getVerificationStatus]
  );

  /**
   * Resend IDV verification link
   */
  const resendVerificationLink = useCallback(
    async (applicantId: string) => {
      if (!userId || requestInProgress.current) return;
      requestInProgress.current = true;

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await KYCService.resendVerificationLink(userId, applicantId);

        if (!result.success) {
          throw new Error(result.error);
        }

        setState(prev => ({
          ...prev,
          loading: false,
          sdkToken: result.data!.sdk_token,
          error: null
        }));

        return {
          success: true,
          message: result.data!.message,
          sdkToken: result.data!.sdk_token
        };
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to resend verification link';
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));
        return {
          success: false,
          error: errorMessage
        };
      } finally {
        requestInProgress.current = false;
      }
    },
    [userId]
  );

  return {
    // State
    loading: state.loading,
    error: state.error,
    verification: state.verification,
    tier: state.tier,
    verificationStatus: state.verificationStatus,
    sdkToken: state.sdkToken,
    transactionLimit: state.transactionLimit,

    // Actions
    initiateKYC,
    getVerificationStatus,
    canPerformTransaction,
    handleVerificationComplete,
    resendVerificationLink
  };
};

/**
 * Hook for AML monitoring and compliance scoring
 */
export const useAML = (userId: string | null) => {
  const [state, setState] = useState({
    loading: false,
    error: null as string | null,
    complianceScore: 100,
    complianceLevel: 'excellent' as 'excellent' | 'good' | 'fair' | 'poor' | 'critical',
    alerts: [] as any[],
    lastUpdated: new Date().toISOString()
  });

  const requestInProgress = useRef(false);

  /**
   * Get user's compliance score
   */
  const getComplianceScore = useCallback(async () => {
    if (!userId || requestInProgress.current) return;
    requestInProgress.current = true;

    setState(prev => ({ ...prev, loading: true }));

    try {
      const result = await AMLService.getUserComplianceScore(userId);

      if (!result.success) {
        throw new Error(result.error);
      }

      const scoreData = result.data!;

      setState(prev => ({
        ...prev,
        loading: false,
        complianceScore: scoreData.score,
        complianceLevel: scoreData.level,
        lastUpdated: scoreData.last_updated
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to get compliance score'
      }));
    } finally {
      requestInProgress.current = false;
    }
  }, [userId]);

  /**
   * Screen transaction before processing
   */
  const screenTransaction = useCallback(
    async (
      transactionId: string,
      amount: number,
      currency: string,
      recipientName: string,
      recipientCountry: string,
      transactionType: string
    ) => {
      if (!userId) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      try {
        const result = await AMLService.screenTransaction(
          transactionId,
          userId,
          amount,
          currency,
          recipientName,
          recipientCountry,
          transactionType
        );

        if (!result.success) {
          throw new Error(result.error);
        }

        const screening = result.data!;

        // Refresh compliance score
        await getComplianceScore();

        return {
          success: true,
          data: screening
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to screen transaction'
        };
      }
    },
    [userId, getComplianceScore]
  );

  /**
   * Load compliance score on mount
   */
  useEffect(() => {
    if (userId) {
      getComplianceScore();
      // Refresh every 5 minutes
      const interval = setInterval(getComplianceScore, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [userId, getComplianceScore]);

  return {
    // State
    loading: state.loading,
    error: state.error,
    complianceScore: state.complianceScore,
    complianceLevel: state.complianceLevel,
    alerts: state.alerts,
    lastUpdated: state.lastUpdated,

    // Actions
    getComplianceScore,
    screenTransaction
  };
};

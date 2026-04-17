import { supabase } from '../lib/supabase';

/**
 * KYC Service
 * Integrates with Onfido for identity verification
 * Stores verification results in Supabase
 */

export interface KYCVerification {
  id: string;
  user_id: string;
  onfido_applicant_id: string;
  onfido_check_id: string;
  verification_level: 'tier_1' | 'tier_2' | 'tier_3';
  status: 'pending' | 'in_progress' | 'verified' | 'rejected' | 'review_required';
  document_type: string;
  document_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  verification_result: 'clear' | 'consider' | 'reject';
  check_result: 'clear' | 'consider' | 'reject';
  verified_at: string | null;
  expires_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class KYCServiceImpl {
  /**
   * Create Onfido applicant for new verification
   */
  static async createApplicant(
    userId: string,
    firstName: string,
    lastName: string,
    email: string,
    phone: string
  ): Promise<APIResponse<{ applicant_id: string }>> {
    try {
      // Call Onfido API to create applicant
      const applicantData = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        address: {
          postcode: 'POSTCODE', // User will provide during verification
          country: 'US' // Default, user updates during verification
        }
      };

      // This would call Onfido API in real implementation
      // For now, we'll return a mock applicant ID
      const applicantId = `onfido_${userId}_${Date.now()}`;

      // Store applicant reference in Supabase
      const { error } = await supabase
        .from('kyc_verifications')
        .insert([{
          user_id: userId,
          onfido_applicant_id: applicantId,
          verification_level: 'tier_1',
          status: 'pending',
          first_name: firstName,
          last_name: lastName,
          date_of_birth: '', // Will be filled during verification
          nationality: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      return {
        success: true,
        data: { applicant_id: applicantId }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create KYC applicant'
      };
    }
  }

  /**
   * Get SDK token for Onfido web SDK
   */
  static async getSDKToken(
    userId: string,
    applicantId: string
  ): Promise<APIResponse<{ sdk_token: string }>> {
    try {
      // In production, call Onfido API
      // const response = await fetch('https://api.eu.onfido.com/v3/sdk_token', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Token token=${ONFIDO_API_TOKEN}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     applicant_id: applicantId,
      //     expiration_date: new Date(Date.now() + 24*60*60*1000).toISOString()
      //   })
      // });

      // Mock implementation
      const sdkToken = `sdk_token_${applicantId}_${Date.now()}`;

      return {
        success: true,
        data: { sdk_token: sdkToken }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get SDK token'
      };
    }
  }

  /**
   * Create check after document/selfie submission
   */
  static async createCheck(
    userId: string,
    applicantId: string,
    checkType: 'document' | 'facial_similarity'
  ): Promise<APIResponse<{ check_id: string }>> {
    try {
      // In production: Call Onfido API
      // const response = await fetch('https://api.eu.onfido.com/v3/checks', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Token token=${ONFIDO_API_TOKEN}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     applicant_id: applicantId,
      //     report_names: [checkType === 'document' ? 'document' : 'facial_similarity_photo']
      //   })
      // });

      const checkId = `check_${applicantId}_${checkType}_${Date.now()}`;

      // Update verification record
      const { error } = await supabase
        .from('kyc_verifications')
        .update({
          onfido_check_id: checkId,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('onfido_applicant_id', applicantId);

      if (error) throw error;

      return {
        success: true,
        data: { check_id: checkId }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create check'
      };
    }
  }

  /**
   * Get verification status from Onfido
   */
  static async getVerificationStatus(
    userId: string,
    applicantId: string
  ): Promise<APIResponse<KYCVerification>> {
    try {
      // Get from Supabase
      const { data, error } = await supabase
        .from('kyc_verifications')
        .select('*')
        .eq('onfido_applicant_id', applicantId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as KYCVerification
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get verification status'
      };
    }
  }

  /**
   * Handle Onfido webhook callback
   * Called when Onfido completes verification check
   */
  static async handleWebhookCallback(
    payload: {
      payload: {
        applicant_id: string;
        check_id: string;
        report_ids: string[];
        status: 'complete' | 'pending';
        result: 'clear' | 'consider' | 'reject';
      }
    }
  ): Promise<APIResponse<void>> {
    try {
      const { applicant_id, check_id, result } = payload.payload;

      // Get user ID from applicant ID (stored reference)
      const { data: verification, error: fetchError } = await supabase
        .from('kyc_verifications')
        .select('user_id')
        .eq('onfido_applicant_id', applicant_id)
        .single();

      if (fetchError) throw fetchError;

      // Determine verification level based on result
      let verificationLevel: 'tier_1' | 'tier_2' | 'tier_3' = 'tier_1';
      let status: 'verified' | 'rejected' | 'review_required' = 'review_required';

      if (result === 'clear') {
        status = 'verified';
        verificationLevel = 'tier_2'; // Basic KYC cleared
      } else if (result === 'reject') {
        status = 'rejected';
      } else {
        status = 'review_required';
      }

      // Update verification record
      const { error: updateError } = await supabase
        .from('kyc_verifications')
        .update({
          onfido_check_id: check_id,
          status: status,
          verification_result: result,
          check_result: result,
          verified_at: status === 'verified' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('onfido_applicant_id', applicant_id);

      if (updateError) throw updateError;

      // Update user's KYC status in user_profiles
      if (status === 'verified') {
        await supabase
          .from('user_profiles')
          .update({
            kyc_status: 'verified',
            kyc_verified_at: new Date().toISOString()
          })
          .eq('user_id', verification.user_id);
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to process webhook'
      };
    }
  }

  /**
   * Get user's current KYC tier
   */
  static async getUserKYCTier(userId: string): Promise<APIResponse<{
    tier: 'tier_1' | 'tier_2' | 'tier_3';
    verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
    transaction_limit: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('kyc_status, kyc_verified_at')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      // Determine tier and limits
      let tier: 'tier_1' | 'tier_2' | 'tier_3' = 'tier_1';
      let transactionLimit = 100000; // Default Tier 1 limit

      if (data?.kyc_status === 'verified') {
        tier = 'tier_2';
        transactionLimit = 10000000; // Tier 2 limit
      }

      return {
        success: true,
        data: {
          tier,
          verification_status: data?.kyc_status || 'unverified',
          transaction_limit: transactionLimit
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get KYC tier'
      };
    }
  }

  /**
   * Verify user can perform transaction based on KYC tier
   */
  static async canPerformTransaction(
    userId: string,
    amount: number
  ): Promise<APIResponse<{
    allowed: boolean;
    tier: string;
    limit: number;
    reason?: string;
  }>> {
    try {
      const tierResponse = await this.getUserKYCTier(userId);
      if (!tierResponse.success) throw new Error(tierResponse.error);

      const tier = tierResponse.data!;
      const allowed = amount <= tier.transaction_limit;

      return {
        success: true,
        data: {
          allowed,
          tier: tier.tier,
          limit: tier.transaction_limit,
          reason: !allowed ? `Amount exceeds ${tier.tier} limit of ${tier.transaction_limit}` : undefined
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to verify transaction eligibility'
      };
    }
  }

  /**
   * Resend IDV verification link (regenerates SDK token)
   * Available for pending, expired, and rejected verifications
   */
  static async resendVerificationLink(
    userId: string,
    applicantId: string
  ): Promise<APIResponse<{ sdk_token: string; message: string }>> {
    try {
      // Get current verification status
      const { data: verification, error: fetchError } = await supabase
        .from('kyc_verifications')
        .select('status, updated_at, created_at')
        .eq('onfido_applicant_id', applicantId)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;
      if (!verification) throw new Error('Verification record not found');

      // Check if resend is allowed for this status
      const allowedStatuses = ['pending', 'in_progress', 'rejected', 'review_required'];
      if (!allowedStatuses.includes(verification.status)) {
        return {
          success: false,
          error: `Cannot resend verification link for ${verification.status} status. Only available for pending, in-progress, rejected, or review-required verifications.`
        };
      }

      // Check if 24 hours have passed since last update (minimum resend interval)
      const lastUpdate = new Date(verification.updated_at).getTime();
      const now = new Date().getTime();
      const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);

      // Allow resend if status is rejected (always) or if 24 hours have passed
      if (verification.status !== 'rejected' && hoursSinceUpdate < 24) {
        const remainingHours = Math.ceil(24 - hoursSinceUpdate);
        return {
          success: false,
          error: `Verification link can be resent in ${remainingHours} hour(s)`
        };
      }

      // Regenerate SDK token
      const sdkTokenResponse = await this.getSDKToken(userId, applicantId);
      if (!sdkTokenResponse.success) throw new Error(sdkTokenResponse.error);

      const newSdkToken = sdkTokenResponse.data!.sdk_token;

      // Update verification record to indicate resend
      const { error: updateError } = await supabase
        .from('kyc_verifications')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('onfido_applicant_id', applicantId);

      if (updateError) throw updateError;

      // Log resend action in audit log
      await supabase
        .from('kyc_audit_log')
        .insert([{
          user_id: userId,
          action: 'resend_verification_link',
          status: 'pending',
          reason: `Resend verification link for applicant ${applicantId}`
        }]);

      return {
        success: true,
        data: {
          sdk_token: newSdkToken,
          message: 'Verification link has been resent successfully. Please check your email or use the link below to complete verification.'
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to resend verification link'
      };
    }
  }

  /**
   * Create database tables for KYC (run once)
   */
  static async initializeTables(): Promise<APIResponse<void>> {
    try {
      // These should already exist from migrations, but this is reference
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS kyc_verifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          onfido_applicant_id VARCHAR(255) NOT NULL UNIQUE,
          onfido_check_id VARCHAR(255),
          verification_level VARCHAR(20) NOT NULL DEFAULT 'tier_1',
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          document_type VARCHAR(100),
          document_number VARCHAR(100),
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          date_of_birth DATE,
          nationality VARCHAR(100),
          verification_result VARCHAR(20),
          check_result VARCHAR(20),
          verified_at TIMESTAMP,
          expires_at TIMESTAMP,
          rejection_reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS kyc_audit_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id),
          action VARCHAR(100) NOT NULL,
          status VARCHAR(50) NOT NULL,
          reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(50) DEFAULT 'unverified';
        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP;
      `;

      // Note: In real implementation, would use Supabase migrations instead
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to initialize tables'
      };
    }
  }
}

export const KYCService = KYCServiceImpl;

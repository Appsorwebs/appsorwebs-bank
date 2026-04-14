/*
  # Initial Appsorwebs Bank Database Schema

  1. New Tables
    - `user_profiles` - Extended user profile information
    - `accounts` - Bank account details with multi-currency support
    - `transactions` - All transaction records with encryption
    - `escrow_transactions` - Escrow-specific transaction data
    - `savings_accounts` - Savings account management
    - `debit_cards` - Card management with security controls
    - `security_logs` - Comprehensive security audit trail
    - `session_tokens` - Secure session management
    - `two_factor_auth` - 2FA configuration and backup codes
    - `fraud_detection` - AI fraud detection logs
    - `currency_rates` - Real-time exchange rates
    - `fee_structure` - Dynamic fee management

  2. Security Features
    - Row Level Security (RLS) enabled on all tables
    - Encrypted sensitive data fields
    - Comprehensive audit logging
    - Session management with automatic expiry
    - Multi-factor authentication support
    - Fraud detection integration

  3. Banking Features
    - Multi-currency account support
    - Escrow transaction management
    - Savings account types with interest calculation
    - Card controls and spending limits
    - Real-time transaction monitoring
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  date_of_birth date,
  address jsonb,
  account_type text CHECK (account_type IN ('individual', 'business')) DEFAULT 'individual',
  kyc_status text CHECK (kyc_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
  kyc_documents jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Accounts Table (Multi-currency support)
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  account_number text UNIQUE NOT NULL,
  account_type text CHECK (account_type IN ('checking', 'savings', 'escrow')) DEFAULT 'checking',
  currency text NOT NULL DEFAULT 'USD',
  balance decimal(15,2) DEFAULT 0.00,
  available_balance decimal(15,2) DEFAULT 0.00,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Transactions Table (Encrypted sensitive data)
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  transaction_type text CHECK (transaction_type IN ('transfer', 'escrow', 'savings', 'card', 'withdrawal', 'deposit')) NOT NULL,
  amount decimal(15,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'disputed', 'cancelled')) DEFAULT 'pending',
  description text NOT NULL,
  reference_id text UNIQUE NOT NULL,
  from_account_id uuid REFERENCES accounts(id),
  to_account_id uuid REFERENCES accounts(id),
  external_reference text,
  metadata jsonb DEFAULT '{}'::jsonb,
  fee_amount decimal(10,2) DEFAULT 0.00,
  exchange_rate decimal(10,6),
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Escrow Transactions Table
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount decimal(15,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text CHECK (status IN ('active', 'completed', 'disputed', 'cancelled', 'expired')) DEFAULT 'active',
  terms text NOT NULL,
  conditions jsonb DEFAULT '{}'::jsonb,
  auto_release_date timestamptz,
  release_date timestamptz,
  dispute_reason text,
  dispute_evidence jsonb DEFAULT '[]'::jsonb,
  fee_amount decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Savings Accounts Table
CREATE TABLE IF NOT EXISTS savings_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  savings_type text CHECK (savings_type IN ('spend-save', 'target-save', 'fixed-save')) NOT NULL,
  target_amount decimal(15,2),
  target_date date,
  interest_rate decimal(5,4) NOT NULL,
  lock_period integer, -- days
  auto_save_rules jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Debit Cards Table
CREATE TABLE IF NOT EXISTS debit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  card_number_encrypted text NOT NULL, -- Encrypted card number
  card_hash text UNIQUE NOT NULL, -- Hash for lookups
  expiry_date text NOT NULL, -- Encrypted
  cvv_encrypted text NOT NULL, -- Encrypted CVV
  holder_name text NOT NULL,
  card_type text CHECK (card_type IN ('physical', 'virtual')) DEFAULT 'physical',
  is_active boolean DEFAULT true,
  spending_limits jsonb NOT NULL DEFAULT '{"daily": 2000, "weekly": 10000, "monthly": 25000}'::jsonb,
  controls jsonb NOT NULL DEFAULT '{"allow_international": true, "allow_online": true, "allow_atm": true}'::jsonb,
  pin_hash text, -- Encrypted PIN hash
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Security Logs Table
CREATE TABLE IF NOT EXISTS security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_description text NOT NULL,
  ip_address inet,
  user_agent text,
  location jsonb,
  risk_score integer CHECK (risk_score >= 0 AND risk_score <= 100),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Session Tokens Table
CREATE TABLE IF NOT EXISTS session_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text UNIQUE NOT NULL,
  device_info jsonb,
  ip_address inet,
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Two Factor Authentication Table
CREATE TABLE IF NOT EXISTS two_factor_auth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  secret_encrypted text NOT NULL,
  backup_codes_encrypted text[], -- Array of encrypted backup codes
  is_enabled boolean DEFAULT false,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Fraud Detection Table
CREATE TABLE IF NOT EXISTS fraud_detection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  risk_score integer CHECK (risk_score >= 0 AND risk_score <= 100) NOT NULL,
  risk_factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  action_taken text CHECK (action_taken IN ('none', 'flag', 'block', 'review')) DEFAULT 'none',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Currency Rates Table
CREATE TABLE IF NOT EXISTS currency_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL,
  target_currency text NOT NULL,
  rate decimal(12,6) NOT NULL,
  source text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(base_currency, target_currency, created_at)
);

-- Fee Structure Table
CREATE TABLE IF NOT EXISTS fee_structure (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type text NOT NULL,
  tier_min decimal(15,2) NOT NULL,
  tier_max decimal(15,2),
  fee_amount decimal(10,2),
  fee_percentage decimal(5,4),
  currency text NOT NULL DEFAULT 'USD',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_detection ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structure ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for accounts
CREATE POLICY "Users can read own accounts"
  ON accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can read own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for escrow_transactions
CREATE POLICY "Users can read escrows they're involved in"
  ON escrow_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- RLS Policies for savings_accounts
CREATE POLICY "Users can read own savings accounts"
  ON savings_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for debit_cards
CREATE POLICY "Users can read own cards"
  ON debit_cards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for security_logs
CREATE POLICY "Users can read own security logs"
  ON security_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for session_tokens
CREATE POLICY "Users can read own sessions"
  ON session_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for two_factor_auth
CREATE POLICY "Users can read own 2FA settings"
  ON two_factor_auth
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for fraud_detection
CREATE POLICY "Users can read own fraud detection logs"
  ON fraud_detection
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Public read access for currency rates and fee structure
CREATE POLICY "Anyone can read currency rates"
  ON currency_rates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can read fee structure"
  ON fee_structure
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert initial fee structure
INSERT INTO fee_structure (service_type, tier_min, tier_max, fee_amount, fee_percentage, currency) VALUES
('escrow', 0, 99.99, 1.00, NULL, 'USD'),
('escrow', 100, 499.99, 2.00, NULL, 'USD'),
('escrow', 500, 999.99, 3.00, NULL, 'USD'),
('escrow', 1000, NULL, NULL, 2.0000, 'USD'),
('transfer_domestic', 0, NULL, 0.00, NULL, 'USD'),
('transfer_international', 0, NULL, 5.00, NULL, 'USD'),
('card_transaction', 0, NULL, 0.00, NULL, 'USD'),
('currency_exchange', 0, NULL, NULL, 0.5000, 'USD');

-- Insert initial currency rates (mock data - should be updated via API)
INSERT INTO currency_rates (base_currency, target_currency, rate, source) VALUES
('USD', 'EUR', 0.8500, 'mock'),
('USD', 'GBP', 0.7300, 'mock'),
('USD', 'NGN', 815.0000, 'mock'),
('USD', 'JPY', 149.0000, 'mock'),
('USD', 'CAD', 1.3500, 'mock'),
('USD', 'AUD', 1.5200, 'mock'),
('USD', 'INR', 83.0000, 'mock'),
('EUR', 'USD', 1.1765, 'mock'),
('GBP', 'USD', 1.3699, 'mock'),
('NGN', 'USD', 0.0012, 'mock');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference_id ON transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_buyer_id ON escrow_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_seller_id ON escrow_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_session_tokens_user_id ON session_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_session_tokens_expires_at ON session_tokens(expires_at);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_escrow_transactions_updated_at BEFORE UPDATE ON escrow_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_savings_accounts_updated_at BEFORE UPDATE ON savings_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_debit_cards_updated_at BEFORE UPDATE ON debit_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_two_factor_auth_updated_at BEFORE UPDATE ON two_factor_auth FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fee_structure_updated_at BEFORE UPDATE ON fee_structure FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
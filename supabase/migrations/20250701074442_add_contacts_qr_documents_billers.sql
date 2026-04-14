/*
  # Additional Appsorwebs Bank Database Schema

  This migration adds tables for:
  1. Contacts management with bank accounts
  2. QR Code payments and transactions
  3. Documents and bank statements
  4. Billers reference data

  All tables are RLS-enabled for security.
*/

-- Enable necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- CONTACTS SERVICE TABLES
-- ============================================

-- Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  email varchar(100),
  phone_number varchar(20),
  category varchar(20) NOT NULL CHECK (category IN ('personal', 'business', 'government', 'family', 'other')),
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Contact Bank Accounts (for domestic and international transfers)
CREATE TABLE IF NOT EXISTS contact_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  account_number varchar(20) NOT NULL,
  bank_name varchar(100) NOT NULL,
  account_name varchar(100) NOT NULL,
  country_code varchar(2) NOT NULL,
  account_type varchar(20) DEFAULT 'checking',
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- QR CODE PAYMENT TABLES
-- ============================================

-- QR Payments (generated QR codes for receiving payments)
CREATE TABLE IF NOT EXISTS qr_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES auth.users(id),
  merchant_name varchar(100) NOT NULL,
  amount decimal(15,2),
  description text NOT NULL,
  qr_code_data text NOT NULL,
  status varchar(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- QR Transactions (payments made via QR codes)
CREATE TABLE IF NOT EXISTS qr_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_payment_id uuid NOT NULL REFERENCES qr_payments(id) ON DELETE CASCADE,
  payer_id uuid NOT NULL REFERENCES auth.users(id),
  amount decimal(15,2) NOT NULL,
  status varchar(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description text,
  reference_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- DOCUMENTS & STATEMENTS TABLES
-- ============================================

-- Documents (uploaded receipts, invoices, etc.)
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type varchar(30) NOT NULL CHECK (document_type IN ('statement', 'receipt', 'invoice', 'contract', 'other')),
  title varchar(255) NOT NULL,
  file_size integer NOT NULL,
  storage_path varchar(255) NOT NULL,
  mime_type varchar(50),
  period varchar(50),
  uploaded_at timestamptz DEFAULT now()
);

-- Bank Statements (generated monthly statements)
CREATE TABLE IF NOT EXISTS bank_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_number varchar(20) NOT NULL,
  account_type varchar(20) NOT NULL,
  currency varchar(3) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  opening_balance decimal(15,2) NOT NULL,
  closing_balance decimal(15,2) NOT NULL,
  total_credit decimal(15,2) NOT NULL DEFAULT 0,
  total_debit decimal(15,2) NOT NULL DEFAULT 0,
  transaction_count integer NOT NULL DEFAULT 0,
  file_url varchar(255),
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- BILLERS REFERENCE TABLE
-- ============================================

-- Billers (utilities, services, etc. that can be paid)
CREATE TABLE IF NOT EXISTS billers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code varchar(2) NOT NULL,
  name varchar(100) NOT NULL,
  biller_type varchar(50) NOT NULL CHECK (biller_type IN ('electricity', 'water', 'gas', 'internet', 'phone', 'insurance', 'education', 'entertainment', 'other')),
  icon_url varchar(255),
  category varchar(50),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE billers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Contacts RLS Policies
CREATE POLICY "Users can read own contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
  ON contacts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Contact Bank Accounts RLS Policies (inherited from contacts)
CREATE POLICY "Users can read own contact bank accounts"
  ON contact_bank_accounts
  FOR SELECT
  TO authenticated
  USING (
    contact_id IN (
      SELECT id FROM contacts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own contact bank accounts"
  ON contact_bank_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    contact_id IN (
      SELECT id FROM contacts WHERE user_id = auth.uid()
    )
  );

-- QR Payments RLS Policies
CREATE POLICY "Merchants can read own QR payments"
  ON qr_payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can insert own QR payments"
  ON qr_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Merchants can update own QR payments"
  ON qr_payments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = merchant_id);

-- QR Transactions RLS Policies
CREATE POLICY "Users can read own QR transactions"
  ON qr_transactions
  FOR SELECT
  TO authenticated
  USING (
    payer_id = auth.uid() OR
    qr_payment_id IN (
      SELECT id FROM qr_payments WHERE merchant_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert QR transactions"
  ON qr_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = payer_id);

-- Documents RLS Policies
CREATE POLICY "Users can read own documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Bank Statements RLS Policies
CREATE POLICY "Users can read own bank statements"
  ON bank_statements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank statements"
  ON bank_statements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Billers RLS Policies (public read for authenticated users)
CREATE POLICY "Authenticated users can read billers"
  ON billers
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_category ON contacts(category);
CREATE INDEX IF NOT EXISTS idx_contact_bank_accounts_contact_id ON contact_bank_accounts(contact_id);
CREATE INDEX IF NOT EXISTS idx_qr_payments_merchant_id ON qr_payments(merchant_id);
CREATE INDEX IF NOT EXISTS idx_qr_payments_created_at ON qr_payments(created_at);
CREATE INDEX IF NOT EXISTS idx_qr_transactions_qr_payment_id ON qr_transactions(qr_payment_id);
CREATE INDEX IF NOT EXISTS idx_qr_transactions_payer_id ON qr_transactions(payer_id);
CREATE INDEX IF NOT EXISTS idx_qr_transactions_reference_id ON qr_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_bank_statements_user_id ON bank_statements(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_statements_created_at ON bank_statements(created_at);
CREATE INDEX IF NOT EXISTS idx_billers_country_code ON billers(country_code);
CREATE INDEX IF NOT EXISTS idx_billers_biller_type ON billers(biller_type);

-- ============================================
-- CREATE TRIGGER FUNCTIONS FOR TIMESTAMPS
-- ============================================

-- Use existing update_updated_at_column function if available, otherwise create it
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for tables with updated_at column
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_qr_payments_updated_at BEFORE UPDATE ON qr_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_qr_transactions_updated_at BEFORE UPDATE ON qr_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_statements_updated_at BEFORE UPDATE ON bank_statements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billers_updated_at BEFORE UPDATE ON billers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

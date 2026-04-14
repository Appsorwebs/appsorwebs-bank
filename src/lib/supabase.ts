import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

// Optimized security utilities
export const securityUtils = {
  generateReferenceId: (prefix = 'TXN') => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`.toUpperCase();
  },

  validateAmount: (amount) => amount > 0 && amount <= 1000000 && Number.isFinite(amount),

  calculateRiskScore: (transaction, userHistory = []) => {
    let riskScore = 0;
    if (transaction.amount > 10000) riskScore += 20;
    if (transaction.amount > 50000) riskScore += 30;
    
    const recentTransactions = userHistory.filter(t => 
      new Date(t.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    if (recentTransactions.length > 10) riskScore += 25;
    
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) riskScore += 10;
    
    return Math.min(riskScore, 100);
  }
};

// Streamlined audit logger
export const auditLogger = {
  log: async (userId, eventType, description, metadata = {}) => {
    try {
      await supabase.from('security_logs').insert({
        user_id: userId,
        event_type: eventType,
        event_description: description,
        metadata
      });
    } catch (err) {
      console.error('Audit logging failed:', err);
    }
  }
};
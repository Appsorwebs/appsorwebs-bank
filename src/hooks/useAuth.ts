import { useState, useEffect } from 'react';
import { supabase, auditLogger } from '../lib/supabase';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const [authState, setAuthState] = useState({
    user: null,
    session: null,
    loading: true,
    profile: null
  });

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (mounted) {
        if (session?.user) {
          await loadUserProfile(session.user.id);
          await auditLogger.log(session.user.id, 'session_restored', 'User session restored');
        }
        setAuthState(prev => ({ ...prev, user: session?.user || null, session, loading: false }));
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (session?.user) {
          await loadUserProfile(session.user.id);
          if (event === 'SIGNED_IN') {
            await auditLogger.log(session.user.id, 'login', 'User signed in successfully');
            toast.success('Welcome back!');
          }
        }

        if (event === 'SIGNED_OUT') {
          toast.success('Signed out successfully');
        }

        setAuthState(prev => ({
          ...prev,
          user: session?.user || null,
          session,
          loading: false
        }));
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId) => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      setAuthState(prev => ({ ...prev, profile }));
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const signUp = async (email, password, userData) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            account_type: userData.accountType || 'individual'
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        await supabase.from('user_profiles').insert({
          user_id: data.user.id,
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: email,
          account_type: userData.accountType || 'individual',
          phone: userData.phone || null
        });

        const accountNumber = `ASW${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await supabase.from('accounts').insert({
          user_id: data.user.id,
          account_number: accountNumber,
          account_type: 'checking',
          currency: 'USD',
          balance: 0,
          available_balance: 0
        });

        await auditLogger.log(data.user.id, 'registration', 'New user registered', {
          email,
          account_type: userData.accountType
        });

        toast.success('Account created successfully!');
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      toast.error(error.message || 'Failed to create account');
      return { data: null, error };
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  const signIn = async (email, password) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        await supabase
          .from('user_profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('user_id', data.user.id);

        await auditLogger.log(data.user.id, 'login', 'User signed in successfully', {
          email
        });
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Failed to sign in');
      
      await auditLogger.log('unknown', 'login_failed', 'Failed login attempt', {
        email,
        error: error.message
      });

      return { data: null, error };
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  const signOut = async () => {
    try {
      if (authState.user) {
        await auditLogger.log(authState.user.id, 'logout', 'User signed out');
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setAuthState({
        user: null,
        session: null,
        loading: false,
        profile: null
      });

      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
      return { error };
    }
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!authState.user
  };
};
import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { motion, AnimatePresence } from 'framer-motion';
import { Banknote, Globe, Shield, Users } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-secondary-900 to-accent-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white space-y-8"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-xl flex items-center justify-center">
              <Banknote className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Appsorwebs Bank</h1>
              <p className="text-primary-200">Trust-First Global Banking</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight">
              Secure Global Banking
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400">
                Built for Trust
              </span>
            </h2>

            <p className="text-xl text-gray-300 leading-relaxed">
              Experience the future of banking with our trust-first approach. 
              Secure escrow services, global transfers, and AI-powered insights 
              all in one platform.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Bank-Grade Security</h3>
                  <p className="text-sm text-gray-400">256-bit encryption & MFA</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-secondary-500/20 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-secondary-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Global Reach</h3>
                  <p className="text-sm text-gray-400">150+ countries supported</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-accent-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Trusted by Millions</h3>
                  <p className="text-sm text-gray-400">1M+ active users</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Transparent Fees</h3>
                  <p className="text-sm text-gray-400">No hidden charges</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="font-semibold mb-4">Global Support</h3>
            <div className="space-y-2 text-sm">
              <p>📞 +234 809 077 5252</p>
              <p>✉️ bank@appsorwebs.com</p>
              <p className="text-primary-400 font-medium">24/7 Available</p>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Auth Forms */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center"
        >
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <LoginForm onToggleMode={() => setIsLogin(false)} />
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <RegisterForm onToggleMode={() => setIsLogin(true)} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};
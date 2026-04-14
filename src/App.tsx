import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileMenu } from './components/layout/MobileMenu';
import { Dashboard } from './components/dashboard/Dashboard';
import { EscrowDashboard } from './components/escrow/EscrowDashboard';
import { TransfersPage } from './components/transfers/TransfersPage';
import { BillPaymentPage } from './components/bills/BillPaymentPage';
import { ContactsManager } from './components/contacts/ContactsManager';
import { SavingsDashboard } from './components/savings/SavingsDashboard';
import { CardsDashboard } from './components/cards/CardsDashboard';
import { QRPaymentPage } from './pages/QRPaymentPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { motion } from 'framer-motion';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-lg"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create-escrow':
        setActiveTab('escrow');
        break;
      case 'add-savings':
        setActiveTab('savings');
        break;
      case 'request-card':
        setActiveTab('cards');
        break;
      default:
        console.log('Action:', action);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onActionClick={handleQuickAction} />;
      case 'escrow':
        return <EscrowDashboard />;
      case 'savings':
        return <SavingsDashboard />;
      case 'cards':
        return <CardsDashboard />;
      case 'transfers':
        return <TransfersPage />;
      case 'bills':
        return <BillPaymentPage />;
      case 'contacts':
        return <ContactsManager />;
      case 'qr':
        return <QRPaymentPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'documents':
        return <DocumentsPage />;
      case 'settings':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage account preferences, security settings, and notifications.
            </p>
          </div>
        );
      case 'help':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Help & Support
            </h1>
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-dark-700 dark:to-dark-600 rounded-xl p-6 border border-primary-200 dark:border-primary-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
              <div className="space-y-3 text-gray-600 dark:text-gray-400">
                <div>
                  <p className="font-medium">Nigeria Office:</p>
                  <p>Suit C33 Danziyal Plaza</p>
                  <p>Olusegun Obasanjo Way</p>
                  <p>Central Business Area</p>
                  <p>Nigeria, 900211</p>
                </div>
                <div>
                  <p className="font-medium">USA Office:</p>
                  <p>14100 Chadron Ave, Apt 235</p>
                  <p>Hawthorne, CA 90250</p>
                </div>
                <div>
                  <p className="font-medium">Contact:</p>
                  <p>📞 WhatsApp: +234 809 077 5252</p>
                  <p>📧 Email: bank@appsorwebs.com</p>
                  <p className="text-primary-600 dark:text-primary-400 font-medium">24/7 Global Support Available</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard onActionClick={handleQuickAction} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 transition-colors duration-300">
      <Header onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="hidden md:block">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        <motion.main
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-dark-950 dark:via-dark-900 dark:to-dark-800"
        >
          {renderContent()}
        </motion.main>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg, #ffffff)',
              color: 'var(--toast-color, #000000)',
              border: '1px solid var(--toast-border, #e5e7eb)',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
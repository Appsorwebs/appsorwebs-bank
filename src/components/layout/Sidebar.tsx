import React from 'react';
import {
  Home,
  Shield,
  PiggyBank,
  CreditCard,
  TrendingUp,
  Users,
  Settings,
  HelpCircle,
  FileText,
  ArrowUpDown,
  Zap,
  QrCode
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'escrow', label: 'Escrow Services', icon: Shield },
  { id: 'transfers', label: 'Transfers', icon: ArrowUpDown },
  { id: 'bills', label: 'Bill Payments', icon: Zap },
  { id: 'savings', label: 'Savings & Investments', icon: PiggyBank },
  { id: 'cards', label: 'Debit Cards', icon: CreditCard },
  { id: 'qr', label: 'QR Code Payments', icon: QrCode },
  { id: 'analytics', label: 'AI Insights', icon: TrendingUp },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help & Support', icon: HelpCircle },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <aside className="w-64 bg-white dark:bg-dark-800/80 backdrop-blur-sm border-r border-gray-200 dark:border-dark-700 h-full overflow-y-auto">
      <nav className="p-4 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200
                ${isActive 
                  ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white'
                }
              `}
              whileHover={{ x: isActive ? 0 : 4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
              <span className="font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>
      
      {/* Contact Info */}
      <div className="p-4 mt-8 border-t border-gray-200 dark:border-dark-700">
        <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-dark-700 dark:to-dark-600 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
            Global Support
          </h4>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p>📞 +234 809 077 5252</p>
            <p>✉️ bank@appsorwebs.com</p>
            <p className="text-primary-600 dark:text-primary-400 font-medium">
              24/7 Available
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
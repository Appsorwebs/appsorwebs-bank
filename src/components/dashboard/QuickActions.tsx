import React from 'react';
import { 
  Send, 
  Shield, 
  Plus, 
  ArrowUpDown,
  Smartphone,
  TrendingUp
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';

interface QuickActionProps {
  onActionClick: (action: string) => void;
}

const quickActions = [
  { 
    id: 'send-money', 
    label: 'Send Money', 
    icon: Send, 
    color: 'from-primary-600 to-primary-700',
    description: 'Transfer funds globally'
  },
  { 
    id: 'create-escrow', 
    label: 'Create Escrow', 
    icon: Shield, 
    color: 'from-secondary-600 to-secondary-700',
    description: 'Secure transaction'
  },
  { 
    id: 'add-savings', 
    label: 'Start Saving', 
    icon: Plus, 
    color: 'from-accent-600 to-accent-700',
    description: 'Open savings account'
  },
  { 
    id: 'exchange', 
    label: 'Exchange', 
    icon: ArrowUpDown, 
    color: 'from-purple-600 to-purple-700',
    description: 'Convert currencies'
  },
  { 
    id: 'request-card', 
    label: 'Request Card', 
    icon: Smartphone, 
    color: 'from-green-600 to-green-700',
    description: 'Virtual or physical'
  },
  { 
    id: 'invest', 
    label: 'Invest', 
    icon: TrendingUp, 
    color: 'from-indigo-600 to-indigo-700',
    description: 'Grow your wealth'
  }
];

export const QuickActions: React.FC<QuickActionProps> = ({ onActionClick }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Button
                variant="ghost"
                className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-gray-50 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-600 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200"
                onClick={() => onActionClick(action.id)}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {action.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {action.description}
                  </p>
                </div>
              </Button>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
};
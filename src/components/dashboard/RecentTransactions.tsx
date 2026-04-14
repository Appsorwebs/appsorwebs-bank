import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Shield, 
  PiggyBank,
  CreditCard,
  Download
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Transaction } from '../../types';
import { motion } from 'framer-motion';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const getTransactionIcon = (type: Transaction['type']) => {
  switch (type) {
    case 'escrow': return Shield;
    case 'savings': return PiggyBank;
    case 'card': return CreditCard;
    default: return ArrowUpRight;
  }
};

const getTransactionColor = (type: Transaction['type'], amount: number) => {
  if (type === 'escrow') return 'text-secondary-600 dark:text-secondary-400';
  if (type === 'savings') return 'text-accent-600 dark:text-accent-400';
  if (amount < 0) return 'text-red-600 dark:text-red-400';
  return 'text-green-600 dark:text-green-400';
};

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Transactions
        </h3>
        <motion.button
          className="text-primary-600 dark:text-primary-400 text-sm font-medium flex items-center space-x-1 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>View All</span>
          <ArrowUpRight className="w-4 h-4" />
        </motion.button>
      </div>
      
      <div className="space-y-4">
        {transactions.slice(0, 5).map((transaction, index) => {
          const Icon = getTransactionIcon(transaction.type);
          const isOutgoing = transaction.amount < 0;
          const displayAmount = Math.abs(transaction.amount);
          
          return (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors duration-200 cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                transaction.type === 'escrow' ? 'from-secondary-600 to-secondary-700' :
                transaction.type === 'savings' ? 'from-accent-600 to-accent-700' :
                isOutgoing ? 'from-red-600 to-red-700' : 'from-green-600 to-green-700'
              } flex items-center justify-center shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {transaction.description}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    transaction.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    transaction.status === 'disputed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {transaction.status}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`text-sm font-semibold ${getTransactionColor(transaction.type, transaction.amount)}`}>
                  {isOutgoing ? '-' : '+'}{transaction.currency} {displayAmount.toLocaleString()}
                </p>
                {transaction.fromUser && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    from {transaction.fromUser}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-600">
        <motion.button
          className="w-full flex items-center justify-center space-x-2 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Download className="w-4 h-4" />
          <span>Download Statement</span>
        </motion.button>
      </div>
    </Card>
  );
};
import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  gradient?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  gradient = 'from-primary-600 to-secondary-600'
}) => {
  const changeColor = changeType === 'positive' ? 'text-green-600 dark:text-green-400' :
                     changeType === 'negative' ? 'text-red-600 dark:text-red-400' :
                     'text-gray-600 dark:text-gray-400';

  return (
    <Card hover className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <motion.p 
            className="text-2xl font-bold text-gray-900 dark:text-white mt-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {value}
          </motion.p>
          <p className={`text-sm mt-1 ${changeColor}`}>
            {change}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );
};
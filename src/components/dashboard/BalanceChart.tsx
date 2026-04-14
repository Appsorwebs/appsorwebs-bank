import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';

const mockChartData = [
  { month: 'Jan', balance: 12500, savings: 2400, escrow: 5600 },
  { month: 'Feb', balance: 15200, savings: 3100, escrow: 7200 },
  { month: 'Mar', balance: 18900, savings: 3800, escrow: 8900 },
  { month: 'Apr', balance: 22100, savings: 4500, escrow: 10200 },
  { month: 'May', balance: 25800, savings: 5200, escrow: 11800 },
  { month: 'Jun', balance: 28500, savings: 5900, escrow: 13100 },
];

export const BalanceChart: React.FC = () => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Balance Overview
        </h3>
        <select className="text-sm border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-1 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option>Last 6 months</option>
          <option>Last year</option>
          <option>All time</option>
        </select>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="month" 
              className="text-gray-600 dark:text-gray-400"
              fontSize={12}
            />
            <YAxis 
              className="text-gray-600 dark:text-gray-400"
              fontSize={12}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(17, 24, 39, 0.8)',
                border: 'none',
                borderRadius: '8px',
                color: 'white'
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
            />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="savings" 
              stroke="#14B8A6" 
              strokeWidth={2}
              dot={{ fill: '#14B8A6', strokeWidth: 2, r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="escrow" 
              stroke="#F97316" 
              strokeWidth={2}
              dot={{ fill: '#F97316', strokeWidth: 2, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex items-center justify-center space-x-6 mt-4 pt-4 border-t border-gray-200 dark:border-dark-600">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-primary-600"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Total Balance</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-secondary-600"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Savings</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-accent-600"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Escrow</span>
        </div>
      </div>
    </Card>
  );
};
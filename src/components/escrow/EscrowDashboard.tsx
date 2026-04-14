import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  Filter,
  Search,
  DollarSign
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CreateEscrowForm } from './CreateEscrowForm';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useEscrow } from '../../hooks/useEscrow';
import { calculateEscrowFee } from '../../services/feeCalculator';
import { useSearch } from '../../hooks/useSearch';

export const EscrowDashboard: React.FC = () => {
  const { user } = useAuth();
  const { escrows, loading, loadEscrows, stats } = useEscrow(user?.id || '');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { results: filteredEscrows, handleSearch, clearSearch } = useSearch(
    escrows,
    ['description', 'terms', 'id'] as any[],
    { minChars: 1 }
  );

  useEffect(() => {
    if (user?.id) {
      loadEscrows();
    }
  }, [user?.id, loadEscrows]);

  const handleSearch_Input = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const filterOptions = [
    { id: 'all', label: 'All Escrows', count: escrows.length },
    { id: 'active', label: 'Active', count: escrows.filter(e => e.status === 'active').length },
    { id: 'completed', label: 'Completed', count: escrows.filter(e => e.status === 'completed').length },
    { id: 'disputed', label: 'Disputed', count: escrows.filter(e => e.status === 'disputed').length }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return Clock;
      case 'completed': return CheckCircle;
      case 'disputed': return AlertTriangle;
      default: return Shield;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'disputed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const displayEscrows = activeFilter === 'all'
    ? filteredEscrows
    : filteredEscrows.filter(e => e.status === activeFilter);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 dark:bg-dark-700 rounded-lg"></div>
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-dark-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Escrow Services
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Secure global transactions with buyer protection
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Escrow
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Escrows</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeCount}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedCount}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.successRate.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-secondary-600 to-secondary-700 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveFilter(option.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeFilter === option.id
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                }`}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch_Input(e.target.value)}
                placeholder="Search escrows..."
                className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-700 border border-transparent rounded-lg focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-dark-600 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-64"
              />
            </div>
            <Button variant="ghost" size="sm">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Escrow List */}
        <div className="space-y-4">
          {displayEscrows.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No escrows found</p>
            </div>
          ) : (
            displayEscrows.map((escrow, index) => {
              const StatusIcon = getStatusIcon(escrow.status);
              const fee = calculateEscrowFee(escrow.amount).fee;

              return (
                <motion.div
                  key={escrow.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="border border-gray-200 dark:border-dark-600 rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 cursor-pointer hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-secondary-600 to-secondary-700 rounded-lg flex items-center justify-center shadow-lg">
                        <Shield className="w-6 h-6 text-white" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {escrow.description}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(escrow.status)}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {escrow.status}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Escrow ID: {escrow.id}
                        </p>

                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {escrow.terms}
                        </p>

                        <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                          <span>Created: {new Date(escrow.createdDate).toLocaleDateString()}</span>
                          {escrow.status === 'active' && escrow.autoReleaseDate && (
                            <span>Auto-release: {new Date(escrow.autoReleaseDate).toLocaleDateString()}</span>
                          )}
                          <span>Fee: ${fee.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {escrow.currency} {escrow.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Escrow Amount
                      </p>
                    </div>
                  </div>

                  {escrow.status === 'active' && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-600 flex justify-end space-x-2">
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                      <Button size="sm">
                        Release Funds
                      </Button>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </Card>

      {/* Fee Structure Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Transparent Fee Structure
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">$0 - $99.99</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">$1 flat fee</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">$100 - $499.99</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">$2 flat fee</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">$500 - $999.99</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">$3 flat fee</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">$1,000+</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">2% of total</p>
          </div>
        </div>
      </Card>

      {/* Create Escrow Modal */}
      {showCreateForm && (
        <CreateEscrowForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            loadEscrows();
          }}
        />
      )}
    </div>
  );
};
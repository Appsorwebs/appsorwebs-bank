/**
 * Documents Page
 * Manage bank statements, receipts, and financial documents
 */

import React, { useState } from 'react';
import { useDocuments } from '../hooks/useDocuments';
import {
  Download,
  Trash2,
  Share2,
  FileText,
  Calendar,
  HardDrive,
  Search,
  Filter,
  Plus,
  ChevronRight,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export const DocumentsPage: React.FC = () => {
  const { documents, statements, receipts, stats, loading, downloadDocument, deleteDocument, shareDocument, getStoragePercentage } = useDocuments();

  const [activeTab, setActiveTab] = useState<'documents' | 'statements' | 'receipts'>('documents');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const storagePercentage = getStoragePercentage();

  const handleDownload = (documentId: string) => {
    downloadDocument(documentId);
  };

  const handleDelete = (documentId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteDocument(documentId);
    }
  };

  const handleShare = (documentId: string) => {
    shareDocument(documentId);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Documents & Statements
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Access your bank statements, receipts, and financial documents
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Generate Statement
        </button>
      </div>

      {/* Storage Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg shadow p-6 border border-blue-200"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <HardDrive className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Storage Usage</p>
              <p className="text-xl font-bold text-gray-900">
                {formatFileSize(stats.storageUsed)} / {formatFileSize(stats.storageQuota)}
              </p>
            </div>
          </div>
          <span className="text-2xl font-bold text-blue-600">{storagePercentage.toFixed(1)}%</span>
        </div>

        <div className="w-full bg-gray-300 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              storagePercentage > 80
                ? 'bg-red-500'
                : storagePercentage > 60
                ? 'bg-yellow-500'
                : 'bg-gradient-to-r from-blue-500 to-cyan-600'
            }`}
            style={{ width: `${Math.min(storagePercentage, 100)}%` }}
          ></div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Documents</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalDocuments}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Statements</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalStatements}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Receipts</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalReceipts}</p>
        </motion.div>
      </div>

      {/* Generate Statement Modal */}
      <AnimatePresence>
        {showGenerateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Generate Bank Statement</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[2024, 2023, 2022, 2021].map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[
                      'January',
                      'February',
                      'March',
                      'April',
                      'May',
                      'June',
                      'July',
                      'August',
                      'September',
                      'October',
                      'November',
                      'December'
                    ].map((month, index) => (
                      <option key={month} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      toast.success('Statement generation in progress...');
                      setShowGenerateModal(false);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                  >
                    Generate
                  </button>
                  <button
                    onClick={() => setShowGenerateModal(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow border-b border-gray-200">
        <div className="flex border-b border-gray-200">
          {(['documents', 'statements', 'receipts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-4 font-medium transition text-center ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 border-b-2 border-transparent hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({
                tab === 'documents'
                  ? documents.length
                  : tab === 'statements'
                  ? statements.length
                  : receipts.length
              })
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
              <p className="text-gray-600 mt-3">Loading {activeTab}...</p>
            </div>
          ) : activeTab === 'documents' && documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-gray-50 rounded-lg border border-gray-200 transition flex items-center justify-between group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{doc.title}</p>
                        <p className="text-xs text-gray-600">
                          {formatFileSize(doc.fileSize)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleDownload(doc.id)}
                      className="p-2 hover:bg-blue-100 rounded text-blue-600 transition"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleShare(doc.id)}
                      className="p-2 hover:bg-green-100 rounded text-green-600 transition"
                      title="Share"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id, doc.title)}
                      className="p-2 hover:bg-red-100 rounded text-red-600 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : activeTab === 'statements' && statements.length > 0 ? (
            <div className="space-y-3">
              {statements.map((stmt, index) => (
                <motion.div
                  key={stmt.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-gray-50 rounded-lg border border-gray-200 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded">
                          <Calendar className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {stmt.startDate} to {stmt.endDate}
                          </p>
                          <p className="text-xs text-gray-600">{stmt.accountNumber} • {stmt.transactionCount} transactions</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-gray-600">Opening</p>
                          <p className="font-semibold text-gray-900">₦{stmt.openingBalance.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Closing</p>
                          <p className="font-semibold text-gray-900">₦{stmt.closingBalance.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Net Change</p>
                          <p className="font-semibold text-green-600">
                            +₦{(stmt.closingBalance - stmt.openingBalance).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toast.success('Download started')}
                        className="p-2 hover:bg-blue-100 rounded text-blue-600 transition"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : activeTab === 'receipts' && receipts.length > 0 ? (
            <div className="space-y-3">
              {receipts.map((receipt, index) => (
                <motion.div
                  key={receipt.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-gray-50 rounded-lg border border-gray-200 transition flex items-center justify-between group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded">
                        <FileText className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{receipt.merchant}</p>
                        <p className="text-xs text-gray-600">
                          ₦{receipt.amount.toLocaleString()} • {receipt.date}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => toast.success('Receipt downloaded')}
                      className="p-2 hover:bg-orange-100 rounded text-orange-600 transition"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleShare(receipt.id)}
                      className="p-2 hover:bg-green-100 rounded text-green-600 transition"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No {activeTab} found</p>
              {activeTab === 'statements' && (
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Generate your first statement →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;

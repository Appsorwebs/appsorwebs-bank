/**
 * Contacts Manager Component
 * Display and manage payment contacts
 */

import React, { useState } from 'react';
import { useContacts } from '../../hooks/useContacts';
import { Contact } from '../../services/contactService';
import {
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit,
  Star,
  Phone,
  Mail,
  MapPin,
  Tag,
  Download,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AddContactForm } from './AddContactForm';
import toast from 'react-hot-toast';

export const ContactsManager: React.FC = () => {
  const {
    contacts,
    loading,
    stats,
    searchContacts,
    deleteContact,
    toggleFavorite,
    selectContact,
    getCategories,
    getReport
  } = useContacts();

  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const categories = getCategories();

  // Filter and search contacts
  const filteredContacts =
    searchQuery.length > 0
      ? searchContacts(searchQuery)
      : filterCategory === 'all'
        ? contacts
        : contacts.filter((c) => c.category === filterCategory);

  // Handle delete with confirmation
  const handleDelete = (contactId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteContact(contactId);
      setShowDetails(false);
      setMenuOpen(null);
    }
  };

  // Handle favorite toggle
  const handleToggleFavorite = (contactId: string) => {
    toggleFavorite(contactId);
    setMenuOpen(null);
  };

  // Handle view details
  const handleViewDetails = (contact: Contact) => {
    selectContact(contact.id);
    setSelectedContact(contact);
    setShowDetails(true);
    setMenuOpen(null);
  };

  // Export contacts
  const handleExport = () => {
    const csv = getReport();
    if (csv) {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contacts.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Contacts exported successfully');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Contacts</h1>
            <p className="text-gray-600">Manage your payment contacts and frequent recipients</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              <Download className="w-5 h-5 mr-2" />
              Export
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Contact
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <p className="text-xs font-medium text-gray-600 mb-1">Total Contacts</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalContacts}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <p className="text-xs font-medium text-gray-600 mb-1">Personal</p>
            <p className="text-2xl font-bold text-blue-600">{stats.personalContacts}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <p className="text-xs font-medium text-gray-600 mb-1">Business</p>
            <p className="text-2xl font-bold text-green-600">{stats.businessContacts}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <p className="text-xs font-medium text-gray-600 mb-1">Government</p>
            <p className="text-2xl font-bold text-purple-600">{stats.governmentContacts}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <p className="text-xs font-medium text-gray-600 mb-1">Favorites</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.favoriteContacts}</p>
          </motion.div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Contact Modal */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto"
              >
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Add New Contact</h2>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-6">
                  <AddContactForm onSuccess={() => setShowAddForm(false)} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contact Details Modal */}
        <AnimatePresence>
          {showDetails && selectedContact && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-lg shadow-xl max-w-md w-full"
              >
                <div className="border-b border-gray-200 p-6 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedContact.name}</h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Category */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">CATEGORY</p>
                    <p className="capitalize text-sm">
                      {categories.find((c) => c.name === selectedContact.category)?.label}
                    </p>
                  </div>

                  {/* Email */}
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">EMAIL</p>
                      <p className="text-sm break-all">{selectedContact.email}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">PHONE</p>
                      <p className="text-sm">{selectedContact.phoneNumber}</p>
                    </div>
                  </div>

                  {/* Bank Account */}
                  {selectedContact.bankAccount && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-xs font-semibold text-gray-600 mb-3">BANK ACCOUNT</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bank:</span>
                          <span className="font-medium">{selectedContact.bankAccount.bankName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Account:</span>
                          <span className="font-medium">{selectedContact.bankAccount.accountNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span className="font-medium">{selectedContact.bankAccount.accountName}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedContact.tags.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-xs font-semibold text-gray-600 mb-2">TAGS</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedContact.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transaction Info */}
                  <div className="border-t border-gray-200 pt-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transactions:</span>
                      <span className="font-medium">{selectedContact.transactionCount}</span>
                    </div>
                    {selectedContact.lastTransactionDate && (
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-600">Last Transaction:</span>
                        <span className="font-medium">{selectedContact.lastTransactionDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 p-6 flex gap-3">
                  <button
                    onClick={() => {
                      handleToggleFavorite(selectedContact.id);
                      setShowDetails(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-semibold py-2 px-4 rounded-lg transition"
                  >
                    <Star className={`w-5 h-5 ${selectedContact.isFavorite ? 'fill-current' : ''}`} />
                    {selectedContact.isFavorite ? 'Remove Favorite' : 'Add Favorite'}
                  </button>
                  <button
                    onClick={() => handleDelete(selectedContact.id, selectedContact.name)}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-4 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contacts List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-gray-600">Loading contacts...</div>
          ) : filteredContacts.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredContacts.map((contact, index) => {
                const categoryIcon = categories.find((c) => c.name === contact.category)?.icon || '•';
                return (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-gray-50 transition relative"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{categoryIcon}</span>
                          <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                          {contact.isFavorite && (
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            <span>{contact.phoneNumber}</span>
                          </div>
                          {contact.bankAccount && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{contact.bankAccount.accountNumber}</span>
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            {contact.transactionCount} transactions
                          </div>
                        </div>
                        {contact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {contact.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded"
                              >
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="relative ml-4">
                        <button
                          onClick={() =>
                            setMenuOpen(menuOpen === contact.id ? null : contact.id)
                          }
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        <AnimatePresence>
                          {menuOpen === contact.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-40"
                            >
                              <button
                                onClick={() => handleViewDetails(contact)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                              >
                                <span className="flex items-center gap-2">
                                  <Edit className="w-4 h-4" />
                                  View Details
                                </span>
                              </button>
                              <button
                                onClick={() => handleToggleFavorite(contact.id)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <span className="flex items-center gap-2">
                                  <Star className="w-4 h-4" />
                                  {contact.isFavorite ? 'Remove Favorite' : 'Add Favorite'}
                                </span>
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(contact.id, contact.name)
                                }
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                              >
                                <span className="flex items-center gap-2">
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-600">
              <p className="mb-4">No contacts found</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Add your first contact →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

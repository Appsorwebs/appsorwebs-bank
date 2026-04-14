/**
 * useContacts Hook
 * Custom hook for managing contacts
 */

import { useState, useCallback, useEffect } from 'react';
import { ContactService, Contact } from '../services/contactService';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export interface ContactsState {
  contacts: Contact[];
  selectedContact?: Contact;
  loading: boolean;
  error?: string;
  stats: {
    totalContacts: number;
    personalContacts: number;
    businessContacts: number;
    governmentContacts: number;
    favoriteContacts: number;
  };
}

export const useContacts = () => {
  const { user } = useAuth();
  const [contactsState, setContactsState] = useState<ContactsState>({
    contacts: [],
    loading: false,
    stats: {
      totalContacts: 0,
      personalContacts: 0,
      businessContacts: 0,
      governmentContacts: 0,
      favoriteContacts: 0
    }
  });

  /**
   * Load all contacts
   */
  const loadContacts = useCallback(async () => {
    if (!user) return;

    try {
      setContactsState((prev) => ({ ...prev, loading: true }));
      const contactsResult = await ContactService.getContacts(user.id);
      const statsResult = await ContactService.getContactStats(user.id);

      if (!contactsResult.success || !statsResult.success) {
        throw new Error(contactsResult.error || statsResult.error || 'Failed to load contacts');
      }

      setContactsState((prev) => ({
        ...prev,
        contacts: contactsResult.data || [],
        stats: statsResult.data || prev.stats,
        loading: false
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load contacts';
      setContactsState((prev) => ({
        ...prev,
        loading: false,
        error: message
      }));
      toast.error(message);
    }
  }, [user]);

  /**
   * Search contacts
   */
  const searchContacts = useCallback(
    async (query: string) => {
      if (!user) return [];

      try {
        const result = await ContactService.searchContacts(query, user.id);
        if (!result.success) {
          throw new Error(result.error || 'Search failed');
        }

        const contacts = result.data || [];
        setContactsState((prev) => ({
          ...prev,
          contacts
        }));
        return contacts;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Search failed';
        toast.error(message);
        return [];
      }
    },
    [user]
  );

  /**
   * Get contacts by category
   */
  const getContactsByCategory = useCallback(
    async (category: Contact['category']) => {
      if (!user) return [];

      try {
        const result = await ContactService.getContactsByCategory(category, user.id);
        if (!result.success) {
          throw new Error(result.error || 'Failed to get contacts');
        }
        return result.data || [];
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get contacts';
        toast.error(message);
        return [];
      }
    },
    [user]
  );

  /**
   * Get favorite contacts
   */
  const getFavoriteContacts = useCallback(async () => {
    if (!user) return [];

    try {
      const result = await ContactService.getFavoriteContacts(user.id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to get favorites');
      }
      return result.data || [];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get favorites';
      toast.error(message);
      return [];
    }
  }, [user]);

  /**
   * Select contact
   */
  const selectContact = useCallback(async (contactId: string) => {
    try {
      const result = await ContactService.getContactById(contactId);
      if (!result.success || !result.data) {
        throw new Error('Contact not found');
      }

      const contact = result.data;
      setContactsState((prev) => ({
        ...prev,
        selectedContact: contact
      }));

      return contact;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to select contact';
      toast.error(message);
      return null;
    }
  }, []);

  /**
   * Create new contact
   */
  const createContact = useCallback(
    async (
      contactData: Omit<Contact, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'transactionCount'>
    ) => {
      if (!user) {
        toast.error('User not authenticated');
        return null;
      }

      try {
        // Validate email
        if (!ContactService.validateEmail(contactData.email)) {
          throw new Error('Invalid email format');
        }

        // Validate phone
        if (!ContactService.validatePhone(contactData.phoneNumber)) {
          throw new Error('Invalid phone number format');
        }

        // Validate account if provided
        if (
          contactData.bankAccount &&
          !ContactService.validateAccountNumber(
            contactData.bankAccount.accountNumber,
            contactData.bankAccount.countryCode
          )
        ) {
          throw new Error('Invalid account number format');
        }

        const result = await ContactService.createContact(user.id, contactData);
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to create contact');
        }

        const newContact = result.data;
        const statsResult = await ContactService.getContactStats(user.id);

        setContactsState((prev) => {
          const updatedContacts = [newContact, ...prev.contacts];
          return {
            ...prev,
            contacts: updatedContacts,
            stats: statsResult.success ? statsResult.data || prev.stats : prev.stats
          };
        });

        toast.success(`Contact "${newContact.name}" added successfully`);
        return newContact;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create contact';
        toast.error(message);
        return null;
      }
    },
    [user]
  );

  /**
   * Update contact
   */
  const updateContact = useCallback(
    async (contactId: string, updates: Partial<Omit<Contact, 'id' | 'userId' | 'createdAt'>>) => {
      try {
        const result = await ContactService.updateContact(contactId, updates);
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Contact not found');
        }

        const updated = result.data;
        setContactsState((prev) => ({
          ...prev,
          contacts: prev.contacts.map((c) => (c.id === contactId ? updated : c)),
          selectedContact: prev.selectedContact?.id === contactId ? updated : prev.selectedContact
        }));

        toast.success('Contact updated successfully');
        return updated;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update contact';
        toast.error(message);
        return null;
      }
    },
    []
  );

  /**
   * Delete contact
   */
  const deleteContact = useCallback(
    async (contactId: string) => {
      try {
        const result = await ContactService.deleteContact(contactId);
        if (!result.success) {
          throw new Error(result.error || 'Contact not found');
        }

        const statsResult = user ? await ContactService.getContactStats(user.id) : null;

        setContactsState((prev) => {
          const updatedContacts = prev.contacts.filter((c) => c.id !== contactId);
          return {
            ...prev,
            contacts: updatedContacts,
            selectedContact: prev.selectedContact?.id === contactId ? undefined : prev.selectedContact,
            stats: statsResult?.success ? statsResult.data || prev.stats : prev.stats
          };
        });

        toast.success('Contact deleted successfully');
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete contact';
        toast.error(message);
        return false;
      }
    },
    [user]
  );

  /**
   * Toggle favorite status
   */
  const toggleFavorite = useCallback(async (contactId: string) => {
    try {
      const result = await ContactService.toggleFavorite(contactId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Contact not found');
      }

      const updated = result.data;
      setContactsState((prev) => {
        const updatedContacts = prev.contacts.map((c) => (c.id === contactId ? updated : c));
        const stats = { ...prev.stats };

        if (updated.isFavorite) {
          stats.favoriteContacts += 1;
        } else {
          stats.favoriteContacts = Math.max(0, stats.favoriteContacts - 1);
        }

        return {
          ...prev,
          contacts: updatedContacts,
          selectedContact: prev.selectedContact?.id === contactId ? updated : prev.selectedContact,
          stats
        };
      });

      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle favorite';
      toast.error(message);
      return null;
    }
  }, []);

  /**
   * Add tag to contact
   */
  const addTag = useCallback(async (contactId: string, tag: string) => {
    try {
      const result = await ContactService.addTag(contactId, tag);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Contact not found');
      }

      const updated = result.data;
      setContactsState((prev) => ({
        ...prev,
        contacts: prev.contacts.map((c) => (c.id === contactId ? updated : c)),
        selectedContact: prev.selectedContact?.id === contactId ? updated : prev.selectedContact
      }));

      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add tag';
      toast.error(message);
      return null;
    }
  }, []);

  /**
   * Remove tag from contact
   */
  const removeTag = useCallback(async (contactId: string, tag: string) => {
    try {
      const result = await ContactService.removeTag(contactId, tag);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Contact not found');
      }

      const updated = result.data;
      setContactsState((prev) => ({
        ...prev,
        contacts: prev.contacts.map((c) => (c.id === contactId ? updated : c)),
        selectedContact: prev.selectedContact?.id === contactId ? updated : prev.selectedContact
      }));

      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove tag';
      toast.error(message);
      return null;
    }
  }, []);

  /**
   * Record transaction (increment transaction count)
   */
  const recordTransaction = useCallback(async (contactId: string) => {
    try {
      const result = await ContactService.recordTransaction(contactId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Contact not found');
      }

      const updated = result.data;
      setContactsState((prev) => ({
        ...prev,
        contacts: prev.contacts.map((c) => (c.id === contactId ? updated : c)),
        selectedContact: prev.selectedContact?.id === contactId ? updated : prev.selectedContact
      }));

      return updated;
    } catch (error) {
      console.error('Failed to record transaction:', error);
      return null;
    }
  }, []);

  /**
   * Get report of contacts
   */
  const getReport = useCallback(async () => {
    if (!user) return null;

    try {
      const result = await ContactService.exportContactsAsCSV(user.id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate report');
      }
      return result.data || null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate report';
      toast.error(message);
      return null;
    }
  }, [user]);

  /**
   * Initialize - load contacts on mount
   */
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  return {
    // State
    contacts: contactsState.contacts,
    selectedContact: contactsState.selectedContact,
    loading: contactsState.loading,
    error: contactsState.error,
    stats: contactsState.stats,

    // Methods
    loadContacts,
    searchContacts,
    getContactsByCategory,
    getFavoriteContacts,
    selectContact,
    createContact,
    updateContact,
    deleteContact,
    toggleFavorite,
    addTag,
    removeTag,
    recordTransaction,
    getReport,
    getCategories: () => ContactService.getCategories()
  };
};

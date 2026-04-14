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
      const contacts = ContactService.getContacts(user.id);
      const stats = ContactService.getContactStats(user.id);

      setContactsState((prev) => ({
        ...prev,
        contacts,
        stats,
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
    (query: string) => {
      if (!user) return [];

      try {
        const results = ContactService.searchContacts(query, user.id);
        setContactsState((prev) => ({
          ...prev,
          contacts: results
        }));
        return results;
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
    (category: Contact['category']) => {
      if (!user) return [];

      try {
        const results = ContactService.getContactsByCategory(category, user.id);
        return results;
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
  const getFavoriteContacts = useCallback(() => {
    if (!user) return [];

    try {
      return ContactService.getFavoriteContacts(user.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get favorites';
      toast.error(message);
      return [];
    }
  }, [user]);

  /**
   * Select contact
   */
  const selectContact = useCallback((contactId: string) => {
    try {
      const contact = ContactService.getContactById(contactId);
      if (!contact) {
        throw new Error('Contact not found');
      }

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
    (
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

        const newContact = ContactService.createContact(user.id, contactData);

        setContactsState((prev) => {
          const updatedContacts = [newContact, ...prev.contacts];
          const stats = ContactService.getContactStats(user.id);

          return {
            ...prev,
            contacts: updatedContacts,
            stats
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
    (contactId: string, updates: Partial<Omit<Contact, 'id' | 'userId' | 'createdAt'>>) => {
      try {
        const updated = ContactService.updateContact(contactId, updates);
        if (!updated) {
          throw new Error('Contact not found');
        }

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
    (contactId: string) => {
      try {
        const success = ContactService.deleteContact(contactId);
        if (!success) {
          throw new Error('Contact not found');
        }

        setContactsState((prev) => {
          const updatedContacts = prev.contacts.filter((c) => c.id !== contactId);
          const stats = user ? ContactService.getContactStats(user.id) : prev.stats;

          return {
            ...prev,
            contacts: updatedContacts,
            selectedContact: prev.selectedContact?.id === contactId ? undefined : prev.selectedContact,
            stats
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
  const toggleFavorite = useCallback((contactId: string) => {
    try {
      const updated = ContactService.toggleFavorite(contactId);
      if (!updated) {
        throw new Error('Contact not found');
      }

      setContactsState((prev) => {
        const updatedContacts = prev.contacts.map((c) => (c.id === contactId ? updated : c));
        const stats = prev.stats;

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
  const addTag = useCallback((contactId: string, tag: string) => {
    try {
      const updated = ContactService.addTag(contactId, tag);
      if (!updated) {
        throw new Error('Contact not found');
      }

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
  const removeTag = useCallback((contactId: string, tag: string) => {
    try {
      const updated = ContactService.removeTag(contactId, tag);
      if (!updated) {
        throw new Error('Contact not found');
      }

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
  const recordTransaction = useCallback((contactId: string) => {
    try {
      const updated = ContactService.recordTransaction(contactId);
      if (!updated) {
        throw new Error('Contact not found');
      }

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
  const getReport = useCallback(() => {
    if (!user) return null;

    try {
      return ContactService.exportContactsAsCSV(user.id);
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

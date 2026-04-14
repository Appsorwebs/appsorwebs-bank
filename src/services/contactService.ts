/**
 * Contacts Service
 * Manages user contacts and frequent recipients for payments
 * Integrated with Supabase database
 */

import { supabase } from '../lib/supabase';
import { ErrorHandler } from '../lib/errorHandler';

export interface Contact {
  id: string;
  userId: string;
  name: string;
  email: string;
  phoneNumber: string;
  bankAccount?: {
    accountNumber: string;
    bankName: string;
    bankCode: string;
    accountName: string;
    countryCode: string;
  };
  category: 'personal' | 'business' | 'government';
  transactionCount: number;
  lastTransactionDate?: string;
  isFavorite: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactCategory {
  name: 'personal' | 'business' | 'government';
  label: string;
  icon: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Internal database structure for contacts
 */
interface DBContact {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone_number: string;
  category: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

interface DBContactBankAccount {
  id: string;
  contact_id: string;
  account_number: string;
  bank_name: string;
  account_name: string;
  country_code: string;
}

export class ContactService {
  /**
   * Get all contacts for user
   */
  static async getContacts(userId: string): Promise<APIResponse<Contact[]>> {
    try {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch bank accounts for each contact
      const contactsWithAccounts = await Promise.all(
        (contacts as DBContact[]).map(async (contact) => {
          const { data: accounts } = await supabase
            .from('contact_bank_accounts')
            .select('*')
            .eq('contact_id', contact.id);

          return this.mapDBContactToContact(contact, accounts?.[0] || null);
        })
      );

      return { success: true, data: contactsWithAccounts };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get contact by ID
   */
  static async getContactById(contactId: string): Promise<APIResponse<Contact>> {
    try {
      const { data: contact, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (error) throw error;

      const { data: accounts } = await supabase
        .from('contact_bank_accounts')
        .select('*')
        .eq('contact_id', contactId);

      const result = this.mapDBContactToContact(contact as DBContact, accounts?.[0] || null);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Search contacts
   */
  static async searchContacts(query: string, userId: string): Promise<APIResponse<Contact[]>> {
    try {
      const lowerQuery = query.toLowerCase();

      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone_number.ilike.%${query}%`);

      if (error) throw error;

      const contactsWithAccounts = await Promise.all(
        (contacts as DBContact[]).map(async (contact) => {
          const { data: accounts } = await supabase
            .from('contact_bank_accounts')
            .select('*')
            .eq('contact_id', contact.id);

          return this.mapDBContactToContact(contact, accounts?.[0] || null);
        })
      );

      return { success: true, data: contactsWithAccounts };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get contacts by category
   */
  static async getContactsByCategory(
    category: Contact['category'],
    userId: string
  ): Promise<APIResponse<Contact[]>> {
    try {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category);

      if (error) throw error;

      const contactsWithAccounts = await Promise.all(
        (contacts as DBContact[]).map(async (contact) => {
          const { data: accounts } = await supabase
            .from('contact_bank_accounts')
            .select('*')
            .eq('contact_id', contact.id);

          return this.mapDBContactToContact(contact, accounts?.[0] || null);
        })
      );

      return { success: true, data: contactsWithAccounts };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get favorite contacts
   */
  static async getFavoriteContacts(userId: string): Promise<APIResponse<Contact[]>> {
    try {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_favorite', true);

      if (error) throw error;

      const contactsWithAccounts = await Promise.all(
        (contacts as DBContact[]).map(async (contact) => {
          const { data: accounts } = await supabase
            .from('contact_bank_accounts')
            .select('*')
            .eq('contact_id', contact.id);

          return this.mapDBContactToContact(contact, accounts?.[0] || null);
        })
      );

      return { success: true, data: contactsWithAccounts };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Create a new contact
   */
  static async createContact(
    userId: string,
    data: Omit<Contact, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'transactionCount'>
  ): Promise<APIResponse<Contact>> {
    try {
      const { data: contact, error } = await supabase
        .from('contacts')
        .insert([
          {
            user_id: userId,
            name: data.name,
            email: data.email,
            phone_number: data.phoneNumber,
            category: data.category,
            is_favorite: data.isFavorite
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Insert bank account if provided
      if (data.bankAccount) {
        const { data: account } = await supabase
          .from('contact_bank_accounts')
          .insert([
            {
              contact_id: (contact as DBContact).id,
              account_number: data.bankAccount.accountNumber,
              bank_name: data.bankAccount.bankName,
              account_name: data.bankAccount.accountName,
              country_code: data.bankAccount.countryCode
            }
          ])
          .select()
          .single();

        const result = this.mapDBContactToContact(contact as DBContact, account as DBContactBankAccount);
        return { success: true, data: result };
      }

      const result = this.mapDBContactToContact(contact as DBContact, null);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Update contact
   */
  static async updateContact(
    contactId: string,
    updates: Partial<Omit<Contact, 'id' | 'userId' | 'createdAt'>>
  ): Promise<APIResponse<Contact>> {
    try {
      const updateData: any = {};

      if (updates.name) updateData.name = updates.name;
      if (updates.email) updateData.email = updates.email;
      if (updates.phoneNumber) updateData.phone_number = updates.phoneNumber;
      if (updates.category) updateData.category = updates.category;
      if (typeof updates.isFavorite === 'boolean') updateData.is_favorite = updates.isFavorite;

      const { data: contact, error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contactId)
        .select()
        .single();

      if (error) throw error;

      // Update bank account if provided
      if (updates.bankAccount) {
        await supabase.from('contact_bank_accounts').delete().eq('contact_id', contactId);

        const { data: account } = await supabase
          .from('contact_bank_accounts')
          .insert([
            {
              contact_id: contactId,
              account_number: updates.bankAccount.accountNumber,
              bank_name: updates.bankAccount.bankName,
              account_name: updates.bankAccount.accountName,
              country_code: updates.bankAccount.countryCode
            }
          ])
          .select()
          .single();

        const result = this.mapDBContactToContact(contact as DBContact, account as DBContactBankAccount);
        return { success: true, data: result };
      }

      const { data: accounts } = await supabase
        .from('contact_bank_accounts')
        .select('*')
        .eq('contact_id', contactId);

      const result = this.mapDBContactToContact(contact as DBContact, accounts?.[0] || null);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Delete contact
   */
  static async deleteContact(contactId: string): Promise<APIResponse<void>> {
    try {
      const { error } = await supabase.from('contacts').delete().eq('id', contactId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Toggle favorite status
   */
  static async toggleFavorite(contactId: string): Promise<APIResponse<Contact>> {
    try {
      // Get current status
      const { data: contact, error: fetchError } = await supabase
        .from('contacts')
        .select('is_favorite')
        .eq('id', contactId)
        .single();

      if (fetchError) throw fetchError;

      // Update to opposite
      const { data: updated, error: updateError } = await supabase
        .from('contacts')
        .update({ is_favorite: !(contact as any).is_favorite })
        .eq('id', contactId)
        .select()
        .single();

      if (updateError) throw updateError;

      const { data: accounts } = await supabase
        .from('contact_bank_accounts')
        .select('*')
        .eq('contact_id', contactId);

      const result = this.mapDBContactToContact(updated as DBContact, accounts?.[0] || null);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format
   */
  static validatePhone(phone: string): boolean {
    const phoneRegex = /^(\+\d{1,3})?\d{9,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
  }

  /**
   * Validate account number format
   */
  static validateAccountNumber(accountNumber: string, countryCode: string): boolean {
    switch (countryCode) {
      case 'NG':
        return accountNumber.length === 10 && /^\d+$/.test(accountNumber);
      case 'GH':
        return accountNumber.length >= 10 && /^\d+$/.test(accountNumber);
      case 'KE':
        return accountNumber.length >= 10 && /^\d+$/.test(accountNumber);
      default:
        return accountNumber.length >= 5;
    }
  }

  /**
   * Get contact statistics
   */
  static async getContactStats(userId: string): Promise<
    APIResponse<{
      totalContacts: number;
      personalContacts: number;
      businessContacts: number;
      governmentContacts: number;
      favoriteContacts: number;
    }>
  > {
    try {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('category, is_favorite')
        .eq('user_id', userId);

      if (error) throw error;

      const data = contacts as any[];
      return {
        success: true,
        data: {
          totalContacts: data.length,
          personalContacts: data.filter((c) => c.category === 'personal').length,
          businessContacts: data.filter((c) => c.category === 'business').length,
          governmentContacts: data.filter((c) => c.category === 'government').length,
          favoriteContacts: data.filter((c) => c.is_favorite).length
        }
      };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get contact categories
   */
  static getCategories(): ContactCategory[] {
    return [
      { name: 'personal', label: 'Personal', icon: '👤' },
      { name: 'business', label: 'Business', icon: '💼' },
      { name: 'government', label: 'Government', icon: '🏛️' }
    ];
  }

  /**
   * Export contacts as CSV
   */
  static async exportContactsAsCSV(userId: string): Promise<APIResponse<string>> {
    try {
      const result = await this.getContacts(userId);
      if (!result.success || !result.data) {
        throw new Error('Failed to fetch contacts');
      }

      const userContacts = result.data;
      const headers = ['Name', 'Email', 'Phone', 'Category', 'Account Number', 'Bank', 'Transactions'];
      const rows = userContacts.map((c) => [
        c.name,
        c.email,
        c.phoneNumber,
        c.category,
        c.bankAccount?.accountNumber || '',
        c.bankAccount?.bankName || '',
        c.transactionCount.toString()
      ]);

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

      return { success: true, data: csv };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Helper to map database contact to Contact interface
   */
  private static mapDBContactToContact(
    dbContact: DBContact,
    dbAccount: DBContactBankAccount | null
  ): Contact {
    return {
      id: dbContact.id,
      userId: dbContact.user_id,
      name: dbContact.name,
      email: dbContact.email,
      phoneNumber: dbContact.phone_number,
      category: dbContact.category as any,
      isFavorite: dbContact.is_favorite,
      transactionCount: 0,
      tags: [],
      createdAt: dbContact.created_at,
      updatedAt: dbContact.updated_at,
      bankAccount: dbAccount
        ? {
            accountNumber: dbAccount.account_number,
            bankName: dbAccount.bank_name,
            bankCode: '', // Not stored in DB, can be derived if needed
            accountName: dbAccount.account_name,
            countryCode: dbAccount.country_code
          }
        : undefined
    };
  }
}

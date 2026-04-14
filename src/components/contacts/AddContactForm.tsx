/**
 * Add Contact Form
 * Form for creating and adding new contacts
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useContacts } from '../../hooks/useContacts';
import { ContactService } from '../../services/contactService';
import toast from 'react-hot-toast';

// Validation schema
const addContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(10, 'Phone must be at least 10 digits'),
  category: z.enum(['personal', 'business', 'government']),
  hasBankAccount: z.boolean().default(false),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  bankCode: z.string().optional(),
  accountName: z.string().optional(),
  countryCode: z.string().optional(),
  tags: z.string().optional()
});

type AddContactFormData = z.infer<typeof addContactSchema>;

interface AddContactFormProps {
  onSuccess?: () => void;
}

export const AddContactForm: React.FC<AddContactFormProps> = ({ onSuccess }) => {
  const { createContact } = useContacts();
  const [hasBankAccount, setHasBankAccount] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset
  } = useForm<AddContactFormData>({
    resolver: zodResolver(addContactSchema),
    defaultValues: {
      category: 'personal',
      hasBankAccount: false,
      countryCode: 'NG'
    }
  });

  const tagsValue = watch('tags');

  const onSubmit = async (data: AddContactFormData) => {
    try {
      // Validate phone format
      if (!ContactService.validatePhone(data.phoneNumber)) {
        toast.error('Invalid phone number format');
        return;
      }

      // Validate bank account if provided
      if (
        hasBankAccount &&
        data.accountNumber &&
        !ContactService.validateAccountNumber(data.accountNumber, data.countryCode || 'NG')
      ) {
        toast.error('Invalid account number format');
        return;
      }

      const contactData = {
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        category: data.category as 'personal' | 'business' | 'government',
        isFavorite: false,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()) : [],
        bankAccount: hasBankAccount
          ? {
              accountNumber: data.accountNumber!,
              bankName: data.bankName!,
              bankCode: data.bankCode!,
              accountName: data.accountName!,
              countryCode: data.countryCode!
            }
          : undefined
      };

      const result = createContact(contactData);

      if (result) {
        reset();
        setHasBankAccount(false);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add contact');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Name <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          placeholder="John Essien"
          {...register('name')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address <span className="text-red-600">*</span>
        </label>
        <input
          type="email"
          placeholder="john@example.com"
          {...register('email')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number <span className="text-red-600">*</span>
        </label>
        <input
          type="tel"
          placeholder="+234801234567"
          {...register('phoneNumber')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.phoneNumber && (
          <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category <span className="text-red-600">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {['personal', 'business', 'government'].map((cat) => (
            <label key={cat} className="flex items-center">
              <input
                type="radio"
                value={cat}
                {...register('category')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="ml-2 text-sm capitalize text-gray-700">{cat}</span>
            </label>
          ))}
        </div>
        {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
      </div>

      {/* Bank Account Section */}
      <div className="border border-gray-300 rounded-lg p-4">
        <label className="flex items-center cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={hasBankAccount}
            onChange={(e) => setHasBankAccount(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300"
          />
          <span className="ml-2 text-sm font-medium text-gray-700">Add Bank Account</span>
        </label>

        {hasBankAccount && (
          <div className="space-y-4">
            {/* Bank Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <select
                {...register('countryCode')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="NG">Nigeria</option>
                <option value="GH">Ghana</option>
                <option value="KE">Kenya</option>
              </select>
            </div>

            {/* Bank Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                placeholder="GTB, Access Bank, etc."
                {...register('bankName')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.bankName && (
                <p className="mt-1 text-sm text-red-600">{errors.bankName.message}</p>
              )}
            </div>

            {/* Bank Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Code <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                placeholder="058, 044, etc."
                {...register('bankCode')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.bankCode && (
                <p className="mt-1 text-sm text-red-600">{errors.bankCode.message}</p>
              )}
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                placeholder="0123456789"
                {...register('accountNumber')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.accountNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.accountNumber.message}</p>
              )}
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                placeholder="Account holder name"
                {...register('accountName')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.accountName && (
                <p className="mt-1 text-sm text-red-600">{errors.accountName.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags <span className="text-gray-500">(comma-separated)</span>
        </label>
        <input
          type="text"
          placeholder="family, supplier, friend"
          {...register('tags')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          {tagsValue ? `Tags: ${tagsValue.split(',').length}` : 'Add optional tags to organize contacts'}
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Adding Contact...' : 'Add Contact'}
      </button>
    </form>
  );
};

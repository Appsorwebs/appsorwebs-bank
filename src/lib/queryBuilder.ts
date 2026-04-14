/**
 * Query Builder Utilities
 * Helper functions for building and executing Supabase queries
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Standard API response format
 */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Query Builder class for common database operations
 */
export class QueryBuilder {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Execute a SELECT query with optional filters
   */
  async select<T>(
    table: string,
    filters?: Record<string, any>,
    options?: {
      order?: { column: string; ascending?: boolean };
      limit?: number;
      offset?: number;
    }
  ): Promise<APIResponse<T[]>> {
    try {
      let query = this.supabase.from(table).select('*');

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (options?.order) {
        query = query.order(options.order.column, {
          ascending: options.order.ascending ?? true
        });
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data as T[] };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  /**
   * Insert a single record
   */
  async insertOne<T>(table: string, record: any): Promise<APIResponse<T>> {
    try {
      const { data, error } = await this.supabase
        .from(table)
        .insert([record])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: data as T };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  /**
   * Insert multiple records
   */
  async insertMany<T>(table: string, records: any[]): Promise<APIResponse<T[]>> {
    try {
      const { data, error } = await this.supabase
        .from(table)
        .insert(records)
        .select();

      if (error) throw error;

      return { success: true, data: data as T[] };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  /**
   * Update records
   */
  async update<T>(
    table: string,
    record: any,
    filters: Record<string, any>
  ): Promise<APIResponse<T[]>> {
    try {
      let query = this.supabase.from(table).update(record);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data, error } = await query.select();

      if (error) throw error;

      return { success: true, data: data as T[] };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  /**
   * Delete records
   */
  async delete(table: string, filters: Record<string, any>): Promise<APIResponse<void>> {
    try {
      let query = this.supabase.from(table);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { error } = await query.delete();

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  /**
   * Get a single record by ID
   */
  async getById<T>(table: string, id: string): Promise<APIResponse<T>> {
    try {
      const { data, error } = await this.supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return { success: true, data: data as T };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  /**
   * Count records matching filters
   */
  async count(table: string, filters?: Record<string, any>): Promise<APIResponse<number>> {
    try {
      let query = this.supabase.from(table).select('*', { count: 'exact', head: true });

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      const { count, error } = await query;

      if (error) throw error;

      return { success: true, data: count ?? 0 };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  /**
   * Extract error message from various error types
   */
  private getErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error?.message) {
      return error.message;
    }

    if (error?.error_description) {
      return error.error_description;
    }

    if (error?.details) {
      return error.details;
    }

    return 'An unexpected error occurred';
  }
}

/**
 * Factory function to create a QueryBuilder instance
 */
export function createQueryBuilder(supabase: SupabaseClient): QueryBuilder {
  return new QueryBuilder(supabase);
}

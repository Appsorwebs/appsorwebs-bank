/**
 * useDocuments Hook
 * Custom hook for managing documents and statements
 */

import { useState, useCallback, useEffect } from 'react';
import {
  DocumentService,
  Document,
  BankStatement,
  Receipt,
  DocumentStats
} from '../services/documentService';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export interface DocumentsState {
  documents: Document[];
  statements: BankStatement[];
  receipts: Receipt[];
  loading: boolean;
  error?: string;
  stats: DocumentStats;
}

export const useDocuments = () => {
  const { user } = useAuth();
  const [docsState, setDocsState] = useState<DocumentsState>({
    documents: [],
    statements: [],
    receipts: [],
    loading: false,
    stats: {
      totalDocuments: 0,
      totalStatements: 0,
      totalReceipts: 0,
      storageUsed: 0,
      storageQuota: 0
    }
  });

  /**
   * Load documents
   */
  const loadDocuments = useCallback(async () => {
    if (!user) return;

    try {
      setDocsState((prev) => ({ ...prev, loading: true }));

      const documentsResult = await DocumentService.getUserDocuments(user.id);
      const statementsResult = await DocumentService.getUserStatements(user.id);
      const statsResult = await DocumentService.getDocumentStats(user.id);

      if (!documentsResult.success || !statementsResult.success || !statsResult.success) {
        throw new Error('Failed to load documents');
      }

      setDocsState((prev) => ({
        ...prev,
        documents: documentsResult.data || [],
        statements: statementsResult.data || [],
        stats: statsResult.data || prev.stats,
        loading: false
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load documents';
      setDocsState((prev) => ({
        ...prev,
        loading: false,
        error: message
      }));
      toast.error(message);
    }
  }, [user]);

  /**
   * Get documents by type
   */
  const getDocumentsByType = useCallback(async (type: Document['type']) => {
    if (!user) return [];
    const result = await DocumentService.getDocumentsByType(user.id, type);
    return result.success ? result.data || [] : [];
  }, [user]);

  /**
   * Get statements by date range
   */
  const getStatementsByDateRange = useCallback(async (startDate: string, endDate: string) => {
    if (!user) return [];
    const result = await DocumentService.getStatementsByDateRange(user.id, startDate, endDate);
    return result.success ? result.data || [] : [];
  }, [user]);

  /**
   * Get receipts by date range
   */
  const getReceiptsByDateRange = useCallback(async (startDate: string, endDate: string) => {
    if (!user) return [];
    return [];  // Note: getUserReceipts was removed from DocumentService
  }, [user]);

  /**
   * Download document
   */
  const downloadDocument = useCallback(
    async (documentId: string) => {
      try {
        const result = await DocumentService.downloadDocument(documentId);
        if (result.success && result.data) {
          // Trigger download
          window.location.href = result.data.url;
          toast.success('Download started');
          return result;
        } else {
          throw new Error(result.error || 'Failed to download');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to download document';
        toast.error(message);
        return { success: false, error: message };
      }
    },
    []
  );

  /**
   * Delete document
   */
  const deleteDocument = useCallback(
    async (documentId: string) => {
      if (!user) {
        toast.error('User not authenticated');
        return false;
      }

      try {
        const result = await DocumentService.deleteDocument(documentId);
        if (result.success) {
          const statsResult = await DocumentService.getDocumentStats(user.id);
          setDocsState((prev) => {
            const updated = prev.documents.filter((d) => d.id !== documentId);
            return {
              ...prev,
              documents: updated,
              stats: statsResult.success ? statsResult.data || prev.stats : prev.stats
            };
          });

          toast.success('Document deleted');
          return true;
        } else {
          throw new Error(result.error || 'Document not found');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete document';
        toast.error(message);
        return false;
      }
    },
    [user]
  );

  /**
   * Generate monthly statement
   */
  const generateMonthlyStatement = useCallback(
    async (year: number, month: number) => {
      if (!user) {
        toast.error('User not authenticated');
        return null;
      }

      try {
        const result = await DocumentService.generateMonthlyStatement(user.id, year, month, {
          accountNumber: '1234567890',
          accountType: 'Current Account',
          currency: 'NGN',
          openingBalance: 0,
          closingBalance: 0,
          totalCredit: 0,
          totalDebit: 0,
          transactionCount: 0
        });

        if (result.success && result.data) {
          const statsResult = await DocumentService.getDocumentStats(user.id);
          setDocsState((prev) => {
            const updated = [...prev.statements, result.data!];
            return {
              ...prev,
              statements: updated,
              stats: statsResult.success ? statsResult.data || prev.stats : prev.stats
            };
          });

          toast.success('Statement generated');
          return result.data;
        } else {
          throw new Error(result.error || 'Failed to generate statement');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate statement';
        toast.error(message);
        return null;
      }
    },
    [user]
  );

  /**
   * Share document
   */
  const shareDocument = useCallback(async (documentId: string) => {
    try {
      const result = await DocumentService.shareDocument(documentId);
      if (result.success && result.data) {
        navigator.clipboard.writeText(result.data.shareLink);
        toast.success('Share link copied to clipboard');
        return result;
      } else {
        throw new Error(result.error || 'Failed to share');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to share document';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  /**
   * Get storage percentage
   */
  const getStoragePercentage = useCallback(async () => {
    if (!user) return 0;
    const result = await DocumentService.getStoragePercentage(user.id);
    return result.success ? result.data || 0 : 0;
  }, [user]);

  /**
   * Search documents
   */
  const searchDocuments = useCallback(
    async (query: string) => {
      if (!user) return [];
      const result = await DocumentService.searchDocuments(user.id, query);
      return result.success ? result.data || [] : [];
    },
    [user]
  );

  /**
   * Initialize - load documents on mount
   */
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return {
    // State
    documents: docsState.documents,
    statements: docsState.statements,
    receipts: docsState.receipts,
    loading: docsState.loading,
    error: docsState.error,
    stats: docsState.stats,

    // Methods
    loadDocuments,
    getDocumentsByType,
    getStatementsByDateRange,
    getReceiptsByDateRange,
    downloadDocument,
    deleteDocument,
    generateMonthlyStatement,
    shareDocument,
    getStoragePercentage,
    searchDocuments
  };
};

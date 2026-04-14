/**
 * Document Service
 * Manages documents, statements, and records
 * Integrated with Supabase database and storage
 */

import { supabase } from '../lib/supabase';
import { ErrorHandler } from '../lib/errorHandler';

export interface Document {
  id: string;
  userId: string;
  type: 'statement' | 'receipt' | 'invoice' | 'contract' | 'other';
  title: string;
  description?: string;
  fileSize: number; // in bytes
  mimeType: string;
  downloadUrl: string;
  uploadedAt: string;
  period?: string;
  relatedId?: string; // transaction or account ID
}

export interface BankStatement {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: string;
  currency: string;
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
  totalCredit: number;
  totalDebit: number;
  transactionCount: number;
  generatedAt: string;
  fileUrl: string;
}

export interface Receipt {
  id: string;
  userId: string;
  transactionId: string;
  merchant: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface DocumentStats {
  totalDocuments: number;
  totalStatements: number;
  totalReceipts: number;
  storageUsed: number; // in bytes
  storageQuota: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Internal database structures
 */
interface DBDocument {
  id: string;
  user_id: string;
  document_type: string;
  title: string;
  description?: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  period?: string;
  related_id?: string;
  uploaded_at: string;
}

interface DBBankStatement {
  id: string;
  user_id: string;
  account_number: string;
  account_type: string;
  currency: string;
  start_date: string;
  end_date: string;
  opening_balance: number;
  closing_balance: number;
  total_credit: number;
  total_debit: number;
  transaction_count: number;
  generated_at: string;
  storage_path: string;
  created_at: string;
}

export class DocumentService {
  private static readonly STORAGE_BUCKET = 'documents';
  private static readonly STORAGE_QUOTA = 5 * 1024 * 1024 * 1024; // 5GB

  /**
   * Get all documents for user
   */
  static async getUserDocuments(userId: string): Promise<APIResponse<Document[]>> {
    try {
      const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      const mapped = (documents as DBDocument[]).map((doc) =>
        this.mapDBDocumentToDocument(doc)
      );

      return { success: true, data: mapped };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get documents by type
   */
  static async getDocumentsByType(
    userId: string,
    type: Document['type']
  ): Promise<APIResponse<Document[]>> {
    try {
      const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .eq('document_type', type)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      const mapped = (documents as DBDocument[]).map((doc) =>
        this.mapDBDocumentToDocument(doc)
      );

      return { success: true, data: mapped };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get document by ID
   */
  static async getDocumentById(documentId: string): Promise<APIResponse<Document | null>> {
    try {
      const { data: document, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBDocumentToDocument(document as DBDocument) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get bank statements
   */
  static async getUserStatements(userId: string): Promise<APIResponse<BankStatement[]>> {
    try {
      const { data: statements, error } = await supabase
        .from('bank_statements')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (statements as DBBankStatement[]).map((stmt) =>
        this.mapDBStatementToStatement(stmt)
      );

      return { success: true, data: mapped };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get statement by ID
   */
  static async getStatementById(statementId: string): Promise<APIResponse<BankStatement | null>> {
    try {
      const { data: statement, error } = await supabase
        .from('bank_statements')
        .select('*')
        .eq('id', statementId)
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBStatementToStatement(statement as DBBankStatement) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get statements by date range
   */
  static async getStatementsByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<APIResponse<BankStatement[]>> {
    try {
      const { data: statements, error } = await supabase
        .from('bank_statements')
        .select('*')
        .eq('user_id', userId)
        .gte('end_date', startDate)
        .lte('start_date', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (statements as DBBankStatement[]).map((stmt) =>
        this.mapDBStatementToStatement(stmt)
      );

      return { success: true, data: mapped };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Upload document
   */
  static async uploadDocument(
    userId: string,
    file: File,
    documentData: {
      type: Document['type'];
      title: string;
      description?: string;
      period?: string;
      relatedId?: string;
    }
  ): Promise<APIResponse<Document>> {
    try {
      // Upload file to Supabase Storage
      const fileName = `${userId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL for the file
      const { data: urlData } = supabase.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(uploadData.path);

      // Create document record in database
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert([
          {
            user_id: userId,
            document_type: documentData.type,
            title: documentData.title,
            description: documentData.description,
            file_size: file.size,
            mime_type: file.type,
            storage_path: uploadData.path,
            period: documentData.period,
            related_id: documentData.relatedId,
            uploaded_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      return { success: true, data: this.mapDBDocumentToDocument(document as DBDocument, urlData.publicUrl) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Download document
   */
  static async downloadDocument(documentId: string): Promise<APIResponse<{ url: string; filename: string }>> {
    try {
      const result = await this.getDocumentById(documentId);
      if (!result.success || !result.data) {
        return { success: false, error: 'Document not found' };
      }

      const doc = result.data;
      return {
        success: true,
        data: {
          url: doc.downloadUrl,
          filename: doc.title
        }
      };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Delete document
   */
  static async deleteDocument(documentId: string): Promise<APIResponse<void>> {
    try {
      // Get document to find storage path
      const result = await this.getDocumentById(documentId);
      if (!result.success || !result.data) {
        return { success: false, error: 'Document not found' };
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .remove([`${(result.data as any).storagePath}`]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      return { success: true };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get document statistics
   */
  static async getDocumentStats(userId: string): Promise<APIResponse<DocumentStats>> {
    try {
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('file_size')
        .eq('user_id', userId);

      if (docError) throw docError;

      const { data: statements, error: stmtError } = await supabase
        .from('bank_statements')
        .select('*')
        .eq('user_id', userId);

      if (stmtError) throw stmtError;

      const docList = (documents as any[]) || [];
      const stmtList = (statements as DBBankStatement[]) || [];

      const allDocs = await this.getUserDocuments(userId);
      const allReceipts = docList.filter(
        (d: any) => (d as any).document_type === 'receipt'
      );

      const storageUsed = docList.reduce((sum: number, d: any) => sum + (d.file_size || 0), 0);

      return {
        success: true,
        data: {
          totalDocuments: docList.length,
          totalStatements: stmtList.length,
          totalReceipts: allReceipts.length,
          storageUsed,
          storageQuota: this.STORAGE_QUOTA
        }
      };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Generate monthly statement
   */
  static async generateMonthlyStatement(
    userId: string,
    year: number,
    month: number,
    statementData: {
      accountNumber: string;
      accountType: string;
      currency: string;
      openingBalance: number;
      closingBalance: number;
      totalCredit: number;
      totalDebit: number;
      transactionCount: number;
    }
  ): Promise<APIResponse<BankStatement>> {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

      const { data: statement, error } = await supabase
        .from('bank_statements')
        .insert([
          {
            user_id: userId,
            account_number: statementData.accountNumber,
            account_type: statementData.accountType,
            currency: statementData.currency,
            start_date: startDate,
            end_date: endDate,
            opening_balance: statementData.openingBalance,
            closing_balance: statementData.closingBalance,
            total_credit: statementData.totalCredit,
            total_debit: statementData.totalDebit,
            transaction_count: statementData.transactionCount,
            generated_at: new Date().toISOString(),
            storage_path: `statements/${userId}/${year}-${String(month).padStart(2, '0')}.pdf`
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBStatementToStatement(statement as DBBankStatement) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Share document
   */
  static async shareDocument(documentId: string): Promise<APIResponse<{ shareLink: string }>> {
    try {
      const result = await this.getDocumentById(documentId);
      if (!result.success || !result.data) {
        return { success: false, error: 'Document not found' };
      }

      // Generate a simple share link (in production, use secure tokens)
      const shareLink = `${result.data.downloadUrl}?shared=true`;
      return { success: true, data: { shareLink } };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get storage usage percentage
   */
  static async getStoragePercentage(userId: string): Promise<APIResponse<number>> {
    try {
      const statsResult = await this.getDocumentStats(userId);
      if (!statsResult.success || !statsResult.data) {
        return { success: false, error: 'Failed to get stats' };
      }

      const percentage = (statsResult.data.storageUsed / statsResult.data.storageQuota) * 100;
      return { success: true, data: Math.round(percentage * 100) / 100 };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Search documents
   */
  static async searchDocuments(userId: string, query: string): Promise<APIResponse<Document[]>> {
    try {
      const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      const mapped = (documents as DBDocument[]).map((doc) =>
        this.mapDBDocumentToDocument(doc)
      );

      return { success: true, data: mapped };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Archive document
   */
  static async archiveDocument(documentId: string): Promise<APIResponse<Document>> {
    try {
      const { data: document, error } = await supabase
        .from('documents')
        .update({ document_type: 'other' })
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: this.mapDBDocumentToDocument(document as DBDocument) };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Get documents by category
   */
  static async getDocumentsByCategory(
    userId: string
  ): Promise<APIResponse<Record<string, Document[]>>> {
    try {
      const docResult = await this.getUserDocuments(userId);
      if (!docResult.success || !docResult.data) {
        return { success: true, data: {} };
      }

      const grouped: Record<string, Document[]> = {};
      docResult.data.forEach((doc) => {
        if (!grouped[doc.type]) {
          grouped[doc.type] = [];
        }
        grouped[doc.type].push(doc);
      });

      return { success: true, data: grouped };
    } catch (error) {
      return { success: false, error: ErrorHandler.getAPIError(error) };
    }
  }

  /**
   * Helper to map database document to Document interface
   */
  private static mapDBDocumentToDocument(dbDoc: DBDocument, publicUrl?: string): Document {
    // Generate public URL if not provided
    let downloadUrl = publicUrl;
    if (!downloadUrl && dbDoc.storage_path) {
      const { data } = supabase.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(dbDoc.storage_path);
      downloadUrl = data.publicUrl;
    }

    return {
      id: dbDoc.id,
      userId: dbDoc.user_id,
      type: dbDoc.document_type as Document['type'],
      title: dbDoc.title,
      description: dbDoc.description,
      fileSize: dbDoc.file_size,
      mimeType: dbDoc.mime_type,
      downloadUrl: downloadUrl || '',
      uploadedAt: dbDoc.uploaded_at,
      period: dbDoc.period,
      relatedId: dbDoc.related_id
    };
  }

  /**
   * Helper to map database statement to BankStatement interface
   */
  private static mapDBStatementToStatement(dbStmt: DBBankStatement): BankStatement {
    const { data } = supabase.storage
      .from(this.STORAGE_BUCKET)
      .getPublicUrl(dbStmt.storage_path);

    return {
      id: dbStmt.id,
      userId: dbStmt.user_id,
      accountNumber: dbStmt.account_number,
      accountType: dbStmt.account_type,
      currency: dbStmt.currency,
      startDate: dbStmt.start_date,
      endDate: dbStmt.end_date,
      openingBalance: dbStmt.opening_balance,
      closingBalance: dbStmt.closing_balance,
      totalCredit: dbStmt.total_credit,
      totalDebit: dbStmt.total_debit,
      transactionCount: dbStmt.transaction_count,
      generatedAt: dbStmt.generated_at,
      fileUrl: data.publicUrl
    };
  }
}

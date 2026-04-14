/**
 * Error Handler Utilities
 * Maps Supabase and API errors to user-friendly messages
 */

export interface ParsedError {
  code?: string;
  message: string;
  isDuplicate?: boolean;
  isNotFound?: boolean;
  isValidationError?: boolean;
}

/**
 * Parse various error types and return standardized error information
 */
export function parseError(error: any): ParsedError {
  if (!error) {
    return { message: 'An unknown error occurred' };
  }

  // Handle Supabase PostgreSQL errors
  if (error.code) {
    const code = error.code;

    // 23505: Unique constraint violation
    if (code === '23505') {
      return {
        code,
        message: 'This record already exists',
        isDuplicate: true
      };
    }

    // 23503: Foreign key constraint violation
    if (code === '23503') {
      return {
        code,
        message: 'Referenced record does not exist',
        isValidationError: true
      };
    }

    // 23502: Not null constraint violation
    if (code === '23502') {
      return {
        code,
        message: 'Required field is missing',
        isValidationError: true
      };
    }

    // PGRST116: Resource not found
    if (code === 'PGRST116') {
      return {
        code,
        message: 'Record not found',
        isNotFound: true
      };
    }

    // PGRST100: Auth required
    if (code === 'PGRST100') {
      return {
        code,
        message: 'Authentication required',
        isValidationError: true
      };
    }
  }

  // Handle error messages
  if (error.message) {
    const message = error.message.toLowerCase();

    if (message.includes('duplicate') || message.includes('already exists')) {
      return {
        message: 'This record already exists',
        isDuplicate: true
      };
    }

    if (message.includes('not found') || message.includes('no rows')) {
      return {
        message: 'Record not found',
        isNotFound: true
      };
    }

    if (message.includes('jwt') || message.includes('unauthorized')) {
      return {
        message: 'Authentication failed. Please log in again.',
        isValidationError: true
      };
    }

    if (message.includes('foreign key')) {
      return {
        message: 'Invalid reference. Related record not found.',
        isValidationError: true
      };
    }

    return {
      message: error.message
    };
  }

  // Handle error description (Supabase auth errors)
  if (error.error_description) {
    return {
      message: error.error_description
    };
  }

  // Handle details field
  if (error.details) {
    return {
      message: error.details
    };
  }

  // Handle HTTP errors
  if (error.status) {
    return {
      code: `HTTP${error.status}`,
      message: getHTTPErrorMessage(error.status)
    };
  }

  return {
    message: 'An unexpected error occurred'
  };
}

/**
 * Get user-friendly message for HTTP status codes
 */
function getHTTPErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Authentication required. Please log in.',
    403: 'You do not have permission to perform this action.',
    404: 'Resource not found.',
    408: 'Request timed out. Please try again.',
    409: 'This action conflicts with the current state. Please refresh and try again.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Server error. Please try again later.',
    502: 'Bad gateway. Please try again later.',
    503: 'Service temporarily unavailable. Please try again later.',
    504: 'Request timeout. Please check your connection and try again.'
  };

  return messages[status] || `An error occurred (${status})`;
}

/**
 * Error handler class for service operations
 */
export class ErrorHandler {
  /**
   * Extract user-friendly error message from any error
   */
  static getAPIError(error: any): string {
    return parseError(error).message;
  }

  /**
   * Check if error is a duplicate record error
   */
  static isDuplicate(error: any): boolean {
    return parseError(error).isDuplicate ?? false;
  }

  /**
   * Check if error is a not found error
   */
  static isNotFound(error: any): boolean {
    return parseError(error).isNotFound ?? false;
  }

  /**
   * Check if error is a validation error
   */
  static isValidationError(error: any): boolean {
    return parseError(error).isValidationError ?? false;
  }

  /**
   * Get full error information
   */
  static getErrorInfo(error: any): ParsedError {
    return parseError(error);
  }

  /**
   * Log error for debugging while showing user-friendly message
   */
  static logError(error: any, context: string = ''): string {
    const parsed = parseError(error);

    // Log full error for debugging
    if (context) {
      console.error(`[${context}]`, error);
    } else {
      console.error('Error:', error);
    }

    return parsed.message;
  }
}

// Export for convenience
export default ErrorHandler;

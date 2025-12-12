// Firebase Error Handler Utility
// Handles Firebase quota and other errors gracefully

export interface FirebaseErrorResponse {
  success: false;
  error: string;
  errorCode?: string;
  isQuotaError?: boolean;
  retryAfter?: number;
}

export function handleFirebaseError(err: any): FirebaseErrorResponse {
  const errorMessage = err instanceof Error ? err.message : String(err);
  const errorCode = err?.code || '';
  
  // Check for quota exceeded errors
  if (
    errorMessage.includes('RESOURCE_EXHAUSTED') ||
    errorMessage.includes('Quota exceeded') ||
    errorCode === 'resource-exhausted' ||
    errorCode === 8
  ) {
    return {
      success: false,
      error: 'Firebase quota exceeded. Please try again later or upgrade your plan.',
      errorCode: 'QUOTA_EXCEEDED',
      isQuotaError: true,
      retryAfter: 3600 // 1 hour in seconds
    };
  }
  
  // Check for permission denied
  if (
    errorMessage.includes('PERMISSION_DENIED') ||
    errorMessage.includes('Missing or insufficient permissions') ||
    errorCode === 'permission-denied' ||
    errorCode === 7
  ) {
    return {
      success: false,
      error: 'Permission denied. Please check your Firebase security rules.',
      errorCode: 'PERMISSION_DENIED'
    };
  }
  
  // Check for not found
  if (
    errorMessage.includes('NOT_FOUND') ||
    errorMessage.includes('not found') ||
    errorCode === 'not-found' ||
    errorCode === 5
  ) {
    return {
      success: false,
      error: 'Resource not found.',
      errorCode: 'NOT_FOUND'
    };
  }
  
  // Check for deadline exceeded (timeout)
  if (
    errorMessage.includes('DEADLINE_EXCEEDED') ||
    errorMessage.includes('deadline exceeded') ||
    errorCode === 'deadline-exceeded' ||
    errorCode === 4
  ) {
    return {
      success: false,
      error: 'Request timed out. Please try again.',
      errorCode: 'DEADLINE_EXCEEDED'
    };
  }
  
  // Check for unavailable
  if (
    errorMessage.includes('UNAVAILABLE') ||
    errorMessage.includes('unavailable') ||
    errorCode === 'unavailable' ||
    errorCode === 14
  ) {
    return {
      success: false,
      error: 'Service temporarily unavailable. Please try again.',
      errorCode: 'UNAVAILABLE',
      retryAfter: 60 // 1 minute
    };
  }
  
  // Generic error
  return {
    success: false,
    error: errorMessage || 'An error occurred while processing your request.',
    errorCode: 'UNKNOWN'
  };
}

// User-friendly error messages for the frontend
export function getUserFriendlyErrorMessage(errorCode?: string): string {
  switch (errorCode) {
    case 'QUOTA_EXCEEDED':
      return '⚠️ Firebase quota exceeded. This usually resets within 24 hours. Consider upgrading your Firebase plan for higher limits.';
    case 'PERMISSION_DENIED':
      return '🔒 Access denied. Please contact the administrator.';
    case 'NOT_FOUND':
      return '❌ Requested resource not found.';
    case 'DEADLINE_EXCEEDED':
      return '⏱️ Request timed out. Please try again.';
    case 'UNAVAILABLE':
      return '🔧 Service temporarily unavailable. Please try again in a few moments.';
    default:
      return '❌ An error occurred. Please try again or contact support.';
  }
}


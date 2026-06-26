// Professional error messages for different scenarios
export const ERROR_MESSAGES = {
  // Network & Connection Errors
  NETWORK_ERROR: {
    title: 'Connection Issue',
    message: 'Unable to connect to our servers. Please check your internet connection and try again.',
    action: 'If the problem persists, please contact your network administrator.',
  },
  SERVER_NOT_RESPONDING: {
    title: 'Service Unavailable',
    message: 'Our servers are taking longer than expected to respond.',
    action: 'Please wait a moment and try again.',
  },
  TIMEOUT_ERROR: {
    title: 'Request Timeout',
    message: 'The request took too long to complete.',
    action: 'Please check your connection and try again.',
  },

  // Server Errors (5xx)
  INTERNAL_SERVER_ERROR: {
    title: 'Server Error',
    message: 'Something went wrong on our end. Our technical team has been automatically notified.',
    action: 'Please try again in a few minutes. If the issue continues, please contact support.',
  },
  SERVICE_UNAVAILABLE: {
    title: 'Service Temporarily Unavailable',
    message: 'We are currently performing maintenance on our servers.',
    action: 'Please try again in a few minutes. We apologize for the inconvenience.',
  },
  BAD_GATEWAY: {
    title: 'Service Disruption',
    message: 'We are experiencing some technical difficulties.',
    action: 'Please refresh the page and try again. If the issue persists, contact support.',
  },

  // Client Errors (4xx)
  UNAUTHORIZED: {
    title: 'Authentication Required',
    message: 'Please log in to access this feature.',
    action: 'You will be redirected to the login page.',
  },
  FORBIDDEN: {
    title: 'Access Denied',
    message: 'You do not have permission to perform this action.',
    action: 'Please contact your administrator if you believe this is an error.',
  },
  NOT_FOUND: {
    title: 'Resource Not Found',
    message: 'The requested resource could not be found.',
    action: 'Please check the URL or contact support if you need assistance.',
  },
  VALIDATION_ERROR: {
    title: 'Invalid Information',
    message: 'Please check your input and try again.',
    action: 'Make sure all required fields are filled correctly.',
  },
  TOO_MANY_REQUESTS: {
    title: 'Rate Limit Exceeded',
    message: 'You have made too many requests. Please wait before trying again.',
    action: 'For security reasons, please wait a few moments before continuing.',
  },

  // Authentication Specific
  INVALID_CREDENTIALS: {
    title: 'Invalid Credentials',
    message: 'The email or password you entered is incorrect.',
    action: 'Please check your credentials and try again.',
  },
  ACCOUNT_LOCKED: {
    title: 'Account Temporarily Locked',
    message: 'Your account has been locked due to multiple failed login attempts.',
    action: 'Please try again later or contact support for assistance.',
  },
  EMAIL_NOT_VERIFIED: {
    title: 'Email Not Verified',
    message: 'Please verify your email address before logging in.',
    action: 'Check your inbox for the verification email or request a new one.',
  },
  SESSION_EXPIRED: {
    title: 'Session Expired',
    message: 'Your session has expired for security reasons.',
    action: 'Please log in again to continue.',
  },

  // Registration Specific
  EMAIL_ALREADY_EXISTS: {
    title: 'Email Already Registered',
    message: 'An account with this email address already exists.',
    action: 'Please use a different email or try logging in.',
  },
  WEAK_PASSWORD: {
    title: 'Weak Password',
    message: 'Your password does not meet our security requirements.',
    action: 'Please use a stronger password with at least 8 characters, including uppercase, lowercase, and numbers.',
  },
  INVALID_EMAIL_FORMAT: {
    title: 'Invalid Email Format',
    message: 'The email address you entered is not valid.',
    action: 'Please enter a valid email address.',
  },

  // File Upload Errors
  FILE_TOO_LARGE: {
    title: 'File Too Large',
    message: 'The file you are trying to upload exceeds the maximum allowed size.',
    action: 'Please compress the file or choose a smaller one.',
  },
  INVALID_FILE_TYPE: {
    title: 'Invalid File Type',
    message: 'This file type is not supported.',
    action: 'Please upload a valid file format.',
  },
  UPLOAD_FAILED: {
    title: 'Upload Failed',
    message: 'We encountered an issue while uploading your file.',
    action: 'Please try again or choose a different file.',
  },

  // Payment & Financial
  PAYMENT_FAILED: {
    title: 'Payment Failed',
    message: 'We were unable to process your payment.',
    action: 'Please check your payment details and try again, or contact your bank.',
  },
  INSUFFICIENT_FUNDS: {
    title: 'Insufficient Funds',
    message: 'You do not have sufficient funds to complete this transaction.',
    action: 'Please add funds to your account or use a different payment method.',
  },

  // Generic Fallback
  GENERIC_ERROR: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred.',
    action: 'Please try again. If the problem persists, contact our support team.',
  },
};

// Helper function to get appropriate error message
export const getErrorMessage = (error: any): { title: string; message: string; action: string } => {
  // Network errors (no response at all)
  if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT_ERROR;
  }

  // HTTP errors — always prefer the backend message
  if (error.response) {
    const status = error.response.status;
    switch (status) {
      case 0:
        return ERROR_MESSAGES.SERVER_NOT_RESPONDING;
      case 429:
        return ERROR_MESSAGES.TOO_MANY_REQUESTS;
      case 500:
        return ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
      case 502:
        return ERROR_MESSAGES.BAD_GATEWAY;
      case 503:
        return ERROR_MESSAGES.SERVICE_UNAVAILABLE;
      case 504:
        return ERROR_MESSAGES.TIMEOUT_ERROR;
      default:
        return ERROR_MESSAGES.GENERIC_ERROR;
    }
  }

  return ERROR_MESSAGES.GENERIC_ERROR;
};

/**
 * Primary utility — always returns the backend API message when available.
 * Only falls back to a generic description for network/infrastructure errors
 * that have no meaningful server response (e.g. no internet, timeout, 5xx).
 */
export const getApiErrorMessage = (error: any): string => {
  // Backend sent a message — use it verbatim
  const apiMessage = error?.response?.data?.message;
  if (apiMessage) {
    return Array.isArray(apiMessage) ? apiMessage.join(', ') : String(apiMessage);
  }

  // No response (network / infrastructure failures) — use generic
  if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
    return ERROR_MESSAGES.NETWORK_ERROR.message;
  }
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT_ERROR.message;
  }
  if (error.response?.status === 500) return ERROR_MESSAGES.INTERNAL_SERVER_ERROR.message;
  if (error.response?.status === 502) return ERROR_MESSAGES.BAD_GATEWAY.message;
  if (error.response?.status === 503) return ERROR_MESSAGES.SERVICE_UNAVAILABLE.message;
  if (error.response?.status === 504) return ERROR_MESSAGES.TIMEOUT_ERROR.message;

  return ERROR_MESSAGES.GENERIC_ERROR.message;
};

// Kept for backward compatibility — delegates to getApiErrorMessage
export const formatErrorForToast = (error: any): string => getApiErrorMessage(error);

// Kept for backward compatibility
export const getErrorTitle = (error: any): string => {
  const apiMessage = error?.response?.data?.message;
  if (apiMessage) return '';          // no separate title needed when message comes from API
  return getErrorMessage(error).title;
};

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
  // Network errors
  if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT_ERROR;
  }

  // HTTP status codes
  if (error.response) {
    const status = error.response.status;
    
    switch (status) {
      case 0:
        return ERROR_MESSAGES.SERVER_NOT_RESPONDING;
      case 400:
        // Check for specific validation errors
        if (error.response.data?.message?.includes('password')) {
          return ERROR_MESSAGES.WEAK_PASSWORD;
        }
        if (error.response.data?.message?.includes('email')) {
          return ERROR_MESSAGES.INVALID_EMAIL_FORMAT;
        }
        return ERROR_MESSAGES.VALIDATION_ERROR;
      case 401:
        if (error.response.data?.message?.includes('expired')) {
          return ERROR_MESSAGES.SESSION_EXPIRED;
        }
        if (error.response.data?.message?.includes('credentials')) {
          return ERROR_MESSAGES.INVALID_CREDENTIALS;
        }
        if (error.response.data?.message?.includes('locked')) {
          return ERROR_MESSAGES.ACCOUNT_LOCKED;
        }
        if (error.response.data?.message?.includes('verified')) {
          return ERROR_MESSAGES.EMAIL_NOT_VERIFIED;
        }
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.FORBIDDEN;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND;
      case 409:
        if (error.response.data?.message?.includes('email')) {
          return ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
        }
        return ERROR_MESSAGES.VALIDATION_ERROR;
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

  // Check for specific error messages from backend
  if (error.response?.data?.message) {
    const backendMessage = error.response.data.message.toLowerCase();
    
    if (backendMessage.includes('password')) {
      return ERROR_MESSAGES.WEAK_PASSWORD;
    }
    if (backendMessage.includes('email') && backendMessage.includes('exists')) {
      return ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
    }
    if (backendMessage.includes('credentials') || backendMessage.includes('invalid')) {
      return ERROR_MESSAGES.INVALID_CREDENTIALS;
    }
  }

  // Fallback to generic error
  return ERROR_MESSAGES.GENERIC_ERROR;
};

// Helper function to format error message for toast notifications
export const formatErrorForToast = (error: any): string => {
  const errorInfo = getErrorMessage(error);
  return `${errorInfo.message} ${errorInfo.action}`;
};

// Helper function to get error title
export const getErrorTitle = (error: any): string => {
  return getErrorMessage(error).title;
};

# Error Handling Guide

This guide explains how to handle errors professionally in the Urutix application.

## Overview

We've implemented a centralized error handling system that provides:
- User-friendly error messages
- Consistent error display across the application
- Professional communication for different error scenarios
- Easy-to-use components and utilities

## Error Message Configuration

All error messages are defined in `src/config/errorMessages.ts`. This file contains:
- Professional error titles and messages
- Actionable guidance for users
- Helper functions to format errors

### Example Error Messages

```typescript
// Network Error
{
  title: 'Connection Issue',
  message: 'Unable to connect to our servers.',
  action: 'Please check your internet connection and try again.'
}

// Server Error
{
  title: 'Server Error',
  message: 'Something went wrong on our end.',
  action: 'Our technical team has been automatically notified.'
}
```

## Usage in Components

### 1. Using the ErrorDisplay Component

```tsx
import { ErrorDisplay } from '../components/common/ErrorHandler';

function MyComponent() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.getData();
      setData(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={fetchData}
        className="my-4"
      />
    );
  }

  return <div>...</div>;
}
```

### 2. Using the useErrorHandler Hook

```tsx
import { useErrorHandler } from '../components/common/ErrorHandler';
import { toast } from 'react-hot-toast';

function MyComponent() {
  const { handleError } = useErrorHandler();

  const handleSubmit = async (data: FormData) => {
    try {
      await api.submit(data);
      toast.success('Submitted successfully!');
    } catch (error) {
      const { fullMessage } = handleError(error);
      toast.error(fullMessage);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 3. Direct Error Message Formatting

```tsx
import { formatErrorForToast, getErrorTitle } from '../config/errorMessages';

try {
  await api.someAction();
} catch (error) {
  const message = formatErrorForToast(error);
  const title = getErrorTitle(error);
  toast.error(`${title}: ${message}`);
}
```

## Error Types Handled

### Network Errors
- **Connection Issue**: When the client can't reach the server
- **Server Not Responding**: When the server is down or unreachable
- **Timeout**: When requests take too long

### Server Errors (5xx)
- **Internal Server Error** (500): Generic server errors
- **Service Unavailable** (503): Maintenance or temporary issues
- **Bad Gateway** (502): Proxy/server communication issues

### Client Errors (4xx)
- **Unauthorized** (401): Authentication required
- **Forbidden** (403): Insufficient permissions
- **Not Found** (404): Resource doesn't exist
- **Validation Error** (400): Invalid input data
- **Too Many Requests** (429): Rate limiting

### Authentication Specific
- **Invalid Credentials**: Wrong email/password
- **Account Locked**: Too many failed attempts
- **Email Not Verified**: Verification required
- **Session Expired**: Token expired

### Registration Specific
- **Email Already Exists**: Duplicate registration
- **Weak Password**: Password doesn't meet requirements
- **Invalid Email Format**: Malformed email

## Best Practices

### 1. Always Provide Context
```tsx
// Good
const { fullMessage } = handleError(error);
toast.error(`Failed to save settings: ${fullMessage}`);

// Bad
toast.error('Error occurred');
```

### 2. Offer Solutions When Possible
```tsx
// The ErrorDisplay component automatically includes retry buttons
<ErrorDisplay error={error} onRetry={retryAction} />
```

### 3. Log Errors for Debugging
```tsx
try {
  await api.action();
} catch (error) {
  console.error('API Action Error:', error);
  // Handle user-facing error
}
```

### 4. Use Appropriate Error Boundaries
```tsx
import { withErrorHandling } from '../components/common/ErrorHandler';

const MyComponent = withErrorHandling(({ data }) => {
  return <div>{data}</div>;
});
```

## Custom Error Messages

To add custom error messages:

1. Update `errorMessages.ts`:
```typescript
export const ERROR_MESSAGES = {
  // ... existing errors
  CUSTOM_BUSINESS_ERROR: {
    title: 'Business Rule Violation',
    message: 'This action violates our business rules.',
    action: 'Please review your input and try again.',
  },
};
```

2. Update the `getErrorMessage` function to handle your specific error:
```typescript
if (error.response?.data?.code === 'CUSTOM_BUSINESS_ERROR') {
  return ERROR_MESSAGES.CUSTOM_BUSINESS_ERROR;
}
```

## Testing Error Handling

When testing error scenarios:

1. **Network Errors**: Disconnect from internet or use wrong URL
2. **Server Errors**: Return 500 status from mock API
3. **Validation Errors**: Send invalid data to API
4. **Authentication Errors**: Use expired/invalid tokens

## Migration Guide

To migrate existing error handling:

1. Replace direct error messages:
```tsx
// Before
catch (error) {
  toast.error(error.response?.data?.message || 'An error occurred');
}

// After
catch (error) {
  const { fullMessage } = handleError(error);
  toast.error(fullMessage);
}
```

2. Replace inline error displays:
```tsx
// Before
{error && <div className="text-red-500">{error.message}</div>}

// After
{error && <ErrorDisplay error={error} />}
```

## Accessibility Considerations

- Error messages are announced to screen readers
- Icons have appropriate alt text
- Retry buttons are keyboard accessible
- Color is not the only indicator of error state

## Performance Considerations

- Error messages are pre-defined and cached
- No dynamic message generation at runtime
- Minimal overhead for error formatting

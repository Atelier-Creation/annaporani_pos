# Global Toast Error Handling System

## Overview
A centralized toast notification system has been implemented to display all API errors throughout the entire application.

## Implementation Details

### 1. API Interceptor (`src/api/api.js`)
- Added a response interceptor to the Axios instance
- Automatically catches all API errors from any endpoint
- Displays user-friendly error messages using Ant Design's `message` component

### 2. Error Handling Features

#### Handled HTTP Status Codes:
- **400** - Invalid request
- **401** - Unauthorized (redirects to login, except for login requests)
- **403** - Access denied
- **404** - Resource not found
- **409** - Conflict (resource already exists)
- **422** - Validation error
- **500** - Server error
- **502** - Server unavailable
- **503** - Service temporarily unavailable

#### Network Error Handling:
- Detects when no response is received
- Shows "Network error. Please check your connection"

#### Custom Backend Messages:
- Prioritizes backend error messages from `response.data.message`
- Falls back to generic messages if none provided

### 3. Global Configuration (`src/main.jsx`)
- Wrapped the app with Ant Design's `App` component
- Enables global static methods for message, notification, and modal APIs
- Ensures toast notifications work from anywhere in the app

## How It Works

1. **Any API call fails** → Axios interceptor catches the error
2. **Error is analyzed** → Status code and message extracted
3. **Toast is displayed** → User sees a clear error message
4. **Error is re-thrown** → Component can still handle error if needed

## Benefits

✅ **Centralized** - All error handling in one place
✅ **Consistent** - Same error UX throughout the app
✅ **User-friendly** - Clear, actionable error messages
✅ **Low maintenance** - No need to add error handling in every component
✅ **Network aware** - Detects connection issues
✅ **Flexible** - Components can still add custom error handling

## Exception Handling

- **Login requests** - Errors are NOT shown via toast (let login page handle them)
- **401 errors** - Automatically log out and redirect to login
- **Component-level handling** - Components can still catch and handle errors for custom logic

## Example Error Message Display

```javascript
// No need to add error handling in components anymore!
// Just make the API call:

const fetchData = async () => {
  try {
    const response = await api.get('/endpoint');
    // Handle success
  } catch (error) {
    // Error toast is automatically shown by interceptor
    // Optionally add custom logic here
  }
};
```

## Testing

To test the error handling:
1. Make any API call that returns an error
2. Disconnect from network and make an API call
3. Try accessing unauthorized endpoints
4. The appropriate toast message should appear automatically

## Duration

Error toasts are displayed for 4 seconds by default.

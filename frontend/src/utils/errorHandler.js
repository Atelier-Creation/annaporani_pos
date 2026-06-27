import { notification } from 'antd';

/**
 * Handle API errors based on status codes
 * @param {Error} error
 */
export const handleApiError = (error) => {
  const { response } = error;
  
  if (!response) {
    notification.error({
      message: 'Network Error',
      description: 'Unable to connect to the server. Please check your internet connection.',
    });
    return;
  }
  
  const { status, data } = response;
  
  switch (status) {
    case 200: // OK
      notification.success({
        message: 'Success',
        description: data.message || 'Operation completed successfully',
      });
      break;
      
    case 201: // Created
      notification.success({
        message: 'Created',
        description: data.message || 'Resource created successfully',
      });
      break;
      
    case 400: // Bad Request
      notification.error({
        message: 'Bad Request',
        description: data.message || 'The request contains invalid parameters',
      });
      break;
      
    case 401: // Unauthorized
      notification.error({
        message: 'Unauthorized',
        description: 'Your session has expired. Please log in again.',
      });
      // Redirect to login page or clear auth state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
      break;
      
    case 404: // Not Found
      notification.error({
        message: 'Not Found',
        description: data.message || 'The requested resource was not found',
      });
      break;
      
    case 422: // Unprocessable Entity
      notification.error({
        message: 'Validation Error',
        description: data.message || 'The submitted data failed validation',
      });
      break;
      
    case 429: // Too Many Requests
      notification.warning({
        message: 'Too Many Requests',
        description: 'You have made too many requests. Please try again later.',
      });
      break;
      
    case 500: // Internal Server Error
      notification.error({
        message: 'Server Error',
        description: 'An internal server error occurred. Please try again later.',
      });
      break;
      
    default:
      notification.error({
        message: `Error ${status}`,
        description: data.message || 'An unexpected error occurred',
      });
  }
};

/**
 * Display success notification
 * @param {string} message 
 * @param {string} description 
 */
export const showSuccess = (message, description) => {
  notification.success({
    message,
    description,
  });
};

/**
 * Display error notification
 * @param {string} message 
 * @param {string} description
 */
export const showError = (message, description) => {
  notification.error({
    message,
    description,
  });
};

/**
 * Display warning notification
 * @param {string} message 
 * @param {string} description
 */
export const showWarning = (message, description) => {
  notification.warning({
    message,
    description,
  });
};

/**
 * Display info notification
 * @param {string} message 
 * @param {string} description
 */
export const showInfo = (message, description) => {
  notification.info({
    message,
    description,
  });
};
export class AppError extends Error {
  code: string;
  status: number;
  
  constructor(message: string, code = 'INTERNAL_SERVER_ERROR', status = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

export const handleApiError = (error: any): AppError => {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error.response) {
    // Handle Axios error
    const status = error.response.status;
    const data = error.response.data;
    
    let code = 'API_ERROR';
    let message = 'An error occurred while communicating with the API';
    
    if (status === 400) {
      code = 'BAD_REQUEST';
      message = data.message || 'Bad request';
    } else if (status === 401) {
      code = 'UNAUTHORIZED';
      message = data.message || 'Unauthorized';
    } else if (status === 403) {
      code = 'FORBIDDEN';
      message = data.message || 'Forbidden';
    } else if (status === 404) {
      code = 'NOT_FOUND';
      message = data.message || 'Resource not found';
    } else if (status === 422) {
      code = 'VALIDATION_ERROR';
      message = data.message || 'Validation error';
    } else if (status >= 500) {
      code = 'SERVER_ERROR';
      message = data.message || 'Server error';
    }
    
    return new AppError(message, code, status);
  }
  
  return new AppError(
    error.message || 'An unexpected error occurred',
    'INTERNAL_SERVER_ERROR',
    500
  );
};

export default {
  AppError,
  handleApiError,
};

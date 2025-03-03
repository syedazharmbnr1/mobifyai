// services/authService.ts

import api from './api';
import { handleApiError, AppError } from '../utils/error';
import { setAuthToken, setRefreshToken, clearAuthTokens } from '../utils/auth';
import { createLogger } from '../utils/logger';

const logger = createLogger('AuthService');

// User type
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role?: string;
}

// Login response type
interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

// Registration data type
interface RegistrationData {
  name: string;
  email: string;
  password: string;
}

// Authentication service
export const authService = {
  /**
   * Login with email and password
   */
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      });
      
      // Save tokens
      await setAuthToken(response.data.token);
      
      if (response.data.refreshToken) {
        await setRefreshToken(response.data.refreshToken);
      }
      
      return response.data;
    } catch (error) {
      logger.error('Login error', error);
      throw handleApiError(error);
    }
  },
  
  /**
   * Register a new user
   */
  register: async (userData: RegistrationData): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/register', userData);
      
      // Save tokens
      await setAuthToken(response.data.token);
      
      if (response.data.refreshToken) {
        await setRefreshToken(response.data.refreshToken);
      }
      
      return response.data;
    } catch (error) {
      logger.error('Registration error', error);
      throw handleApiError(error);
    }
  },
  
  /**
   * Logout the current user
   */
  logout: async (): Promise<void> => {
    try {
      // Call logout endpoint if available
      try {
        await api.post('/auth/logout');
      } catch (error) {
        // Ignore errors from logout endpoint
        logger.warn('Logout API error (ignoring)', error);
      }
      
      // Clear tokens regardless of API call result
      await clearAuthTokens();
    } catch (error) {
      logger.error('Logout error', error);
      
      // Still clear tokens even if there's an error
      await clearAuthTokens();
      
      throw handleApiError(error);
    }
  },
  
  /**
   * Get the current user's profile
   */
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get<User>('/users/me');
      return response.data;
    } catch (error) {
      logger.error('Get current user error', error);
      throw handleApiError(error);
    }
  },
  
  /**
   * Update the current user's profile
   */
  updateUser: async (userData: Partial<User>): Promise<User> => {
    try {
      const response = await api.put<User>('/users/me', userData);
      return response.data;
    } catch (error) {
      logger.error('Update user error', error);
      throw handleApiError(error);
    }
  },
  
  /**
   * Reset password
   */
  resetPassword: async (email: string): Promise<void> => {
    try {
      await api.post('/auth/reset-password', { email });
    } catch (error) {
      logger.error('Reset password error', error);
      throw handleApiError(error);
    }
  },
  
  /**
   * Confirm password reset
   */
  confirmResetPassword: async (
    token: string,
    newPassword: string
  ): Promise<void> => {
    try {
      await api.post('/auth/confirm-reset-password', {
        token,
        newPassword,
      });
    } catch (error) {
      logger.error('Confirm reset password error', error);
      throw handleApiError(error);
    }
  },
  
  /**
   * Change password
   */
  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<void> => {
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
    } catch (error) {
      logger.error('Change password error', error);
      throw handleApiError(error);
    }
  },
  
  /**
   * Verify email
   */
  verifyEmail: async (token: string): Promise<void> => {
    try {
      await api.post('/auth/verify-email', { token });
    } catch (error) {
      logger.error('Verify email error', error);
      throw handleApiError(error);
    }
  },
  
  /**
   * Resend verification email
   */
  resendVerificationEmail: async (email: string): Promise<void> => {
    try {
      await api.post('/auth/resend-verification', { email });
    } catch (error) {
      logger.error('Resend verification email error', error);
      throw handleApiError(error);
    }
  },
  
  /**
   * Get user info from OAuth token
   */
  getUserInfo: async (token: string): Promise<User> => {
    try {
      const response = await api.get<User>('/auth/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      logger.error('Get user info error', error);
      throw handleApiError(error);
    }
  },
  
  /**
   * Refresh authentication token
   */
  refreshToken: async (refreshToken: string): Promise<{
    token: string;
    refreshToken?: string;
  }> => {
    try {
      const response = await api.post<{
        token: string;
        refreshToken?: string;
      }>('/auth/refresh', { refreshToken });
      
      // Save new tokens
      await setAuthToken(response.data.token);
      
      if (response.data.refreshToken) {
        await setRefreshToken(response.data.refreshToken);
      }
      
      return response.data;
    } catch (error) {
      logger.error('Refresh token error', error);
      
      // Clear tokens on refresh error
      await clearAuthTokens();
      
      throw handleApiError(error);
    }
  },
};

export default authService;
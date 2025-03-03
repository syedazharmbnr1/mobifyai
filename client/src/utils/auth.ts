// utils/auth.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MMKV } from 'react-native-mmkv';
import jwt_decode from 'jwt-decode';
import { createLogger } from './logger';

const logger = createLogger('Auth');

// Storage keys
const TOKEN_STORAGE_KEY = 'auth_token';
const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';

// Storage instance
const storage = new MMKV();

// Interface for JWT token payload
interface TokenPayload {
  sub: string;
  email?: string;
  name?: string;
  role?: string;
  exp?: number;
  iat?: number;
}

/**
 * Get the authentication token from storage
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    // Try MMKV first (faster)
    let token = storage.getString(TOKEN_STORAGE_KEY);
    
    // Fall back to AsyncStorage if not found in MMKV
    if (!token) {
      token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      
      // Save to MMKV for future use if found in AsyncStorage
      if (token) {
        storage.set(TOKEN_STORAGE_KEY, token);
      }
    }
    
    // Check if token is valid
    if (token && isTokenExpired(token)) {
      // Token is expired, try to refresh
      const newToken = await refreshAuthToken();
      return newToken;
    }
    
    return token;
  } catch (error) {
    logger.error('Error getting auth token', error);
    return null;
  }
};

/**
 * Set the authentication token in storage
 */
export const setAuthToken = async (token: string): Promise<void> => {
  try {
    // Save to both storages for redundancy
    storage.set(TOKEN_STORAGE_KEY, token);
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (error) {
    logger.error('Error setting auth token', error);
  }
};

/**
 * Get the refresh token from storage
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    // Try MMKV first (faster)
    let token = storage.getString(REFRESH_TOKEN_STORAGE_KEY);
    
    // Fall back to AsyncStorage if not found in MMKV
    if (!token) {
      token = await AsyncStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
      
      // Save to MMKV for future use if found in AsyncStorage
      if (token) {
        storage.set(REFRESH_TOKEN_STORAGE_KEY, token);
      }
    }
    
    return token;
  } catch (error) {
    logger.error('Error getting refresh token', error);
    return null;
  }
};

/**
 * Set the refresh token in storage
 */
export const setRefreshToken = async (token: string): Promise<void> => {
  try {
    // Save to both storages for redundancy
    storage.set(REFRESH_TOKEN_STORAGE_KEY, token);
    await AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
  } catch (error) {
    logger.error('Error setting refresh token', error);
  }
};

/**
 * Clear all authentication tokens from storage
 */
export const clearAuthTokens = async (): Promise<void> => {
  try {
    // Clear from both storages
    storage.delete(TOKEN_STORAGE_KEY);
    storage.delete(REFRESH_TOKEN_STORAGE_KEY);
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch (error) {
    logger.error('Error clearing auth tokens', error);
  }
};

/**
 * Check if the JWT token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt_decode<TokenPayload>(token);
    
    // Check if token has expiration claim
    if (!decoded.exp) {
      return false;
    }
    
    // Convert exp to milliseconds and compare with current time
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    logger.error('Error decoding token', error);
    return true;
  }
};

/**
 * Get user ID from the token
 */
export const getUserIdFromToken = (token: string): string | null => {
  try {
    const decoded = jwt_decode<TokenPayload>(token);
    return decoded.sub || null;
  } catch (error) {
    logger.error('Error getting user ID from token', error);
    return null;
  }
};

/**
 * Refresh the authentication token
 */
export const refreshAuthToken = async (): Promise<string | null> => {
  try {
    const refreshToken = await getRefreshToken();
    
    if (!refreshToken) {
      // No refresh token available
      await clearAuthTokens();
      return null;
    }
    
    // Make API call to refresh the token
    const response = await fetch('https://api.example.com/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (!response.ok) {
      // Failed to refresh token
      await clearAuthTokens();
      return null;
    }
    
    const data = await response.json();
    
    // Save new tokens
    await setAuthToken(data.token);
    
    if (data.refreshToken) {
      await setRefreshToken(data.refreshToken);
    }
    
    return data.token;
  } catch (error) {
    logger.error('Error refreshing auth token', error);
    await clearAuthTokens();
    return null;
  }
};

/**
 * Get user info from token
 */
export const getUserInfoFromToken = (token: string): {
  id: string;
  email?: string;
  name?: string;
  role?: string;
} | null => {
  try {
    const decoded = jwt_decode<TokenPayload>(token);
    
    return {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
  } catch (error) {
    logger.error('Error getting user info from token', error);
    return null;
  }
};

export default {
  getAuthToken,
  setAuthToken,
  getRefreshToken,
  setRefreshToken,
  clearAuthTokens,
  isTokenExpired,
  getUserIdFromToken,
  refreshAuthToken,
  getUserInfoFromToken,
};
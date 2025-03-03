// hooksDir/useAuth.ts

import { useContext } from 'react';
import AuthContext, { User } from '../contexts/AuthContext';
import { createLogger } from '../utils/logger';

const logger = createLogger('useAuth');

export interface UseAuthResult {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithOAuth?: () => Promise<void>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  clearError: () => void;
}

const useAuth = (): UseAuthResult => {
  const context = useContext(AuthContext);

  if (!context) {
    logger.error('useAuth must be used within an AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default useAuth;
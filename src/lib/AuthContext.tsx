import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, loginUser, registerUser, logoutUser } from './firebase';
import { User } from 'firebase/auth';

// Define UserProfileData interface
interface UserProfileData {
  nickname: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, displayName: string, profileData?: UserProfileData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  const login = async (email: string, password: string) => {
    const result = await loginUser(email, password);
    return { success: result.success, error: result.success ? undefined : result.error };
  };

  const register = async (email: string, password: string, displayName: string, profileData?: UserProfileData) => {
    const result = await registerUser(email, password, displayName, profileData);
    return { success: result.success, error: result.success ? undefined : result.error };
  };

  const logout = async () => {
    const result = await logoutUser();
    return { success: result.success, error: result.success ? undefined : result.error };
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}; 
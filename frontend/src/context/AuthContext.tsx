import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import type { UserProfile } from '../utils/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  sessionId: string;
  isLoading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  updateUser: (user: UserProfile) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Initialize Session ID
    let currentSessionId = localStorage.getItem('chat_session_id');
    if (!currentSessionId) {
      currentSessionId = `session_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      localStorage.setItem('chat_session_id', currentSessionId);
    }
    setSessionId(currentSessionId);

    // 2. Hydrate token and fetch user profile
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      api.getProfile(storedToken)
        .then((profile) => {
          setUser(profile);
        })
        .catch((err) => {
          console.error('Failed to load profile, logging out:', err);
          logout();
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (authToken: string, userProfile: UserProfile) => {
    localStorage.setItem('auth_token', authToken);
    setToken(authToken);
    setUser(userProfile);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedProfile: UserProfile) => {
    setUser(updatedProfile);
  };

  const refreshProfile = async () => {
    if (token) {
      try {
        const profile = await api.getProfile(token);
        setUser(profile);
      } catch (err) {
        console.error('Failed to refresh profile:', err);
        logout();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        sessionId,
        isLoading,
        login,
        logout,
        updateUser,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

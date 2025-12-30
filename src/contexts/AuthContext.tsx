import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, loadAuthState, saveAuthState, initiateGitHubOAuth } from '@/lib/auth';

interface AuthContextType extends AuthState {
  login: () => void;
  logout: () => void;
  handleOAuthCallback: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const userResponse = await fetch(`${apiUrl}/auth/me`, {
          credentials: 'include',
        });
        if (userResponse.ok) {
          const userData: User = await userResponse.json();
          setUser(userData);
          saveAuthState(userData);
        } else {
          const storedUser = loadAuthState();
          setUser(storedUser);
          if (storedUser) {
            saveAuthState(null);
          }
        }
      } catch (e) {
        const storedUser = loadAuthState();
        setUser(storedUser);
        if (storedUser) {
          saveAuthState(null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);


  const login = () => {
    const url = initiateGitHubOAuth();
    window.location.href = url;
  };

  const handleOAuthCallback = async () => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const userResponse = await fetch(`${apiUrl}/auth/me`, {
        credentials: 'include',
      });
      if (!userResponse.ok) throw new Error('Failed to fetch user');
      const user: User = await userResponse.json();
      setUser(user);
      saveAuthState(user);
    } catch (e) {
      setUser(null);
      saveAuthState(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setUser(null);
      saveAuthState(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        handleOAuthCallback,
        logout,
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

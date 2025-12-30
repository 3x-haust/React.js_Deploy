export interface User {
  id: string;
  username: string;
  role: string;
  avatarUrl?: string;
  name?: string;
  email?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const initiateGitHubOAuth = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${apiUrl}/auth/github`;
};

const AUTH_STORAGE_KEY = 'deploy_platform_auth';

export const saveAuthState = (user: User | null) => {
  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

export const loadAuthState = (): User | null => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

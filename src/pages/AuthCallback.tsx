import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AuthCallback = () => {
  const { handleOAuthCallback, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    if (errorParam === 'unauthorized') {
      setError('허용되지 않은 유저입니다. 관리자에게 문의하세요.');
      return;
    }
    handleOAuthCallback().catch(() => {
      setError('인증에 실패했습니다.');
    });
  }, [handleOAuthCallback, location.search]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      {error ? (
        <div className="text-destructive text-lg font-semibold">{error}</div>
      ) : (
        <div className="animate-pulse text-muted-foreground">Authenticating with GitHub...</div>
      )}
    </div>
  );
};

export default AuthCallback;

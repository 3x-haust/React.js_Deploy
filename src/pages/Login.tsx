import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Github, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogin = () => {
    login();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">Deploy</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <Button
            onClick={handleLogin}
            size="xl"
            className="w-full gap-2"
          >
            <Github className="h-5 w-5" />
            Continue with GitHub
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Login;

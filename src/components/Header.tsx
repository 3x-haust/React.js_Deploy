import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Settings, User, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">Deploy</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} alt={user.name || user.username} />
                    <AvatarFallback>{(user.name || user.username).charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-0.5 leading-none">
                    <p className="font-medium text-sm">{user.name || user.username}</p>
                    {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin/users" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      User 관리
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

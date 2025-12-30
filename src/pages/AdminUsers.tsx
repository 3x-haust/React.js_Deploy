import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: number;
  githubId: string;
  username: string;
  avatarUrl?: string;
  allowed: boolean;
  role: 'admin' | 'user';
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    api.admin.getUsers()
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch users', err);
        setError(err.message);
        setLoading(false);
        toast.error('유저 목록을 불러오는데 실패했습니다.');
      });
  };

  const updateUser = (id: number, allowed: boolean, role: 'admin' | 'user') => {
    api.admin.updateUser(id, { allowed, role })
      .then((updated) => {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, allowed: updated.allowed, role: updated.role } : u))
        );
        toast.success(`${updated.username} 유저 정보가 업데이트되었습니다.`);
      })
      .catch((err) => {
        console.error('Failed to update user', err);
        toast.error('유저 정보 업데이트에 실패했습니다.');
      });
  };

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="text-destructive mb-4">Error: {error}</div>
      <button 
        onClick={fetchUsers}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="rounded-full h-10 w-10"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
      </div>

      <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead className="w-[250px]">User</TableHead>
                  <TableHead>Allowed</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-6 w-12 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-muted-foreground">{user.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-foreground font-medium">
                          <Avatar className="h-10 w-10 border border-border">
                            <AvatarImage src={user.avatarUrl} alt={user.username} />
                            <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span>{user.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={user.allowed}
                          onCheckedChange={(checked) => updateUser(user.id, checked, user.role)}
                          disabled={user.role === 'admin'}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(val: 'admin' | 'user') => updateUser(user.id, user.allowed, val)}
                          disabled={user.role === 'admin'}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        {user.role === 'admin' ? (
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-none">
                            Administrator
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Standard User
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {!loading && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

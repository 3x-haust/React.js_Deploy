import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  githubId: string;
  username: string;
  avatarUrl?: string;
  allowed: boolean;
  role: 'admin' | 'user';
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.admin.getUsers()
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch users', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const updateUser = (id: number, allowed: boolean, role: 'admin' | 'user') => {
    api.admin.updateUser(id, { allowed, role })
      .then((updated) => {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, allowed: updated.allowed, role: updated.role } : u))
        );
      })
      .catch((err) => {
        console.error('Failed to update user', err);
      });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-muted-foreground">Loading users...</div>
    </div>
  );

  if (error) return (
    <div className="p-8 text-center text-destructive">
      Error: {error}
    </div>
  );

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <table className="w-full border">
        <thead>
          <tr>
            <th>ID</th>
            <th>Avatar</th>
            <th>Username</th>
            <th>Allowed</th>
            <th>Role</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t">
              <td>{user.id}</td>
              <td>
                {user.avatarUrl && <img src={user.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full" />}
              </td>
              <td>{user.username}</td>
              <td>
                <input
                  type="checkbox"
                  checked={user.allowed}
                  onChange={(e) => updateUser(user.id, e.target.checked, user.role)}
                  disabled={user.role === 'admin'}
                />
              </td>
              <td>
                <select
                  value={user.role}
                  onChange={(e) => updateUser(user.id, user.allowed, e.target.value as 'admin' | 'user')}
                  disabled={user.role === 'admin'}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td>
                {user.role === 'admin' ? '관리자' : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

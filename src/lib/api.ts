const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

export const api = {
  projects: {
    getAll: () => fetchWithAuth('/projects'),
    getOne: (id: number) => fetchWithAuth(`/projects/${id}`),
    create: (data: unknown) =>
      fetchWithAuth('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      fetchWithAuth(`/projects/${id}`, {
        method: 'DELETE',
      }),
    updateSettings: (id: number, data: unknown) =>
      fetchWithAuth(`/projects/${id}/settings`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    addEnvVariable: (id: number, data: unknown) =>
      fetchWithAuth(`/projects/${id}/env`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deleteEnvVariable: (id: number, envKey: string) =>
      fetchWithAuth(`/projects/${id}/env/${envKey}`, {
        method: 'DELETE',
      }),
    getSettings: (id: number) => fetchWithAuth(`/projects/${id}/settings`),
    getMembers: (id: number) => fetchWithAuth(`/projects/${id}/members`),
    inviteMember: (id: number, username: string) =>
      fetchWithAuth(`/projects/${id}/members`, {
        method: 'POST',
        body: JSON.stringify({ username }),
      }),
    removeMember: (id: number, userId: number) =>
      fetchWithAuth(`/projects/${id}/members/${userId}`, {
        method: 'DELETE',
      }),
  },
  repositories: {
    getAll: () => fetchWithAuth('/github/repositories'),
  },
  deployments: {
    getAll: (projectId: number) =>
      fetchWithAuth(`/projects/${projectId}/deployments`),
    getOne: (projectId: number, id: number) =>
      fetchWithAuth(`/projects/${projectId}/deployments/${id}`),
    create: (projectId: number, data: unknown) =>
      fetchWithAuth(`/projects/${projectId}/deployments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    redeploy: (projectId: number) =>
      fetchWithAuth(`/projects/${projectId}/deployments/redeploy`, {
        method: 'POST',
      }),
  },
};


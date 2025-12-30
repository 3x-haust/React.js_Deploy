export interface Repository {
  id: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  defaultBranch: string;
  language: string;
  private: boolean;
  updatedAt: string;
}

export interface Deployment {
  id: number;
  projectId: string;
  status: 'building' | 'ready' | 'error' | 'queued';
  branch: string;
  commit: string;
  commitMessage: string;
  createdAt: string;
  duration?: number;
  url?: string;
  buildLogs?: string;
}

export interface Project {
  id: string;
  name: string;
  repository: Repository;
  repositoryUrl?: string;
  domain?: string;
  port?: number;
  dbType?: 'none' | 'postgresql';
  useRedis?: boolean;
  useElasticsearch?: boolean;
  lastDeployment?: Deployment;
  createdAt: string;
}

export interface EnvVariable {
  id: string;
  key: string;
  value: string;
  target: 'production' | 'preview' | 'development' | 'all';
}
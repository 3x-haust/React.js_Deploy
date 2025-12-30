import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ExternalLink, 
  GitBranch, 
  Settings, 
  RefreshCw,
  Copy,
  Check,
  Users,
  UserPlus,
  Trash2
} from 'lucide-react';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { DeploymentRow } from '@/components/DeploymentRow';
import { BuildLogs } from '@/components/BuildLogs';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import type { Project, Deployment, ProjectMember } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { io, Socket } from 'socket.io-client';
import { formatDistanceToNow } from 'date-fns';

export const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeployment, setSelectedDeployment] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [inviteUsername, setInviteUsername] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [isMembersLoading, setIsMembersLoading] = useState(false);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';
    const newSocket = io(`${socketUrl}/deployments`);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
        console.log('Socket connected');
    });

    return () => {
        socket.off('connect');
        socket.off('log');
    }
  }, [socket]);
  
  useEffect(() => {
    if (!socket || !selectedDeployment) return;
    
    socket.emit('subscribeToDeployment', { deploymentId: selectedDeployment });
    
    const handleLog = (data: { log: string }) => {
        setDeployments(prevDeployments => prevDeployments.map(d => {
            if (d.id === selectedDeployment) {
                return { ...d, buildLogs: (d.buildLogs || '') + data.log };
            }
            return d;
        }));
    };
    
    const handleStatus = (data: { status: any }) => {
        setDeployments(prevDeployments => prevDeployments.map(d => {
            if (d.id === selectedDeployment) {
                return { ...d, status: data.status };
            }
            return d;
        }));
    }

    socket.on('log', handleLog);
    socket.on('status', handleStatus);

    return () => {
        socket.off('log', handleLog);
        socket.off('status', handleStatus);
    };
  }, [socket, selectedDeployment]);

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;
      setIsLoading(true);
      setError(null);
      try {
        const projectData = await api.projects.getOne(Number(projectId));
        setProject(projectData);
        const deploymentsData = await api.deployments.getAll(Number(projectId));
        setDeployments(deploymentsData);
        
        const latest = deploymentsData[0];
        if (latest && latest.status === 'building') {
            setSelectedDeployment(latest.id);
        }

        const membersData = await api.projects.getMembers(Number(projectId));
        setMembers(membersData);
      } catch (e) {
        setError((e as Error).message ?? 'Error fetching project');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  const handleInvite = async () => {
    if (!inviteUsername || !projectId) return;
    setIsInviting(true);
    try {
      await api.projects.inviteMember(Number(projectId), inviteUsername);
      toast({
        title: 'User invited',
        description: `${inviteUsername} has been added to the project.`,
      });
      setInviteUsername('');
      const updatedMembers = await api.projects.getMembers(Number(projectId));
      setMembers(updatedMembers);
    } catch (e) {
      toast({
        title: 'Error',
        description: (e as Error).message ?? 'Failed to invite user',
        variant: 'destructive',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (userId: number, username: string) => {
    if (!projectId) return;
    if (!confirm(`Are you sure you want to remove ${username} from this project?`)) return;

    try {
      await api.projects.removeMember(Number(projectId), userId);
      toast({
        title: 'Member removed',
        description: `${username} has been removed from the project.`,
      });
      setMembers(prev => prev.filter(m => m.userId !== userId));
    } catch (e) {
      toast({
        title: 'Error',
        description: (e as Error).message ?? 'Failed to remove member',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="text-center py-20">
            <div className="animate-pulse text-muted-foreground">Loading project...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-2">Project not found</h1>
            <p className="text-muted-foreground mb-6">
              {error || "The project you're looking for doesn't exist."}
            </p>
            <Button asChild>
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const handleRedeploy = async () => {
    try {
      if (!projectId) return;
      await api.deployments.redeploy(Number(projectId));
      toast({
        title: 'Deployment queued',
        description: 'A new deployment has been triggered.',
      });
      const deploymentsData = await api.deployments.getAll(Number(projectId));
      setDeployments(deploymentsData);
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Failed to trigger redeployment',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              {project.lastDeployment && (
                <StatusBadge status={project.lastDeployment.status} />
              )}
            </div>
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <a 
                href={project.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-accent transition-colors"
              >
                <GitBranch className="h-4 w-4" />
                <span>{project.repositoryUrl}</span>
              </a>
              <a
                href={`https://${project.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-accent transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>https://{project.domain}</span>
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">        
            <Button variant="outline" size="sm" onClick={handleRedeploy}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Redeploy
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/project/${projectId}/settings`}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="deployments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="deployments">Deployments</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="deployments">
            <div className="border border-border rounded-lg overflow-hidden">
              <h2 className="p-4 bg-muted/50 font-semibold border-b border-border">Deployments</h2>
            {deployments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No deployments yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {deployments.map((deployment) => (
                  <div key={deployment.id} className="group">
                    <DeploymentRow
                      deployment={deployment}
                      onClick={() => setSelectedDeployment(selectedDeployment === deployment.id ? null : deployment.id)}
                    />
                    {selectedDeployment === deployment.id && (
                       <div className="p-4 bg-muted/30 border-t border-border animate-in fade-in slide-in-from-top-1 duration-200">
                         <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-4">
                             <h3 className="font-medium text-sm">Build Logs</h3>
                             <Button
                               variant="outline"
                               size="icon"
                               className="h-6 w-6"
                               onClick={() => {
                                 navigator.clipboard.writeText(deployment.buildLogs || '');
                                 toast({
                                   description: 'Logs copied to clipboard',
                                 });
                               }}
                             >
                               <Copy className="h-3 w-3" />
                             </Button>
                           </div>
                           <span className="text-xs text-muted-foreground">
                             Commit: {deployment.commit}
                           </span>
                         </div>
                         <BuildLogs 
                           className="max-h-[500px]" 
                           logs={deployment.buildLogs || 'No logs available.'} 
                         />
                       </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            </div>
          </TabsContent>

          <TabsContent value="team">
            <div className="border border-border rounded-lg overflow-hidden bg-card">
              <div className="p-4 bg-muted/50 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-semibold">Team Members</h2>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Teammate</DialogTitle>
                      <DialogDescription>
                        Invite someone to collaborate on this project using their GitHub username.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">GitHub Username</label>
                        <Input 
                          placeholder="e.g. octocat" 
                          value={inviteUsername}
                          onChange={(e) => setInviteUsername(e.target.value)}
                        />
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={handleInvite}
                        disabled={!inviteUsername || isInviting}
                      >
                        {isInviting ? 'Inviting...' : 'Send Invitation'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="divide-y divide-border">
                {members.map((member) => (
                  <div key={member.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                        {member.user.avatarUrl ? (
                          <img src={member.user.avatarUrl} alt={member.user.username} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center font-bold text-muted-foreground">
                            {member.user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{member.user.username}</span>
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full ${
                            member.role === 'OWNER' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          }`}>
                            {member.role}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Joined {formatDistanceToNow(new Date(member.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    {member.role !== 'OWNER' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => handleRemoveMember(member.userId, member.user.username)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProjectDetail;

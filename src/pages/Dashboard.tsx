import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { Header } from '@/components/Header';
import { ProjectCard } from '@/components/ProjectCard';
import { RepoSelector } from '@/components/RepoSelector';
import { ProjectSetupDialog } from '@/components/ProjectSetupDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Project } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const Dashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'building' | 'ready' | 'error'>('all');
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [projectName, setProjectName] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('hyphen.it.com');
  const { toast } = useToast();

  useEffect(() => {
    loadProjects().catch((error) => {
      console.error('Error loading projects:', error);
    });
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const data = await api.projects.getAll();
      const formattedProjects = data.map((project: any) => ({
        id: project.id.toString(),
        name: project.name,
        repository: {
          id: project.repositoryFullName,
          name: project.name,
          fullName: project.repositoryFullName,
          description: project.description || '',
          url: project.repositoryUrl,
          defaultBranch: project.language,
          private: project.isPrivate,
          updatedAt: project.updatedAt,
        },
        domain: project.domain,
        repositoryUrl: project.repositoryUrl,
        lastDeployment: project.lastDeployment
          ? {
              id: project.lastDeployment.id.toString(),
              projectId: project.id.toString(),
              status: project.lastDeployment.status,
              branch: project.lastDeployment.branch,
              commit: project.lastDeployment.commit,
              commitMessage: project.lastDeployment.commitMessage,
              createdAt: project.lastDeployment.createdAt,
              duration: project.lastDeployment.duration,
              url: project.lastDeployment.url,
            }
          : undefined,
        createdAt: project.createdAt,
      }));
      setProjects(formattedProjects);
    } catch (error) {
      console.error('Error in loadProjects:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRepo = (repo: unknown) => {
    setSelectedRepo(repo);
    setSetupDialogOpen(true);
  };

  const handleConfirmSetup = async (config: any) => {
    if (!selectedRepo) return;

    try {
      const projectData = await api.projects.create({
        name: config.projectName,
        repositoryFullName: selectedRepo.fullName,
        repositoryUrl: selectedRepo.url,
        defaultBranch: selectedRepo.defaultBranch,
        description: selectedRepo.description,
        language: selectedRepo.language,
        isPrivate: selectedRepo.private,
        framework: config.framework,
        buildCommand: config.buildCommand,
        installCommand: config.installCommand,
        outputDir: config.outputDir,
        envVariables: config.envVariables,
        domain: config.domain,
      });

      const newProject: Project = {
        id: projectData.id.toString(),
        name: projectData.name,
        repository: {
          id: projectData.repositoryFullName,
          name: projectData.name,
          fullName: projectData.repositoryFullName,
          description: projectData.description || '',
          url: projectData.repositoryUrl,
          defaultBranch: projectData.defaultBranch,
          language: projectData.language,
          private: projectData.isPrivate,
          updatedAt: projectData.updatedAt,
        },
        createdAt: projectData.createdAt,
        repositoryUrl: projectData.repositoryUrl,
        domain: projectData.domain,
      };

      setProjects([newProject, ...projects]);
      setSetupDialogOpen(false);
      setSelectedRepo(null);
      toast({
        title: 'Project created',
        description: `${config.projectName} has been imported and is ready for deployment.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive',
      });
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' || project.lastDeployment?.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">
              Manage and deploy your connected repositories
            </p>
          </div>
          <RepoSelector onSelect={handleSelectRepo} />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                {filter === 'all' ? 'All Status' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilter('all')}>All Status</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('ready')}>Ready</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('building')}>Building</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('error')}>Error</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-pulse text-muted-foreground">Loading projects...</div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-lg">
            <h3 className="text-lg font-medium mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-6">
              {search || filter !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Import a repository to get started'}
            </p>
            {!search && filter === 'all' && (
              <RepoSelector onSelect={handleSelectRepo} />
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>

      <ProjectSetupDialog
        open={setupDialogOpen}
        onOpenChange={setSetupDialogOpen}
        repository={selectedRepo}
        onConfirm={handleConfirmSetup}
      />
    </div>
  );
};

export default Dashboard;

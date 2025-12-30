import { useState, useEffect, useMemo } from 'react';
import { Search, GitBranch, Lock, Globe, Plus, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Repository {
  id: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  defaultBranch: string;
  language: string;
  private: boolean;
  updatedAt: string;
  lastCommitDate?: string;
  timeAgo?: string;
}

interface RepoSelectorProps {
  onSelect: (repo: Repository) => void;
}

export const RepoSelector = ({ onSelect }: RepoSelectorProps) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadRepositories = async () => {
    try {
      setIsLoading(true);
      const data = await api.repositories.getAll();
      if (Array.isArray(data)) {
        setRepositories(data);
      } else {
        setRepositories([]);
      }
    } catch (error) {
      console.error('Error loading repositories:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load repositories',
        variant: 'destructive',
      });
      setRepositories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadRepositories();
    }
  }, [open]);

  const { filteredRepos, recentRepos } = useMemo(() => {
    const searchLower = search.toLowerCase();
    const filtered = repositories.filter(
      (repo) =>
        repo.fullName.toLowerCase().includes(searchLower) ||
        repo.name.toLowerCase().includes(searchLower) ||
        (repo.description && repo.description.toLowerCase().includes(searchLower)),
    );

    const recent = repositories
      .slice(0, 3)
      .map((repo) => ({
        ...repo,
        timeAgo: formatDistanceToNow(new Date(repo.lastCommitDate || repo.updatedAt), {
          addSuffix: true,
        }),
      }));

    return {
      filteredRepos: filtered,
      recentRepos: recent,
    };
  }, [repositories, search]);

  const handleSelect = (repo: Repository) => {
    onSelect(repo);
    setOpen(false);
    setSearch('');
  };

  const displayRepos = search.length > 0 ? filteredRepos : recentRepos;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Git Repository</DialogTitle>
          <DialogDescription>
            Select a repository to deploy
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-[300px] overflow-auto -mx-6 px-6">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading repositories...
            </div>
          ) : displayRepos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? 'No repositories found' : 'No repositories available'}
            </div>
          ) : (
            <>
              {search.length === 0 && recentRepos.length > 0 && (
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                  Recently Updated
                </div>
              )}
              {displayRepos.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => handleSelect(repo)}
                  className="w-full flex items-center justify-between p-3 -mx-3 rounded-md hover:bg-secondary transition-colors text-left"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary flex-shrink-0">
                      <GitBranch className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {repo.fullName}
                        </span>
                        {repo.private ? (
                          <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground truncate">
                          {repo.description}
                        </p>
                        {search.length === 0 && repo.timeAgo && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                            <Clock className="h-3 w-3" />
                            <span>{repo.timeAgo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(repo);
                    }}
                    className="ml-2 flex-shrink-0"
                  >
                    Import
                  </Button>
                </button>
              ))}
              {search.length > 0 && filteredRepos.length > 0 && (
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-t mt-2 pt-2">
                  All Repositories
                </div>
              )}
              {search.length > 0 &&
                filteredRepos.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => handleSelect(repo)}
                    className="w-full flex items-center justify-between p-3 -mx-3 rounded-md hover:bg-secondary transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary flex-shrink-0">
                        <GitBranch className="h-4 w-4 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {repo.fullName}
                          </span>
                          {repo.private ? (
                            <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {repo.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(repo);
                      }}
                      className="ml-2 flex-shrink-0"
                    >
                      Import
                    </Button>
                  </button>
                ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

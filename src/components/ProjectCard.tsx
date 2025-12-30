import { Link } from 'react-router-dom';
import { GitBranch, ExternalLink, Clock, Lock, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { Project } from '@/lib/mockData';
import { formatDistanceToNow } from 'date-fns';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const lastDeployTime = project.lastDeployment
    ? formatDistanceToNow(new Date(project.lastDeployment.createdAt), { addSuffix: true })
    : 'No deployments';

  return (
    <Link to={`/project/${project.id}`}>
      <Card className="group transition-colors hover:border-foreground/30">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                  {project.name}
                </h3>
                {project.repository.private ? (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {project.repository.description}
              </p>
            </div>
            {project.lastDeployment && (
              <StatusBadge status={project.lastDeployment.status} />
            )}
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5" />
              <span>{project.repository.defaultBranch}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{lastDeployTime}</span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm">
            <a
              href={`https://${project.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-muted-foreground hover:text-accent transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              <span className="truncate max-w-[200px]">
                {project.domain}
              </span>
            </a>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

import { GitCommit, GitBranch, ExternalLink, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Deployment } from '@/lib/mockData';
import { formatDistanceToNow } from 'date-fns';

interface DeploymentRowProps {
  deployment: Deployment;
  onClick?: () => void;
}

export const DeploymentRow = ({ deployment, onClick }: DeploymentRowProps) => {
  const createdTime = formatDistanceToNow(new Date(deployment.createdAt), { addSuffix: true });

  return (
    <div
      onClick={onClick}
      className="group flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer transition-colors"
    >
      <div className="flex items-center gap-4">
        <StatusBadge status={deployment.status} />
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-foreground">
              {deployment.commit}
            </span>
            <span className="text-sm text-muted-foreground line-clamp-1 max-w-[300px]">
              {deployment.commitMessage}
            </span>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              <span>{deployment.branch}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{createdTime}</span>
            </div>
            {deployment.duration && (
              <span>
                Built in {deployment.duration}s
              </span>
            )}
          </div>
        </div>
      </div>

      {deployment.url && (
        <a
          href={deployment.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Visit</span>
        </a>
      )}
    </div>
  );
};

import { useEffect, useRef } from 'react';
import { mockBuildLogs } from '@/lib/mockData';

interface BuildLogsProps {
  className?: string;
}

export const BuildLogs = ({ className, logs }: BuildLogsProps & { logs?: string }) => {
  const logsRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  if (!logs) {
    return (
      <div className={`bg-card border border-border rounded-lg p-4 font-mono text-sm text-muted-foreground flex items-center justify-center ${className}`}>
        No build logs available
      </div>
    );
  }

  return (
    <pre
      ref={logsRef}
      className={`bg-card border border-border rounded-lg p-4 overflow-auto font-mono text-sm text-muted-foreground ${className}`}
    >
      {logs.split('\n').map((line, index) => (
        <div key={index} className="leading-6">
          {line.includes('✓') ? (
            <span className="text-success">{line}</span>
          ) : line.includes('error') || line.includes('Error') ? (
            <span className="text-destructive">{line}</span>
          ) : line.includes('[') ? (
            <>
              <span className="text-muted-foreground/60">
                {line.substring(0, line.indexOf(']') + 1)}
              </span>
              <span className="text-foreground">
                {line.substring(line.indexOf(']') + 1)}
              </span>
            </>
          ) : (
            line
          )}
        </div>
      ))}
    </pre>
  );
};

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Eye, EyeOff, Upload } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

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
}

interface ProjectSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repository: Repository | null;
  onConfirm: (config: ProjectConfig) => void;
}
interface ProjectConfig {
  framework: string;
  installCommand: string;
  outputDir: string;
  envVariables: Record<string, string>;
  projectName: string;
  domain: string;
  dbType: 'none' | 'postgresql';
  useRedis: boolean;
  useElasticsearch: boolean;
}

const FRAMEWORKS = [
  { value: 'react', label: 'React', logo: '/framework-react.svg', install: 'npm install', output: 'build' },
  { value: 'nextjs', label: 'Next.js', logo: '/framework-nextjs.svg', install: 'npm install', output: '.next' },
  { value: 'nestjs', label: 'NestJS', logo: '/framework-nestjs.svg', install: 'npm install', output: 'dist' },
  { value: 'springboot', label: 'Spring Boot', logo: '/framework-springboot.svg', install: '', output: 'build/libs' },
  { value: 'nodejs', label: 'Node.js', logo: '/framework-nodejs.svg', install: 'npm install', output: '' },
  { value: 'other', label: 'Other', logo: '', install: '', output: '' },
];

const BACKEND_FRAMEWORKS = ['nestjs', 'springboot', 'nodejs'];

export const ProjectSetupDialog = ({
  open,
  onOpenChange,
  repository,
  onConfirm,
}: ProjectSetupDialogProps) => {
  const [framework, setFramework] = useState<string>('');
  const [installCommand, setInstallCommand] = useState<string>('');
  const [outputDir, setOutputDir] = useState<string>('');
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' },
  ]);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [projectName, setProjectName] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<string>('hyphen.it.com');
  const [useRootDomainOnly, setUseRootDomainOnly] = useState<boolean>(false);
  const [dbType, setDbType] = useState<'none' | 'postgresql'>('none');
  const [useRedis, setUseRedis] = useState<boolean>(false);
  const [useElasticsearch, setUseElasticsearch] = useState<boolean>(false);

  const handleFrameworkChange = (value: string) => {
    setFramework(value);
    const frameworkConfig = FRAMEWORKS.find((f) => f.value === value);
    if (frameworkConfig && value !== 'other') {
      setInstallCommand(frameworkConfig.install);
      setOutputDir(frameworkConfig.output);
    } else {
      setInstallCommand('');
      setOutputDir('');
    }
  };

  const handleAddEnvVar = () => {
    const lastVar = envVars[envVars.length - 1];
    if (!lastVar.key || !lastVar.value) {
      return;
    }
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const handleRemoveEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const toggleShowValue = (index: number | string) => {
    setShowValues((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleEnvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split('\n');
      const newVars: Array<{ key: string; value: string }> = [];
      let currentKey = '';
      let currentValue = '';
      let inQuote = false;
      let quoteChar = '';

      lines.forEach((line) => {
        if (!inQuote) {
          const trimmedLine = line.trim();
          if (trimmedLine && !trimmedLine.startsWith('#') && !trimmedLine.startsWith('!')) {
            const separatorIndex = trimmedLine.indexOf('=') !== -1 ? trimmedLine.indexOf('=') : trimmedLine.indexOf(':');
            if (separatorIndex !== -1) {
              const key = trimmedLine.substring(0, separatorIndex).trim();
              const fullValue = trimmedLine.substring(separatorIndex + 1).trim();
              if ((fullValue.startsWith('"') || fullValue.startsWith("'")) && 
                  !(fullValue.length >= 2 && fullValue.startsWith(fullValue[0]) && fullValue.endsWith(fullValue[0]))) {
                inQuote = true;
                quoteChar = fullValue[0];
                currentKey = key.trim();
                currentValue = fullValue.substring(1);
              } else {
                newVars.push({
                  key: key.trim(),
                  value: fullValue.replace(/^["']|["']$/g, ''),
                });
              }
            }
          }
        } else {
          if (line.includes(quoteChar)) {
            const [valPart, ...rest] = line.split(quoteChar);
            currentValue += '\n' + valPart;
            newVars.push({ key: currentKey, value: currentValue });
            inQuote = false;
          } else {
            currentValue += '\n' + line;
          }
        }
      });

      if (newVars.length > 0) {
        const filteredCurrent = envVars.filter(v => v.key || v.value);
        setEnvVars([...filteredCurrent, ...newVars, { key: '', value: '' }]);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirm = () => {
    const trimmedProjectName = projectName.trim();

    if (!trimmedProjectName) {
      alert('프로젝트 이름은 필수입니다.');
      return;
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(trimmedProjectName)) {
      alert('프로젝트 이름은 영문, 숫자, 하이픈(-), 언더스코어(_)만 사용할 수 있습니다.');
      return;
    }

    const envVarsObj: Record<string, string> = {};
    envVars.forEach((env) => {
      if (env.key && env.value) {
        envVarsObj[env.key] = env.value;
      }
    });

    const isRootDomainOnly = useRootDomainOnly;
    const domain = (isRootDomainOnly ? selectedDomain : `${trimmedProjectName}.${selectedDomain}`).toLowerCase();

    onConfirm({
      framework,
      installCommand,
      outputDir,
      envVariables: envVarsObj,
      projectName: trimmedProjectName,
      domain,
      dbType,
      useRedis,
      useElasticsearch,
    });
  };

  const handleCancel = () => {
    setFramework('');
    setInstallCommand('');
    setOutputDir('');
    setEnvVars([{ key: '', value: '' }]);
    setShowValues({});
    setProjectName('');
    setSelectedDomain('hyphen.it.com');
    setUseRootDomainOnly(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Project</DialogTitle>
          <DialogDescription>
            Set up your project settings for {repository?.fullName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>
                Specify the project name and domain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Select
                  value={selectedDomain}
                  onValueChange={(value) => setSelectedDomain(value)}
                >
                  <SelectTrigger id="domain">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hyphen.it.com">hyphen.it.com</SelectItem>
                    <SelectItem value="3xhaust.dev">3xhaust.dev</SelectItem>
                    <SelectItem value="mmhs.app">mmhs.app</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-3 mt-5">
                  <Label htmlFor="use-root-domain-only">Use Root Domain Only</Label>
                  <Checkbox
                    id="use-root-domain-only"
                    checked={useRootDomainOnly}
                    onCheckedChange={(checked) => setUseRootDomainOnly(checked === true)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Framework Presets</CardTitle>
              <CardDescription>
                Select a framework to automatically configure build settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={framework} onValueChange={handleFrameworkChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  {FRAMEWORKS.map((fw) => (
                    <SelectItem key={fw.value} value={fw.value}>
                      <span className="flex items-center gap-2">
                        {fw.logo && (
                          <img src={fw.logo} alt={fw.label + ' logo'} className="w-5 h-5 inline-block" />
                        )}
                        {fw.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Build Settings</CardTitle>
              <CardDescription>
                Configure how your project is built and deployed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="output-dir">Output Directory</Label>
                  <Input
                    id="output-dir"
                    value={outputDir}
                    onChange={(e) => setOutputDir(e.target.value)}
                    placeholder="dist"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="install-command">Install Command</Label>
                <Input
                  id="install-command"
                  value={installCommand}
                  onChange={(e) => setInstallCommand(e.target.value)}
                  placeholder="yarn install"
                />
              </div>
            </CardContent>
          </Card>

          {BACKEND_FRAMEWORKS.includes(framework) && (
            <Card>
              <CardHeader>
                <CardTitle>Infrastructure Resources</CardTitle>
                <CardDescription>
                  Select additional resources for your project.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="db-type">Database</Label>
                  <Select value={dbType} onValueChange={(value: any) => setDbType(value)}>
                    <SelectTrigger id="db-type">
                      <SelectValue placeholder="Select database" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="use-redis"
                      checked={useRedis}
                      onCheckedChange={(checked) => setUseRedis(checked === true)}
                    />
                    <Label htmlFor="use-redis" className="cursor-pointer">Enable Redis</Label>
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="use-elasticsearch"
                      checked={useElasticsearch}
                      onCheckedChange={(checked) => setUseElasticsearch(checked === true)}
                    />
                    <Label htmlFor="use-elasticsearch" className="cursor-pointer">Enable Elasticsearch</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Environment Variables</CardTitle>
                <CardDescription>
                  Add environment variables for your project.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('env-upload')?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Import .env
                </Button>
                <input
                  id="env-upload"
                  type="file"
                  accept=".env,.properties,*"
                  className="hidden"
                  onChange={handleEnvFileChange}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-12">
                <div className="sm:col-span-5 space-y-2">
                  <Label htmlFor="new-key">Key</Label>
                  <Input
                    id="new-key"
                    value={envVars[envVars.length - 1]?.key || ''}
                    onChange={(e) => {
                      const updated = [...envVars];
                      const lastIndex = updated.length - 1;
                      updated[lastIndex] = {
                        ...updated[lastIndex],
                        key: e.target.value,
                      };
                      setEnvVars(updated);
                    }}
                    placeholder="VARIABLE_NAME"
                  />
                </div>
                <div className="sm:col-span-5 space-y-2">
                  <Label htmlFor="new-value">Value</Label>
                  <Input
                    id="new-value"
                    type={showValues['new'] ? 'text' : 'password'}
                    value={envVars[envVars.length - 1]?.value || ''}
                    onChange={(e) => {
                      const updated = [...envVars];
                      const lastIndex = updated.length - 1;
                      updated[lastIndex] = {
                        ...updated[lastIndex],
                        value: e.target.value,
                      };
                      setEnvVars(updated);
                    }}
                    placeholder="Value"
                  />
                </div>
                <div className="sm:col-span-2 flex items-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleShowValue('new')}
                    className="h-10 w-10"
                  >
                    {showValues['new'] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button onClick={handleAddEnvVar} size="icon" className="h-10 w-10">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {envVars.length > 1 && <Separator />}

              {envVars.length > 1 && (
                <div className="space-y-3">
                  {envVars.slice(0, -1).map((envVar, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-3 rounded-lg border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono font-medium">
                            {envVar.key}
                          </code>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm font-mono text-muted-foreground truncate">
                            {showValues[index] ? envVar.value : '••••••••'}
                          </code>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleShowValue(index)}
                      >
                        {showValues[index] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveEnvVar(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!framework}>
            Deploy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};


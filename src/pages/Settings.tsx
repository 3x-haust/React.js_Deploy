import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Eye, EyeOff, Save, Upload, Pencil, Check, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const BACKEND_FRAMEWORKS = ['nestjs', 'springboot', 'nodejs'];

export const Settings = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState(null);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  type Target = 'all' | 'production' | 'preview' | 'development';
  const [newVar, setNewVar] = useState<{
    key: string;
    value: string;
    target: Target;
  }>({
    key: '',
    value: '',
    target: 'all',
  });
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const { toast } = useToast();

  const [outputDir, setOutputDir] = useState('dist');
  const [installCommand, setInstallCommand] = useState('npm install');
  const [port, setPort] = useState<number>(30001);
  const [dbType, setDbType] = useState<'none' | 'postgresql'>('none');
  const [useRedis, setUseRedis] = useState(false);
  const [useElasticsearch, setUseElasticsearch] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!projectId) return;
      try {
        const projectSettings = await api.projects.getSettings(
          Number(projectId)
        );
        setProject(projectSettings.project);
        setInstallCommand(projectSettings.installCommand);
        setOutputDir(projectSettings.outputDir);
        setPort(projectSettings.port || 30001);
        setDbType(projectSettings.dbType || 'none');
        setUseRedis(projectSettings.useRedis || false);
        setUseElasticsearch(projectSettings.useElasticsearch || false);
        setEnvVars(projectSettings.envVariables || {});
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch project settings.',
          variant: 'destructive',
        });
      }
    };

    fetchSettings();
  }, [projectId, toast]);

  const handleAddEnvVar = async () => {
    if (!newVar.key || !newVar.value) {
      toast({
        title: 'Error',
        description: 'Both key and value are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await api.projects.addEnvVariable(Number(projectId), newVar);
      setEnvVars({ ...envVars, [newVar.key]: newVar.value });
      setNewVar({ key: '', value: '', target: 'all' });
      toast({
        title: 'Environment variable added',
        description: `${newVar.key} has been added to ${newVar.target} environment.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add environment variable.',
        variant: 'destructive',
      });
    }
  };

  const handleEditStart = (key: string, value: string) => {
    setEditingKey(key);
    setEditValue(value);
  };

  const handleEditCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const handleUpdateEnvVar = async () => {
    if (!editingKey) return;

    try {
      await api.projects.addEnvVariable(Number(projectId), {
        key: editingKey,
        value: editValue,
        target: 'all'
      });
      setEnvVars({ ...envVars, [editingKey]: editValue });
      setEditingKey(null);
      setEditValue('');
      toast({
        title: 'Environment variable updated',
        description: `${editingKey} has been updated.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update environment variable.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEnvVar = async (key: string) => {
    try {
      await api.projects.deleteEnvVariable(Number(projectId), key);
      const newEnvVars = { ...envVars };
      delete newEnvVars[key];
      setEnvVars(newEnvVars);
      toast({
        title: 'Environment variable deleted',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete environment variable.',
        variant: 'destructive',
      });
    }
  };

  const toggleShowValue = (key: string) => {
    setShowValues((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleEnvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split('\n');
      const newVars: Record<string, string> = {};
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
                newVars[key.trim()] = fullValue.replace(/^["']|["']$/g, '');
              }
            }
          }
        } else {
          if (line.includes(quoteChar)) {
            const [valPart, ...rest] = line.split(quoteChar);
            currentValue += '\n' + valPart;
            newVars[currentKey] = currentValue;
            inQuote = false;
          } else {
            currentValue += '\n' + line;
          }
        }
      });

      if (Object.keys(newVars).length > 0) {
        const mergedVars = { ...envVars, ...newVars };
        setEnvVars(mergedVars);
        
        api.projects.updateSettings(Number(projectId), {
          installCommand,
          outputDir,
          port: Number(port),
          dbType,
          useRedis,
          useElasticsearch,
          envVariables: mergedVars,
        }).then(() => {
          toast({
            title: 'Import & Save Successful',
            description: `Loaded and saved ${Object.keys(newVars).length} environment variables.`,
          });
        }).catch(() => {
          toast({
            title: 'Error',
            description: 'Failed to auto-save imported variables.',
            variant: 'destructive',
          });
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveSettings = async () => {
    try {
      await api.projects.updateSettings(Number(projectId), {
        installCommand,
        outputDir,
        port: Number(port),
        dbType,
        useRedis,
        useElasticsearch,
        envVariables: envVars,
      });
      toast({
        title: 'Settings saved',
        description: 'Your build configuration has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 max-w-4xl">
        {projectId && (
          <Link
            to={`/project/${projectId}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </Link>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            {project ? `${project.name} Settings` : 'Settings'}
          </h1>
          <p className="text-muted-foreground">
            Configure your project's build and deployment settings
          </p>
        </div>

        <div className="space-y-8">
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
                <div className="space-y-2">
                  <Label htmlFor="port">NodePort (30000-32767)</Label>
                  <Input
                    id="port"
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    placeholder="30001"
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
              <Button onClick={handleSaveSettings} className="gap-2">
                <Save className="h-4 w-4" />
                Save Build Settings
              </Button>
            </CardContent>
          </Card>

          {project && BACKEND_FRAMEWORKS.includes(project.framework) && (
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
                  Manage your project's environment variables for different
                  environments. (Tip: On macOS, press Cmd + Shift + . to see .env files)
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('env-upload-settings')?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Import .env
                </Button>
                <input
                  id="env-upload-settings"
                  type="file"
                  accept="*"
                  className="hidden"
                  onChange={handleEnvFileChange}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-12">
                <div className="sm:col-span-4 space-y-2">
                  <Label htmlFor="new-key">Key</Label>
                  <Input
                    id="new-key"
                    value={newVar.key}
                    onChange={(e) =>
                      setNewVar({ ...newVar, key: e.target.value })
                    }
                    placeholder="VARIABLE_NAME"
                  />
                </div>
                <div className="sm:col-span-4 space-y-2">
                  <Label htmlFor="new-value">Value</Label>
                  <div className="relative">
                    <Input
                      id="new-value"
                      type={showValues['new'] ? 'text' : 'password'}
                      value={newVar.value}
                      onChange={(e) =>
                        setNewVar({ ...newVar, value: e.target.value })
                      }
                      placeholder="Value"
                      className="pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-10 w-10 text-muted-foreground hover:text-foreground"
                      onClick={() => toggleShowValue('new')}
                    >
                      {showValues['new'] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="sm:col-span-1 flex items-end">
                  <Button
                    onClick={handleAddEnvVar}
                    size="icon"
                    className="h-10 w-10"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                {Object.keys(envVars).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No environment variables configured
                  </p>
                ) : (
                  Object.entries(envVars).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center gap-4 p-3 rounded-lg border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono font-medium">
                            {key}
                          </code>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {editingKey === key ? (
                            <div className="relative w-full">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-8 py-1 text-sm font-mono pr-20"
                                autoFocus
                              />
                              <div className="absolute right-1 top-1 flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-green-500 hover:text-green-600 hover:bg-green-50"
                                  onClick={handleUpdateEnvVar}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                  onClick={handleEditCancel}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <code className="text-sm font-mono text-muted-foreground truncate">
                              {showValues[key] ? value : '••••••••'}
                            </code>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleShowValue(key)}
                          disabled={editingKey === key}
                        >
                          {showValues[key] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditStart(key, value)}
                          disabled={editingKey === key}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEnvVar(key)}
                          className="text-destructive hover:text-destructive"
                          disabled={editingKey === key}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions that can affect your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Delete Project</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently remove this project and all its deployments
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    try {
                      await api.projects.delete(Number(projectId));
                      toast({
                        title: 'Project Deleted',
                        description: 'The project has been successfully deleted.',
                      });
                      window.location.href = '/dashboard';
                    } catch (error) {
                      toast({
                        title: 'Error',
                        description: error.message || 'Failed to delete the project.',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  Delete Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;

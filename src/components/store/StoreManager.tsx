"use client";

import { useState, useEffect } from 'react';
import { Package, Plus, Settings, Power, Trash2, Download, Shield, Database, Globe, Bell, Clipboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useExtensions } from '@/hooks/use-extensions';

interface Extension {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  permissions: string[];
  enabled: boolean;
  installedAt: string;
  icons?: any;
}

const permissionIcons: Record<string, React.ReactNode> = {
  storage: <Database className="h-4 w-4" />,
  tabs: <Globe className="h-4 w-4" />,
  downloads: <Download className="h-4 w-4" />,
  bookmarks: <Package className="h-4 w-4" />,
  history: <Package className="h-4 w-4" />,
  cookies: <Package className="h-4 w-4" />,
  webNavigation: <Globe className="h-4 w-4" />,
  webRequest: <Globe className="h-4 w-4" />,
  notifications: <Bell className="h-4 w-4" />,
  clipboardRead: <Clipboard className="h-4 w-4" />,
  clipboardWrite: <Clipboard className="h-4 w-4" />,
  nativeMessaging: <Package className="h-4 w-4" />,
  unlimitedStorage: <Database className="h-4 w-4" />,
};

export default function StoreManager() {
  const {
    extensions,
    loading,
    error,
    installExtension,
    uninstallExtension,
    toggleExtension,
  } = useExtensions();
  
  const [selectedExtension, setSelectedExtension] = useState<Extension | null>(null);
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);
  const [installManifest, setInstallManifest] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);

  const handleToggleExtension = async (extensionId: string) => {
    try {
      const extension = extensions.find(ext => ext.id === extensionId);
      if (extension) {
        await toggleExtension(extensionId, !extension.enabled);
      }
    } catch (error) {
      console.error('Failed to toggle extension:', error);
    }
  };

  const handleUninstallExtension = async (extensionId: string) => {
    try {
      await uninstallExtension(extensionId);
      if (selectedExtension?.id === extensionId) {
        setSelectedExtension(null);
      }
    } catch (error) {
      console.error('Failed to uninstall extension:', error);
    }
  };

  const handleInstallExtension = async () => {
    try {
      setIsInstalling(true);
      const manifest = JSON.parse(installManifest);
      const extensionId = `ext_${Date.now()}_${manifest.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      await installExtension(manifest, extensionId);
      setInstallManifest('');
      setIsInstallDialogOpen(false);
    } catch (error) {
      console.error('Invalid manifest or installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const getPermissionColor = (permission: string) => {
    const sensitivePermissions = ['nativeMessaging', 'clipboardRead', 'cookies', 'history'];
    if (sensitivePermissions.includes(permission)) {
      return 'destructive';
    }
    return 'secondary';
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Omnior Store</h1>
        <p className="text-muted-foreground">
          Manage extensions and tools to enhance your browsing experience
        </p>
        {error && (
          <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {error}
          </div>
        )}
      </div>

      <Tabs defaultValue="installed" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="installed">Installed Extensions</TabsTrigger>
          <TabsTrigger value="store">Browse Store</TabsTrigger>
          <TabsTrigger value="developer">Developer Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="installed" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Installed Extensions</h2>
            <Dialog open={isInstallDialogOpen} onOpenChange={setIsInstallDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Install Extension
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Install Extension</DialogTitle>
                  <DialogDescription>
                    Paste the extension manifest JSON to install a new extension
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="manifest">Extension Manifest</Label>
                    <Textarea
                      id="manifest"
                      placeholder={`{
  "name": "My Extension",
  "version": "1.0.0",
  "description": "Extension description",
  "author": "Author Name",
  "permissions": ["storage", "tabs"]
}`}
                      value={installManifest}
                      onChange={(e) => setInstallManifest(e.target.value)}
                      rows={10}
                      className="mt-2"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsInstallDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleInstallExtension} 
                      disabled={!installManifest.trim() || isInstalling}
                    >
                      {isInstalling ? 'Installing...' : 'Install'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3">Loading extensions...</span>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {extensions.map((extension) => (
                <Card key={extension.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{extension.name}</CardTitle>
                        <CardDescription className="text-sm">
                          v{extension.version} by {extension.author}
                        </CardDescription>
                      </div>
                      <Switch
                        checked={extension.enabled}
                        onCheckedChange={() => handleToggleExtension(extension.id)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {extension.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {extension.permissions.slice(0, 3).map((permission) => (
                        <Badge key={permission} variant={getPermissionColor(permission)} className="text-xs">
                          {permissionIcons[permission]}
                          <span className="ml-1">{permission}</span>
                        </Badge>
                      ))}
                      {extension.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{extension.permissions.length - 3} more
                        </Badge>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Installed {new Date(extension.installedAt).toLocaleDateString()}
                      </span>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedExtension(extension)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUninstallExtension(extension.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="store" className="space-y-4">
          <h2 className="text-xl font-semibold">Browse Store</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  PDF Viewer & Annotator
                </CardTitle>
                <CardDescription>
                  View and annotate PDF documents directly in the browser
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <Badge variant="secondary">Free</Badge>
                  <Button size="sm">Install</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Omnior Notes
                </CardTitle>
                <CardDescription>
                  Markdown and rich text note-taking with cloud sync
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <Badge variant="secondary">Free</Badge>
                  <Button size="sm">Install</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  File Manager
                </CardTitle>
                <CardDescription>
                  Browse and manage local files securely
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <Badge variant="secondary">Free</Badge>
                  <Button size="sm">Install</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Clipboard Manager
                </CardTitle>
                <CardDescription>
                  Manage clipboard history with search and organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <Badge variant="secondary">Free</Badge>
                  <Button size="sm">Install</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Media Converter
                </CardTitle>
                <CardDescription>
                  Convert audio and video formats in the browser
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <Badge variant="secondary">Premium</Badge>
                  <Button size="sm">Install</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Code Editor
                </CardTitle>
                <CardDescription>
                  Full-featured code editor with syntax highlighting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <Badge variant="secondary">Free</Badge>
                  <Button size="sm">Install</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="developer" className="space-y-4">
          <h2 className="text-xl font-semibold">Developer Tools</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Extension Development</CardTitle>
                <CardDescription>
                  Tools and documentation for developing Omnior extensions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="h-4 w-4 mr-2" />
                  Create New Extension
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Extension Templates
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Globe className="h-4 w-4 mr-2" />
                  API Documentation
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Testing & Debugging</CardTitle>
                <CardDescription>
                  Debug and test your extensions in development mode
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Power className="h-4 w-4 mr-2" />
                  Load Unpacked Extension
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Extension Inspector
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Permission Simulator
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Extension Details Dialog */}
      {selectedExtension && (
        <Dialog open={!!selectedExtension} onOpenChange={() => setSelectedExtension(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {selectedExtension.name}
              </DialogTitle>
              <DialogDescription>
                Extension details and settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Version</Label>
                  <p className="text-sm text-muted-foreground">{selectedExtension.version}</p>
                </div>
                <div>
                  <Label>Author</Label>
                  <p className="text-sm text-muted-foreground">{selectedExtension.author}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={selectedExtension.enabled ? "default" : "secondary"}>
                    {selectedExtension.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div>
                  <Label>Installed</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedExtension.installedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedExtension.description}
                </p>
              </div>

              <div>
                <Label>Permissions</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedExtension.permissions.map((permission) => (
                    <Badge key={permission} variant={getPermissionColor(permission)}>
                      {permissionIcons[permission]}
                      <span className="ml-1">{permission}</span>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedExtension(null)}>
                  Close
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleUninstallExtension(selectedExtension.id);
                    setSelectedExtension(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Uninstall
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
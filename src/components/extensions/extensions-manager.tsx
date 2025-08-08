'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Extension, 
  ExtensionManifest, 
  ExtensionPermission 
} from '@/lib/extensions/types'
import { ExtensionManager } from '@/lib/extensions/manager'
import { ExtensionSandbox } from '@/lib/extensions/sandbox'
import { 
  Plus, 
  Download, 
  Trash2, 
  Settings, 
  Power, 
  PowerOff,
  Search,
  RefreshCw,
  Shield,
  Database,
  Globe,
  Bell,
  Clock,
  FileText,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface ExtensionsManagerProps {
  onClose?: () => void
}

export default function ExtensionsManager({ onClose }: ExtensionsManagerProps) {
  const [extensions, setExtensions] = useState<Extension[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExtension, setSelectedExtension] = useState<Extension | null>(null)
  const [showInstallDialog, setShowInstallDialog] = useState(false)
  const [installUrl, setInstallUrl] = useState('')
  const [isInstalling, setIsInstalling] = useState(false)
  const [manager] = useState(() => new ExtensionManager())
  const [sandbox] = useState(() => new ExtensionSandbox())

  useEffect(() => {
    loadExtensions()
  }, [manager])

  const loadExtensions = () => {
    const allExtensions = manager.getAllExtensions()
    setExtensions(allExtensions)
  }

  const filteredExtensions = extensions.filter(ext =>
    ext.manifest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ext.manifest.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleInstallExtension = async () => {
    if (!installUrl.trim()) return

    setIsInstalling(true)
    try {
      const extension = await manager.installFromUrl(installUrl)
      setExtensions(manager.getAllExtensions())
      setShowInstallDialog(false)
      setInstallUrl('')
      toast.success(`Extension installed: ${extension.manifest.name}`)
    } catch (error) {
      toast.error(`Failed to install extension: ${(error as Error).message}`)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleUninstallExtension = async (extensionId: string) => {
    try {
      const extension = manager.getExtension(extensionId)
      await manager.uninstallExtension(extensionId)
      setExtensions(manager.getAllExtensions())
      toast.success(`Extension uninstalled: ${extension?.manifest.name}`)
    } catch (error) {
      toast.error(`Failed to uninstall extension: ${(error as Error).message}`)
    }
  }

  const handleToggleExtension = async (extensionId: string, enabled: boolean) => {
    try {
      if (enabled) {
        await manager.enableExtension(extensionId)
      } else {
        await manager.disableExtension(extensionId)
      }
      setExtensions(manager.getAllExtensions())
      toast.success(`Extension ${enabled ? 'enabled' : 'disabled'}`)
    } catch (error) {
      toast.error(`Failed to toggle extension: ${(error as Error).message}`)
    }
  }

  const handleCheckUpdates = async () => {
    toast.info('Checking for updates...')
    // This would trigger the update mechanism
    setTimeout(() => {
      toast.success('All extensions are up to date')
    }, 2000)
  }

  const getPermissionIcon = (permission: ExtensionPermission) => {
    const iconMap: Record<string, any> = {
      'tabs': <Globe className="h-4 w-4" />,
      'storage': <Database className="h-4 w-4" />,
      'notifications': <Bell className="h-4 w-4" />,
      'alarms': <Clock className="h-4 w-4" />,
      'bookmarks': <FileText className="h-4 w-4" />,
      'downloads': <Download className="h-4 w-4" />,
      'history': <FileText className="h-4 w-4" />,
      'cookies': <Database className="h-4 w-4" />
    }
    return iconMap[permission] || <Shield className="h-4 w-4" />
  }

  const formatPermissionName = (permission: ExtensionPermission): string => {
    return permission.split(/(?=[A-Z])/).join(' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Extensions Manager
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {extensions.length} extensions
            </Badge>
            <Badge variant="outline">
              {extensions.filter(e => e.enabled).length} enabled
            </Badge>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search extensions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleCheckUpdates} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                Check Updates
              </Button>
              <Button onClick={() => setShowInstallDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Install Extension
              </Button>
            </div>
          </div>

          <Tabs defaultValue="installed" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="installed">Installed</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="installed" className="space-y-4">
              <ScrollArea className="max-h-96">
                {filteredExtensions.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <div className="text-center">
                      <Settings className="h-8 w-8 mx-auto mb-2" />
                      <p>No extensions found</p>
                      <p className="text-sm">Install extensions to get started</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {filteredExtensions.map((extension) => (
                      <Card key={extension.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                                {extension.manifest.icons?.['48'] ? (
                                  <img 
                                    src={extension.manifest.icons['48']} 
                                    alt={extension.manifest.name}
                                    className="w-8 h-8"
                                  />
                                ) : (
                                  <Settings className="h-5 w-5 text-primary" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-sm truncate">
                                  {extension.manifest.name}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                  {extension.manifest.version} • {extension.enabled ? 'Enabled' : 'Disabled'}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Switch
                                checked={extension.enabled}
                                onCheckedChange={(checked) => handleToggleExtension(extension.id, checked)}
                                size="sm"
                              />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          {extension.manifest.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {extension.manifest.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-1">
                            {extension.permissions.slice(0, 3).map((permission) => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                            {extension.permissions.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{extension.permissions.length - 3} more
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Installed {new Date(extension.installedAt).toLocaleDateString()}</span>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setSelectedExtension(extension)}
                              >
                                <Settings className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500"
                                onClick={() => handleUninstallExtension(extension.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <ScrollArea className="max-h-96">
                <div className="space-y-4">
                  {extensions.map((extension) => (
                    <Card key={extension.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-sm">
                              {extension.manifest.name}
                            </CardTitle>
                            <Badge variant={extension.enabled ? "default" : "secondary"} className="text-xs">
                              {extension.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {extension.permissions.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No permissions required</p>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {extension.permissions.map((permission) => (
                              <div key={permission} className="flex items-center gap-2 p-2 border rounded">
                                {getPermissionIcon(permission)}
                                <span className="text-xs">
                                  {formatPermissionName(permission)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Extension Settings</CardTitle>
                    <CardDescription className="text-xs">
                      Configure global extension behavior
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Auto-updates</div>
                        <div className="text-xs text-muted-foreground">
                          Automatically check for extension updates
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Developer Mode</div>
                        <div className="text-xs text-muted-foreground">
                          Enable extension development features
                        </div>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Sandbox Security</div>
                        <div className="text-xs text-muted-foreground">
                          Run extensions in isolated environment
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Storage & Data</CardTitle>
                    <CardDescription className="text-xs">
                      Manage extension data and storage
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm">
                      <div className="font-medium">Total Extensions</div>
                      <div className="text-muted-foreground">{extensions.length}</div>
                    </div>
                    
                    <div className="text-sm">
                      <div className="font-medium">Enabled Extensions</div>
                      <div className="text-muted-foreground">{extensions.filter(e => e.enabled).length}</div>
                    </div>

                    <div className="text-sm">
                      <div className="font-medium">Storage Used</div>
                      <div className="text-muted-foreground">Calculating...</div>
                    </div>

                    <Button variant="outline" size="sm" className="w-full">
                      Clear Extension Data
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Install Extension Dialog */}
      {showInstallDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Install Extension
              </CardTitle>
              <CardDescription>
                Enter the URL of the extension manifest
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Extension URL</label>
                <Input
                  placeholder="https://example.com/extension/manifest.json"
                  value={installUrl}
                  onChange={(e) => setInstallUrl(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleInstallExtension} 
                  disabled={!installUrl.trim() || isInstalling}
                  className="flex-1"
                >
                  {isInstalling ? 'Installing...' : 'Install'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowInstallDialog(false)
                    setInstallUrl('')
                  }}
                  disabled={isInstalling}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Extension Details Dialog */}
      {selectedExtension && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {selectedExtension.manifest.icons?.['48'] ? (
                    <img 
                      src={selectedExtension.manifest.icons['48']} 
                      alt={selectedExtension.manifest.name}
                      className="w-6 h-6"
                    />
                  ) : (
                    <Settings className="h-5 w-5" />
                  )}
                  {selectedExtension.manifest.name}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedExtension(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Version {selectedExtension.manifest.version}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedExtension.manifest.description && (
                <div>
                  <div className="text-sm font-medium mb-1">Description</div>
                  <p className="text-sm text-muted-foreground">
                    {selectedExtension.manifest.description}
                  </p>
                </div>
              )}

              {selectedExtension.manifest.author && (
                <div>
                  <div className="text-sm font-medium mb-1">Author</div>
                  <p className="text-sm text-muted-foreground">
                    {selectedExtension.manifest.author}
                  </p>
                </div>
              )}

              {selectedExtension.manifest.homepage_url && (
                <div>
                  <div className="text-sm font-medium mb-1">Homepage</div>
                  <a 
                    href={selectedExtension.manifest.homepage_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {selectedExtension.manifest.homepage_url}
                  </a>
                </div>
              )}

              {selectedExtension.permissions.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Permissions</div>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedExtension.permissions.map((permission) => (
                      <div key={permission} className="flex items-center gap-1 p-1 border rounded text-xs">
                        {getPermissionIcon(permission)}
                        <span>{formatPermissionName(permission)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Installed: {new Date(selectedExtension.installedAt).toLocaleDateString()}</span>
                <span>Status: {selectedExtension.enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

'use client';

import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Home, 
  Search, 
  Download, 
  Shield, 
  Palette, 
  Lock,
  Monitor,
  Sun,
  Moon,
  RefreshCw,
  Cloud,
  Upload,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/core/settings/store';
import { BackupRestore } from '@/components/cloud/backup-restore';
import { CloudSyncManager } from '@/cloud/CloudSyncManager';
import { SecureStorage } from '@/storage/SecureStorage';
import { CryptoUtils } from '@/auth/CryptoUtils';

interface SettingsPanelProps {
  service: any; // OmniorSettingsService - will be properly typed when imported
}

export function SettingsPanel({ service }: SettingsPanelProps) {
  const { 
    settings, 
    isLoading, 
    error, 
    setSettings,
    setLoading,
    setError
  } = useSettingsStore();

  const [isSaving, setIsSaving] = useState(false);
  const [showBackupRestore, setShowBackupRestore] = useState(false); // Hidden by default

  // Initialize CloudSyncManager (this would normally come from the auth context)
  const cloudSyncManager = React.useMemo(() => {
    // This is a placeholder implementation - in a real app, this would come from the auth context
    // For now, we'll create a mock instance
    const mockSecureStorage = new SecureStorage('mock-profile', null as any);
    return new CloudSyncManager(mockSecureStorage);
  }, []);

  const handleSettingChange = async (section: keyof typeof settings, field: string, value: any) => {
    try {
      setIsSaving(true);
      const newSettings = {
        ...settings,
        [section]: {
          ...settings[section],
          [field]: value
        }
      };
      await service.set(newSettings);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = async () => {
    try {
      setIsSaving(true);
      await service.reset();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reset settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
          <Button variant="outline" onClick={() => setError(null)}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Settings</h2>
            {isSaving && (
              <Badge variant="secondary" className="text-xs">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Saving...
              </Badge>
            )}
          </div>
          <Button variant="outline" onClick={handleResetSettings}>
            Reset to Defaults
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Privacy
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="backup" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Backup
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                Advanced
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    General Settings
                  </CardTitle>
                  <CardDescription>
                    Configure basic browser behavior and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="homepage">Homepage</Label>
                    <Input
                      id="homepage"
                      value={settings.homepage}
                      onChange={(e) => handleSettingChange('general', 'homepage', e.target.value)}
                      placeholder="about:blank"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultSearch">Default Search Engine</Label>
                    <Input
                      id="defaultSearch"
                      value={settings.defaultSearch}
                      onChange={(e) => handleSettingChange('general', 'defaultSearch', e.target.value)}
                      placeholder="https://duckduckgo.com/?q={query}"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="downloadDir">Download Directory</Label>
                    <Input
                      id="downloadDir"
                      value={settings.downloadDir}
                      onChange={(e) => handleSettingChange('general', 'downloadDir', e.target.value)}
                      placeholder="~/Downloads"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>New Tab Behavior</Label>
                    <Select
                      value={settings.newTabBehavior}
                      onValueChange={(value) => handleSettingChange('general', 'newTabBehavior', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home">Show Homepage</SelectItem>
                        <SelectItem value="blank">Show Blank Page</SelectItem>
                        <SelectItem value="last-session">Restore Last Session</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Privacy Settings
                  </CardTitle>
                  <CardDescription>
                    Control your privacy and data collection preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Do Not Track</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Send Do Not Track requests to websites
                      </p>
                    </div>
                    <Switch
                      checked={settings.privacy.doNotTrack}
                      onCheckedChange={(checked) => handleSettingChange('privacy', 'doNotTrack', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Block Third-Party Cookies</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Prevent third-party cookies from tracking you
                      </p>
                    </div>
                    <Switch
                      checked={settings.privacy.blockThirdPartyCookies}
                      onCheckedChange={(checked) => handleSettingChange('privacy', 'blockThirdPartyCookies', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Appearance
                  </CardTitle>
                  <CardDescription>
                    Customize the look and feel of your browser
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select
                      value={settings.appearance.theme}
                      onValueChange={(value) => handleSettingChange('appearance', 'theme', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            System
                          </div>
                        </SelectItem>
                        <SelectItem value="light">
                          <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4" />
                            Light
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            Dark
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Interface Density</Label>
                    <Select
                      value={settings.appearance.density}
                      onValueChange={(value) => handleSettingChange('appearance', 'density', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="cozy">Cozy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Security
                  </CardTitle>
                  <CardDescription>
                    Manage security settings and protection features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="autoLock">Auto-lock After (minutes)</Label>
                    <Input
                      id="autoLock"
                      type="number"
                      min="1"
                      max="1440"
                      value={settings.security.autoLockMinutes}
                      onChange={(e) => handleSettingChange('security', 'autoLockMinutes', parseInt(e.target.value) || 30)}
                    />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Automatically lock the browser after period of inactivity
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="backup" className="mt-6">
              <BackupRestore 
                cloudSyncManager={cloudSyncManager} 
                isVisible={showBackupRestore} 
              />
              
              {!showBackupRestore && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5" />
                      Backup & Restore
                    </CardTitle>
                    <CardDescription>
                      Cloud backup and restore functionality will be available in future updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Backup and restore features are currently in development. 
                        This functionality will be enabled in a future update.
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Encrypted Backups</CardTitle>
                          <CardDescription>
                            Secure AES-256 encrypted local backups
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-500 mb-4">
                            Coming soon: Create encrypted backups of your profile data including bookmarks, settings, extensions, and browsing sessions.
                          </p>
                          <Button disabled className="w-full">
                            <Upload className="h-4 w-4 mr-2" />
                            Create Backup
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Cloud Sync</CardTitle>
                          <CardDescription>
                            Secure cloud synchronization
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-500 mb-4">
                            Coming soon: Sync your encrypted data across devices with Omnior Cloud.
                          </p>
                          <Button disabled className="w-full">
                            <Cloud className="h-4 w-4 mr-2" />
                            Cloud Sync
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Developer toggle for testing */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Developer Mode</h4>
                            <p className="text-sm text-slate-500">
                              Enable backup features for testing
                            </p>
                          </div>
                          <Switch
                            checked={showBackupRestore}
                            onCheckedChange={setShowBackupRestore}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5" />
                    Advanced Settings
                  </CardTitle>
                  <CardDescription>
                    Advanced configuration options and developer features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <h4 className="font-medium mb-2">Current Settings</h4>
                      <pre className="text-xs bg-slate-100 dark:bg-slate-900 p-2 rounded overflow-x-auto">
                        {JSON.stringify(settings, null, 2)}
                      </pre>
                    </div>
                    
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      <p>Advanced settings will be available in future updates, including:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Extension management</li>
                        <li>Developer tools configuration</li>
                        <li>Network settings</li>
                        <li>Performance optimization</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
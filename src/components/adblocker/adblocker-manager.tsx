'use client';

import React, { useState, useEffect } from 'react';
import { useAdBlocker } from '@/hooks/use-adblocker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Settings, 
  BarChart3, 
  Globe,
  X,
  Loader2,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  Ban,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';

interface AdBlockerManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdBlockerManager({ isOpen, onClose }: AdBlockerManagerProps) {
  const {
    filterLists,
    customRules,
    stats,
    settings,
    isUpdating,
    shouldBlockRequest,
    toggleBlocker,
    toggleFilterList,
    updateFilterList,
    updateAllFilterLists,
    getEnabledFilterListsCount,
    getTotalRulesCount,
    addCustomRule,
    updateCustomRule,
    deleteCustomRule,
    getSiteSettings,
    updateSiteSettings,
    toggleSiteWhitelist,
    toggleSiteBlocker,
    updateSettings,
    isAutoUpdateEnabled,
    refreshStats,
    resetStats,
    getTodayBlockedCount,
    getTopBlockedDomains,
    getBlockedByType
  } = useAdBlocker();

  const [newRulePattern, setNewRulePattern] = useState('');
  const [newRuleType, setNewRuleType] = useState<'block' | 'allow' | 'redirect'>('block');
  const [currentDomain, setCurrentDomain] = useState('');
  const [showStats, setShowStats] = useState(false);
  
  const { toast } = useToast();

  // Keyboard shortcut to toggle panel
  useKeyboardShortcut(['Control', 'KeyB'], () => {
    if (isOpen) {
      onClose();
    }
  });

  // Get current domain
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentDomain(window.location.hostname);
    }
  }, []);

  // Auto-refresh stats
  useEffect(() => {
    const interval = setInterval(refreshStats, 5000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  const handleToggleFilterList = async (id: string) => {
    toggleFilterList(id);
    toast({
      title: "Filter List Updated",
      description: "Filter list has been toggled successfully."
    });
  };

  const handleUpdateFilterList = async (id: string) => {
    const success = await updateFilterList(id);
    if (success) {
      toast({
        title: "Filter List Updated",
        description: "Filter list has been updated successfully."
      });
    } else {
      toast({
        title: "Update Failed",
        description: "Failed to update filter list.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateAllFilterLists = async () => {
    await updateAllFilterLists();
    toast({
      title: "All Filter Lists Updated",
      description: "All enabled filter lists have been updated."
    });
  };

  const handleAddCustomRule = () => {
    if (newRulePattern.trim() === '') return;

    try {
      addCustomRule({
        pattern: newRulePattern.trim(),
        type: newRuleType,
        domains: [],
        resourceTypes: ['script', 'image', 'stylesheet'],
        thirdParty: true,
        matchCase: false,
        enabled: true
      });

      setNewRulePattern('');
      toast({
        title: "Custom Rule Added",
        description: "New custom blocking rule has been added."
      });
    } catch (error) {
      toast({
        title: "Failed to Add Rule",
        description: "Could not add custom rule.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCustomRule = (id: string) => {
    deleteCustomRule(id);
    toast({
      title: "Rule Deleted",
      description: "Custom rule has been deleted."
    });
  };

  const handleToggleSiteWhitelist = (domain: string) => {
    toggleSiteWhitelist(domain);
    const siteSettings = getSiteSettings(domain);
    toast({
      title: siteSettings.whitelisted ? "Site Whitelisted" : "Site Removed from Whitelist",
      description: `${domain} has been ${siteSettings.whitelisted ? 'whitelisted' : 'removed from whitelist'}.`
    });
  };

  const handleToggleSiteBlocker = (domain: string) => {
    toggleSiteBlocker(domain);
    const siteSettings = getSiteSettings(domain);
    toast({
      title: siteSettings.enabled ? "Blocker Enabled" : "Blocker Disabled",
      description: `Ad blocker has been ${siteSettings.enabled ? 'enabled' : 'disabled'} for ${domain}.`
    });
  };

  const handleResetStats = () => {
    resetStats();
    toast({
      title: "Statistics Reset",
      description: "All statistics have been reset."
    });
  };

  const enabledFilterListsCount = getEnabledFilterListsCount();
  const totalRulesCount = getTotalRulesCount();
  const todayBlockedCount = getTodayBlockedCount();
  const topBlockedDomains = getTopBlockedDomains(5);
  const blockedByType = getBlockedByType();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative ml-auto h-full w-full max-w-5xl bg-background border-l shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Ad Blocker</h2>
            <Badge variant={settings.enabled ? "default" : "secondary"} className="text-xs">
              {settings.enabled ? "Enabled" : "Disabled"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {todayBlockedCount} blocked today
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex h-[calc(100%-60px)]">
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Status Bar */}
            <div className="p-4 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={toggleBlocker}
                    />
                    <span className="font-medium">
                      {settings.enabled ? "Blocker Enabled" : "Blocker Disabled"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>{enabledFilterListsCount} of {filterLists.length} lists active</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Ban className="h-4 w-4" />
                    <span>{totalRulesCount.toLocaleString()} rules</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUpdateAllFilterLists}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Update All
                  </Button>
                </div>
              </div>
            </div>

            {/* Current Site Settings */}
            {currentDomain && (
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="font-medium">Current Site:</span>
                    <Badge variant="outline">{currentDomain}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleSiteWhitelist(currentDomain)}
                    >
                      {getSiteSettings(currentDomain).whitelisted ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Remove from Whitelist
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Add to Whitelist
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleSiteBlocker(currentDomain)}
                    >
                      {getSiteSettings(currentDomain).enabled ? (
                        <>
                          <Ban className="h-4 w-4 mr-2" />
                          Disable Blocker
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Enable Blocker
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex-1">
              <Tabs defaultValue="filterlists" className="h-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="filterlists">Filter Lists</TabsTrigger>
                  <TabsTrigger value="customrules">Custom Rules</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="filterlists" className="p-4">
                  <ScrollArea className="h-[calc(100vh-300px)]">
                    <div className="space-y-3">
                      {filterLists.map(list => (
                        <Card key={list.id}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={list.enabled}
                                  onCheckedChange={() => handleToggleFilterList(list.id)}
                                />
                                <CardTitle className="text-base">{list.name}</CardTitle>
                                {list.enabled && (
                                  <Badge variant="secondary" className="text-xs">
                                    {list.ruleCount.toLocaleString()} rules
                                  </Badge>
                                )}
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateFilterList(list.id)}
                                disabled={isUpdating}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </div>
                            <CardDescription>{list.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>Source: {new URL(list.url).hostname}</span>
                              <span>Last updated: {list.lastUpdated.toLocaleDateString()}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="customrules" className="p-4">
                  <div className="space-y-4">
                    {/* Add Custom Rule */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Add Custom Rule</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter pattern (e.g., ads, tracking, analytics)"
                            value={newRulePattern}
                            onChange={(e) => setNewRulePattern(e.target.value)}
                            className="flex-1"
                          />
                          <select
                            value={newRuleType}
                            onChange={(e) => setNewRuleType(e.target.value as any)}
                            className="px-3 py-2 border rounded-md"
                          >
                            <option value="block">Block</option>
                            <option value="allow">Allow</option>
                            <option value="redirect">Redirect</option>
                          </select>
                          <Button onClick={handleAddCustomRule}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Custom Rules List */}
                    <ScrollArea className="h-[calc(100vh-400px)]">
                      <div className="space-y-2">
                        {customRules.length === 0 ? (
                          <div className="text-center text-muted-foreground py-8">
                            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No custom rules yet</p>
                            <p className="text-sm">Add custom blocking rules above</p>
                          </div>
                        ) : (
                          customRules.map(rule => (
                            <Card key={rule.id}>
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge variant={rule.type === 'block' ? 'destructive' : rule.type === 'allow' ? 'default' : 'secondary'}>
                                      {rule.type}
                                    </Badge>
                                    <code className="text-sm bg-muted px-2 py-1 rounded">
                                      {rule.pattern}
                                    </code>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteCustomRule(rule.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="p-4">
                  <ScrollArea className="h-[calc(100vh-300px)]">
                    <div className="space-y-6">
                      {/* General Settings */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">General Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Block Trackers</div>
                              <div className="text-sm text-muted-foreground">
                                Block tracking scripts and cookies
                              </div>
                            </div>
                            <Switch
                              checked={settings.blockTrackers}
                              onCheckedChange={(checked) => updateSettings({ blockTrackers: checked })}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Block Ads</div>
                              <div className="text-sm text-muted-foreground">
                                Block advertisements and promotional content
                              </div>
                            </div>
                            <Switch
                              checked={settings.blockAds}
                              onCheckedChange={(checked) => updateSettings({ blockAds: checked })}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Block Malware</div>
                              <div className="text-sm text-muted-foreground">
                                Block known malware domains
                              </div>
                            </div>
                            <Switch
                              checked={settings.blockMalware}
                              onCheckedChange={(checked) => updateSettings({ blockMalware: checked })}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Block Social Media</div>
                              <div className="text-sm text-muted-foreground">
                                Block social media widgets and buttons
                              </div>
                            </div>
                            <Switch
                              checked={settings.blockSocial}
                              onCheckedChange={(checked) => updateSettings({ blockSocial: checked })}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Block Annoyances</div>
                              <div className="text-sm text-muted-foreground">
                                Block cookie notices, pop-ups, and overlays
                              </div>
                            </div>
                            <Switch
                              checked={settings.blockAnnoyances}
                              onCheckedChange={(checked) => updateSettings({ blockAnnoyances: checked })}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Auto-update Settings */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Auto-update</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Auto-update Filter Lists</div>
                              <div className="text-sm text-muted-foreground">
                                Automatically update filter lists
                              </div>
                            </div>
                            <Switch
                              checked={settings.autoUpdate}
                              onCheckedChange={(checked) => updateSettings({ autoUpdate: checked })}
                            />
                          </div>

                          {settings.autoUpdate && (
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Update Interval</div>
                                <div className="text-sm text-muted-foreground">
                                  How often to check for updates
                                </div>
                              </div>
                              <select
                                value={settings.updateInterval}
                                onChange={(e) => updateSettings({ updateInterval: parseInt(e.target.value) })}
                                className="px-3 py-2 border rounded-md"
                              >
                                <option value="6">Every 6 hours</option>
                                <option value="12">Every 12 hours</option>
                                <option value="24">Every 24 hours</option>
                                <option value="48">Every 2 days</option>
                                <option value="168">Every week</option>
                              </select>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* UI Settings */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Interface</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Show Blocked Count</div>
                              <div className="text-sm text-muted-foreground">
                                Show number of blocked items in toolbar
                              </div>
                            </div>
                            <Switch
                              checked={settings.showBlockedCount}
                              onCheckedChange={(checked) => updateSettings({ showBlockedCount: checked })}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Enable Context Menu</div>
                              <div className="text-sm text-muted-foreground">
                                Add ad blocker options to context menu
                              </div>
                            </div>
                            <Switch
                              checked={settings.enableContextMenu}
                              onCheckedChange={(checked) => updateSettings({ enableContextMenu: checked })}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Enable Statistics</div>
                              <div className="text-sm text-muted-foreground">
                                Track and display blocking statistics
                              </div>
                            </div>
                            <Switch
                              checked={settings.enableStats}
                              onCheckedChange={(checked) => updateSettings({ enableStats: checked })}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Statistics Sidebar */}
          {showStats && (
            <div className="w-80 border-l flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Statistics</h3>
                  <Button variant="ghost" size="sm" onClick={handleResetStats}>
                    Reset
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Blocked</span>
                    <Badge variant="secondary">{stats.totalBlocked.toLocaleString()}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Today</span>
                    <Badge variant="default">{todayBlockedCount.toLocaleString()}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Rules</span>
                    <Badge variant="outline">{totalRulesCount.toLocaleString()}</Badge>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Blocked by Type */}
                  {blockedByType.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Blocked by Type</h4>
                      <div className="space-y-1">
                        {blockedByType.map(({ type, count }) => (
                          <div key={type} className="flex items-center justify-between text-sm">
                            <span className="capitalize">{type}</span>
                            <Badge variant="outline" className="text-xs">
                              {count}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Blocked Domains */}
                  {topBlockedDomains.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Top Blocked Domains</h4>
                      <div className="space-y-1">
                        {topBlockedDomains.map(({ domain, count }) => (
                          <div key={domain} className="flex items-center justify-between text-sm">
                            <span className="truncate">{domain}</span>
                            <Badge variant="outline" className="text-xs">
                              {count}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
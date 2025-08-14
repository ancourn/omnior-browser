/**
 * Omnior Sync & Services Panel
 * 
 * A revolutionary sync interface that showcases AI-powered synchronization
 * with intelligent features, predictive capabilities, and privacy-first design.
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  Cloud, 
  Smartphone, 
  Laptop, 
  Tablet, 
  Sync, 
  Settings, 
  Shield, 
  Zap,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  Brain,
  Lock,
  Database,
  Activity,
  Users,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface SyncDevice {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  lastSync: Date;
  isOnline: boolean;
  capabilities: string[];
}

interface SyncStats {
  totalSynced: number;
  lastSync: Date;
  compressionRatio: number;
  bandwidthSaved: number;
  conflictsResolved: number;
  devicesConnected: number;
}

interface SyncInsights {
  predictions: string[];
  recommendations: string[];
  optimization: {
    compression: string;
    timing: string;
    dataSelection: string;
  };
}

export default function OmniorSyncPanel() {
  const [devices, setDevices] = useState<SyncDevice[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStats, setSyncStats] = useState<SyncStats>({
    totalSynced: 0,
    lastSync: new Date(),
    compressionRatio: 0,
    bandwidthSaved: 0,
    conflictsResolved: 0,
    devicesConnected: 0
  });
  const [insights, setInsights] = useState<SyncInsights>({
    predictions: [],
    recommendations: [],
    optimization: {
      compression: '',
      timing: '',
      dataSelection: ''
    }
  });
  const [settings, setSettings] = useState({
    enabled: true,
    wifiOnly: false,
    compression: true,
    predictiveSync: true,
    intelligentSync: true
  });

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Mock devices
    const mockDevices: SyncDevice[] = [
      {
        id: '1',
        name: 'Work Laptop',
        type: 'desktop',
        lastSync: new Date(Date.now() - 5 * 60 * 1000),
        isOnline: true,
        capabilities: ['full-sync', 'ai-processing', 'offline-mode']
      },
      {
        id: '2',
        name: 'Personal Phone',
        type: 'mobile',
        lastSync: new Date(Date.now() - 15 * 60 * 1000),
        isOnline: true,
        capabilities: ['basic-sync', 'ai-processing']
      },
      {
        id: '3',
        name: 'Home Tablet',
        type: 'tablet',
        lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isOnline: false,
        capabilities: ['basic-sync', 'offline-mode']
      }
    ];

    // Mock stats
    const mockStats: SyncStats = {
      totalSynced: 2847,
      lastSync: new Date(Date.now() - 5 * 60 * 1000),
      compressionRatio: 68,
      bandwidthSaved: 2.4,
      conflictsResolved: 12,
      devicesConnected: 2
    };

    // Mock insights
    const mockInsights: SyncInsights = {
      predictions: [
        'Work bookmarks will be needed in 2 hours',
        'Entertainment extensions sync recommended',
        'Offline content preparation for travel mode'
      ],
      recommendations: [
        'Enable predictive sync for 40% faster access',
        'Use AI compression to save 70% bandwidth',
        'Schedule sync during off-peak hours'
      ],
      optimization: {
        compression: 'AI compression enabled - 68% reduction',
        timing: 'Optimal sync: 2:00 AM - 4:00 AM',
        dataSelection: 'Intelligent data selection active'
      }
    };

    setDevices(mockDevices);
    setSyncStats(mockStats);
    setInsights(mockInsights);
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncProgress(0);

    // Simulate sync progress
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'desktop':
        return <Laptop className="h-5 w-5" />;
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      default:
        return <Laptop className="h-5 w-5" />;
    }
  };

  const formatLastSync = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Cloud className="h-6 w-6 text-blue-600" />
            Omnior Sync & Services
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            AI-powered synchronization with predictive intelligence and privacy-first design
          </p>
        </div>
        <Button 
          onClick={handleSyncNow} 
          disabled={isSyncing}
          className="flex items-center gap-2"
        >
          {isSyncing ? (
            <>
              <Sync className="h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <Sync className="h-4 w-4" />
              Sync Now
            </>
          )}
        </Button>
      </div>

      {/* Sync Progress */}
      {isSyncing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Syncing across devices...</span>
                <span>{Math.round(syncProgress)}%</span>
              </div>
              <Progress value={syncProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{syncStats.totalSynced}</p>
                <p className="text-xs text-slate-600">Items Synced</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{syncStats.compressionRatio}%</p>
                <p className="text-xs text-slate-600">Compression</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{syncStats.bandwidthSaved}GB</p>
                <p className="text-xs text-slate-600">Bandwidth Saved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{syncStats.devicesConnected}</p>
                <p className="text-xs text-slate-600">Devices Online</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{syncStats.conflictsResolved}</p>
                <p className="text-xs text-slate-600">Conflicts Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-bold">{formatLastSync(syncStats.lastSync)}</p>
                <p className="text-xs text-slate-600">Last Sync</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="devices" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Devices
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid gap-4">
            {devices.map(device => (
              <Card key={device.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(device.type)}
                        <div>
                          <h3 className="font-semibold">{device.name}</h3>
                          <p className="text-sm text-slate-600 capitalize">{device.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {device.isOnline ? (
                          <Badge variant="default" className="bg-green-600">
                            <Wifi className="h-3 w-3 mr-1" />
                            Online
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <WifiOff className="h-3 w-3 mr-1" />
                            Offline
                          </Badge>
                        )}
                        <span className="text-sm text-slate-600">
                          Last sync: {formatLastSync(device.lastSync)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {device.capabilities.map(capability => (
                        <Badge key={capability} variant="outline" className="text-xs">
                          {capability.replace('-', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  AI Predictions
                </CardTitle>
                <CardDescription>
                  Predictive sync based on your usage patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.predictions.map((prediction, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Zap className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{prediction}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Optimization
                </CardTitle>
                <CardDescription>
                  AI-optimized sync settings and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Compression
                    </p>
                    <p className="text-sm text-slate-600">{insights.optimization.compression}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Timing
                    </p>
                    <p className="text-sm text-slate-600">{insights.optimization.timing}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Data Selection
                    </p>
                    <p className="text-sm text-slate-600">{insights.optimization.dataSelection}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                Recommendations
              </CardTitle>
              <CardDescription>
                Personalized suggestions to improve your sync experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {insights.recommendations.map((recommendation, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">AI Suggestion #{index + 1}</span>
                    </div>
                    <p className="text-sm text-slate-600">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sync Settings</CardTitle>
              <CardDescription>
                Configure how Omnior syncs your data across devices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enabled">Enable Sync</Label>
                  <p className="text-sm text-slate-600">
                    Sync your data across all Omnior devices
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings({...settings, enabled: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="wifiOnly">WiFi Only</Label>
                  <p className="text-sm text-slate-600">
                    Only sync when connected to WiFi to save mobile data
                  </p>
                </div>
                <Switch
                  id="wifiOnly"
                  checked={settings.wifiOnly}
                  onCheckedChange={(checked) => setSettings({...settings, wifiOnly: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compression">AI Compression</Label>
                  <p className="text-sm text-slate-600">
                    Use AI to compress data and reduce bandwidth usage
                  </p>
                </div>
                <Switch
                  id="compression"
                  checked={settings.compression}
                  onCheckedChange={(checked) => setSettings({...settings, compression: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="predictiveSync">Predictive Sync</Label>
                  <p className="text-sm text-slate-600">
                    AI predicts what you'll need and syncs it in advance
                  </p>
                </div>
                <Switch
                  id="predictiveSync"
                  checked={settings.predictiveSync}
                  onCheckedChange={(checked) => setSettings({...settings, predictiveSync: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="intelligentSync">Intelligent Sync</Label>
                  <p className="text-sm text-slate-600">
                    AI optimizes sync timing and data selection automatically
                  </p>
                </div>
                <Switch
                  id="intelligentSync"
                  checked={settings.intelligentSync}
                  onCheckedChange={(checked) => setSettings({...settings, intelligentSync: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-green-600" />
                  Data Encryption
                </CardTitle>
                <CardDescription>
                  Your data is protected with end-to-end encryption
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">End-to-End Encryption</p>
                      <p className="text-sm text-slate-600">All data is encrypted before leaving your device</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Zero-Knowledge Architecture</p>
                      <p className="text-sm text-slate-600">We can't access your encrypted data</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">AI Privacy Controls</p>
                      <p className="text-sm text-slate-600">AI processing respects your privacy settings</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Privacy Controls
                </CardTitle>
                <CardDescription>
                  Fine-tune what data gets synced and how it's processed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Data Types to Sync</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="bookmarks" defaultChecked className="rounded" />
                        <label htmlFor="bookmarks" className="text-sm">Bookmarks</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="history" defaultChecked className="rounded" />
                        <label htmlFor="history" className="text-sm">History</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="passwords" defaultChecked className="rounded" />
                        <label htmlFor="passwords" className="text-sm">Passwords</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="settings" defaultChecked className="rounded" />
                        <label htmlFor="settings" className="text-sm">Settings</label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">AI Processing Level</Label>
                    <select className="mt-1 w-full rounded border px-3 py-2 text-sm">
                      <option>Local Only</option>
                      <option>Hybrid (Recommended)</option>
                      <option>Cloud Enhanced</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-600" />
                Data Centers & Regions
              </CardTitle>
              <CardDescription>
                Choose where your encrypted data is stored
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                  <div className="text-center">
                    <Globe className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-medium">United States</h3>
                    <p className="text-sm text-slate-600">East & West Coast</p>
                    <Badge variant="outline" className="mt-2">Default</Badge>
                  </div>
                </div>
                <div className="p-4 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                  <div className="text-center">
                    <Globe className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <h3 className="font-medium">Europe</h3>
                    <p className="text-sm text-slate-600">GDPR Compliant</p>
                  </div>
                </div>
                <div className="p-4 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                  <div className="text-center">
                    <Globe className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <h3 className="font-medium">Asia Pacific</h3>
                    <p className="text-sm text-slate-600">Singapore & Tokyo</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
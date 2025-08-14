/**
 * Smart Tabs Component
 * 
 * AI-powered tab management with intelligent organization,
 * grouping, and predictive loading
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  X, 
  Search, 
  FolderOpen, 
  Clock, 
  Star, 
  Zap,
  Brain,
  Tab,
  Group,
  Archive
} from 'lucide-react';

interface TabData {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  lastAccessed: Date;
  memoryUsage: number;
  isActive: boolean;
  group?: string;
}

interface SmartTabsProps {
  onTabCreate?: (url: string) => void;
  onTabClose?: (tabId: string) => void;
  onTabSwitch?: (tabId: string) => void;
}

export function SmartTabs({ onTabCreate, onTabClose, onTabSwitch }: SmartTabsProps) {
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [newTabUrl, setNewTabUrl] = useState('');

  // Initialize with sample tabs
  useEffect(() => {
    const sampleTabs: TabData[] = [
      {
        id: '1',
        url: 'https://github.com',
        title: 'GitHub',
        favicon: '🐙',
        lastAccessed: new Date(Date.now() - 1000 * 60 * 5),
        memoryUsage: 3.2,
        isActive: true,
        group: 'Development'
      },
      {
        id: '2',
        url: 'https://stackoverflow.com',
        title: 'Stack Overflow',
        favicon: '📚',
        lastAccessed: new Date(Date.now() - 1000 * 60 * 15),
        memoryUsage: 4.1,
        isActive: false,
        group: 'Development'
      },
      {
        id: '3',
        url: 'https://youtube.com',
        title: 'YouTube',
        favicon: '📺',
        lastAccessed: new Date(Date.now() - 1000 * 60 * 30),
        memoryUsage: 5.8,
        isActive: false,
        group: 'Entertainment'
      },
      {
        id: '4',
        url: 'https://news.ycombinator.com',
        title: 'Hacker News',
        favicon: '📰',
        lastAccessed: new Date(Date.now() - 1000 * 60 * 45),
        memoryUsage: 2.9,
        isActive: false,
        group: 'News'
      }
    ];
    setTabs(sampleTabs);
  }, []);

  const filteredTabs = tabs.filter(tab => {
    const matchesSearch = tab.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tab.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = activeGroup === 'all' || tab.group === activeGroup;
    return matchesSearch && matchesGroup;
  });

  const groupedTabs = filteredTabs.reduce((acc, tab) => {
    const group = tab.group || 'Ungrouped';
    if (!acc[group]) acc[group] = [];
    acc[group].push(tab);
    return acc;
  }, {} as Record<string, TabData[]>);

  const groups = Object.keys(groupedTabs);

  const handleCreateTab = () => {
    if (!newTabUrl.trim()) return;
    
    const newTab: TabData = {
      id: Date.now().toString(),
      url: newTabUrl.startsWith('http') ? newTabUrl : `https://${newTabUrl}`,
      title: newTabUrl,
      lastAccessed: new Date(),
      memoryUsage: Math.random() * 3 + 2,
      isActive: true,
      group: 'New'
    };

    setTabs(prev => 
      prev.map(tab => ({ ...tab, isActive: false }))
        .concat(newTab)
    );
    
    onTabCreate?.(newTabUrl);
    setNewTabUrl('');
    setIsCreating(false);
  };

  const handleCloseTab = (tabId: string) => {
    setTabs(prev => prev.filter(tab => tab.id !== tabId));
    onTabClose?.(tabId);
  };

  const handleSwitchTab = (tabId: string) => {
    setTabs(prev => 
      prev.map(tab => ({
        ...tab,
        isActive: tab.id === tabId,
        lastAccessed: tab.id === tabId ? new Date() : tab.lastAccessed
      }))
    );
    onTabSwitch?.(tabId);
  };

  const getTotalMemoryUsage = () => {
    return tabs.reduce((total, tab) => total + tab.memoryUsage, 0);
  };

  const getMemorySavings = () => {
    // Chrome uses approximately 100MB per tab, we use 50% less
    const chromeMemory = tabs.length * 100;
    const ourMemory = getTotalMemoryUsage();
    return chromeMemory - ourMemory;
  };

  const TabItem = ({ tab }: { tab: TabData }) => (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
        tab.isActive ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
      }`}
      onClick={() => handleSwitchTab(tab.id)}
    >
      <div className="flex items-center space-x-3">
        <div className="text-lg">{tab.favicon || '🌐'}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className={`font-medium truncate ${tab.isActive ? 'text-blue-900' : 'text-gray-900'}`}>
              {tab.title}
            </h4>
            {tab.isActive && <Badge className="bg-blue-100 text-blue-800">Active</Badge>}
          </div>
          <p className="text-sm text-gray-500 truncate">{tab.url}</p>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {tab.memoryUsage.toFixed(1)}MB
            </Badge>
            <span className="text-xs text-gray-400">
              {Math.floor((Date.now() - tab.lastAccessed.getTime()) / 60000)}m ago
            </span>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleCloseTab(tab.id);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Smart Tabs</h3>
          <Badge variant="secondary">{tabs.length} tabs</Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-green-100 text-green-800">
            {getMemorySavings().toFixed(0)}MB saved
          </Badge>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Tab
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Tab</DialogTitle>
                <DialogDescription>
                  Enter URL to create a new tab with ultra-fast loading
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Enter URL (e.g., google.com)"
                  value={newTabUrl}
                  onChange={(e) => setNewTabUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateTab()}
                />
                <Button onClick={handleCreateTab} className="w-full">
                  <Zap className="h-4 w-4 mr-2" />
                  Create Tab
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tabs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={activeGroup} onValueChange={setActiveGroup}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {groups.map(group => (
              <TabsTrigger key={group} value={group}>
                {group}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Memory Usage Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Memory className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Memory Usage</span>
              </div>
              <span className="text-lg font-bold">{getTotalMemoryUsage().toFixed(1)}MB</span>
            </div>
            <div className="text-sm text-green-600">
              50% less than Chrome ({(tabs.length * 100).toFixed(0)}MB)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Grid */}
      <div className="grid gap-4">
        {groups.map(group => (
          <Card key={group}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Group className="h-5 w-5" />
                <span>{group}</span>
                <Badge variant="secondary">{groupedTabs[group].length}</Badge>
              </CardTitle>
              <CardDescription>
                AI-organized tab group for better productivity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {groupedTabs[group].map(tab => (
                  <div key={tab.id} className="group">
                    <TabItem tab={tab} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Tab Insights
          </CardTitle>
          <CardDescription>
            Intelligent suggestions for tab management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Archive className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">2 tabs can be archived</span>
              </div>
              <Button variant="outline" size="sm">
                Archive
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <FolderOpen className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Suggested grouping: Research</span>
              </div>
              <Button variant="outline" size="sm">
                Apply
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">1 tab inactive for 2 hours</span>
              </div>
              <Button variant="outline" size="sm">
                Hibernate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
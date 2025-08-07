import React, { useState, useEffect, useRef } from 'react';
import { Zap, Brain, Settings, Plus, Trash2, Play, Pause, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useBrowserStore } from '../store/browserStore';

interface SmartShortcut {
  id: string;
  name: string;
  description: string;
  trigger: string; // Natural language trigger
  actions: ShortcutAction[];
  enabled: boolean;
  usageCount: number;
  lastUsed: number | null;
  category: 'productivity' | 'privacy' | 'navigation' | 'content' | 'custom';
}

interface ShortcutAction {
  type: 'open_url' | 'switch_tab' | 'new_tab' | 'close_tab' | 'vpn_toggle' | 'translate' | 'screenshot' | 'bookmark';
  parameters: Record<string, any>;
}

interface SmartShortcutsProps {
  className?: string;
}

const DEFAULT_SHORTCUTS: SmartShortcut[] = [
  {
    id: '1',
    name: 'Quick Research',
    description: 'Open research tabs for current topic',
    trigger: 'research this topic',
    actions: [
      { type: 'new_tab', parameters: { url: 'https://scholar.google.com' } },
      { type: 'new_tab', parameters: { url: 'https://wikipedia.org' } },
    ],
    enabled: true,
    usageCount: 0,
    lastUsed: null,
    category: 'productivity'
  },
  {
    id: '2',
    name: 'Privacy Mode',
    description: 'Enable VPN and clear browsing data',
    trigger: 'go private',
    actions: [
      { type: 'vpn_toggle', parameters: { enabled: true, country: 'US' } },
    ],
    enabled: true,
    usageCount: 0,
    lastUsed: null,
    category: 'privacy'
  },
  {
    id: '3',
    name: 'Developer Tools',
    description: 'Open essential developer tabs',
    trigger: 'dev mode',
    actions: [
      { type: 'new_tab', parameters: { url: 'https://github.com' } },
      { type: 'new_tab', parameters: { url: 'https://stackoverflow.com' } },
      { type: 'new_tab', parameters: { url: 'https://mdn.mozilla.org' } },
    ],
    enabled: true,
    usageCount: 0,
    lastUsed: null,
    category: 'productivity'
  },
  {
    id: '4',
    name: 'News Briefing',
    description: 'Open news sources for quick updates',
    trigger: 'news briefing',
    actions: [
      { type: 'new_tab', parameters: { url: 'https://news.google.com' } },
      { type: 'new_tab', parameters: { url: 'https://reddit.com/r/worldnews' } },
    ],
    enabled: true,
    usageCount: 0,
    lastUsed: null,
    category: 'content'
  }
];

export const SmartShortcuts: React.FC<SmartShortcutsProps> = ({ className = '' }) => {
  const [shortcuts, setShortcuts] = useState<SmartShortcut[]>(DEFAULT_SHORTCUTS);
  const [showPanel, setShowPanel] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<SmartShortcut[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { tabs, activeTab } = useBrowserStore();

  // AI-powered command matching
  const findMatchingShortcuts = (command: string): SmartShortcut[] => {
    if (!command.trim()) return [];
    
    const normalizedCommand = command.toLowerCase().trim();
    
    return shortcuts
      .filter(shortcut => shortcut.enabled)
      .map(shortcut => {
        const trigger = shortcut.trigger.toLowerCase();
        const name = shortcut.name.toLowerCase();
        
        // Calculate match score
        let score = 0;
        
        // Exact trigger match
        if (trigger === normalizedCommand) score += 100;
        // Partial trigger match
        else if (trigger.includes(normalizedCommand) || normalizedCommand.includes(trigger)) score += 50;
        // Name match
        else if (name.includes(normalizedCommand)) score += 30;
        // Keyword matching
        else {
          const commandWords = normalizedCommand.split(' ');
          const triggerWords = trigger.split(' ');
          const commonWords = commandWords.filter(word => triggerWords.includes(word));
          score += commonWords.length * 10;
        }
        
        return { ...shortcut, score };
      })
      .filter(shortcut => shortcut.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  };

  // Execute shortcut actions
  const executeShortcut = async (shortcut: SmartShortcut) => {
    console.log(`Executing shortcut: ${shortcut.name}`);
    
    // Update usage statistics
    setShortcuts(prev => prev.map(s => 
      s.id === shortcut.id 
        ? { 
            ...s, 
            usageCount: s.usageCount + 1, 
            lastUsed: Date.now() 
          }
        : s
    ));

    // Execute actions
    for (const action of shortcut.actions) {
      try {
        await executeAction(action);
      } catch (error) {
        console.error(`Failed to execute action:`, error);
      }
    }

    // Clear input and hide suggestions
    setCommandInput('');
    setSuggestions([]);
  };

  const executeAction = async (action: ShortcutAction) => {
    switch (action.type) {
      case 'open_url':
        // In a real implementation, this would open the URL
        console.log(`Opening URL: ${action.parameters.url}`);
        break;
        
      case 'new_tab':
        // In a real implementation, this would create a new tab
        console.log(`Creating new tab with URL: ${action.parameters.url}`);
        break;
        
      case 'switch_tab':
        // In a real implementation, this would switch to a specific tab
        console.log(`Switching to tab`);
        break;
        
      case 'close_tab':
        // In a real implementation, this would close the current tab
        console.log(`Closing tab`);
        break;
        
      case 'vpn_toggle':
        // In a real implementation, this would toggle VPN
        console.log(`Toggling VPN: ${action.parameters.enabled}`);
        break;
        
      case 'translate':
        // In a real implementation, this would trigger translation
        console.log(`Translating page`);
        break;
        
      case 'screenshot':
        // In a real implementation, this would take a screenshot
        console.log(`Taking screenshot`);
        break;
        
      case 'bookmark':
        // In a real implementation, this would bookmark the current page
        console.log(`Bookmarking page`);
        break;
        
      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  };

  // Handle command input changes
  useEffect(() => {
    if (commandInput.trim()) {
      const matches = findMatchingShortcuts(commandInput);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  }, [commandInput]);

  // Keyboard shortcut for command input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K: Focus command input
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setShowPanel(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      
      // Escape: Close command panel
      if (event.key === 'Escape' && showPanel) {
        setShowPanel(false);
        setCommandInput('');
        setSuggestions([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showPanel]);

  const toggleShortcut = (shortcutId: string) => {
    setShortcuts(prev => prev.map(s => 
      s.id === shortcutId ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const deleteShortcut = (shortcutId: string) => {
    setShortcuts(prev => prev.filter(s => s.id !== shortcutId));
  };

  const createNewShortcut = () => {
    const newShortcut: SmartShortcut = {
      id: Date.now().toString(),
      name: 'New Shortcut',
      description: 'Describe what this shortcut does',
      trigger: 'trigger phrase',
      actions: [],
      enabled: true,
      usageCount: 0,
      lastUsed: null,
      category: 'custom'
    };
    
    setShortcuts(prev => [...prev, newShortcut]);
  };

  const getMostUsedShortcuts = () => {
    return shortcuts
      .filter(s => s.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 3);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      productivity: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      privacy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      navigation: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      content: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      custom: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[category as keyof typeof colors] || colors.custom;
  };

  return (
    <div className={`smart-shortcuts ${className}`}>
      {/* Command Launcher */}
      <DropdownMenu open={showPanel} onOpenChange={setShowPanel}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="command-launcher"
            title="Smart Shortcuts (Ctrl+K)"
          >
            <Brain className="w-4 h-4" />
            <Badge variant="secondary" className="ml-1 text-xs">
              AI
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-96 p-0">
          {/* Command Input */}
          <div className="p-3 border-b">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Type a command or ask a question..."
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                className="flex-1"
              />
              <Button variant="ghost" size="sm">
                <Zap className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="mt-2 space-y-1">
                {suggestions.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer"
                    onClick={() => executeShortcut(shortcut)}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{shortcut.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {shortcut.description}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Match: {shortcut.score}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="p-3 border-b">
            <div className="text-sm font-medium mb-2">Quick Actions</div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="text-xs">
                <Plus className="w-3 h-3 mr-1" />
                New Tab
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <Settings className="w-3 h-3 mr-1" />
                Settings
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                History
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                Statistics
              </Button>
            </div>
          </div>
          
          {/* Most Used Shortcuts */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Most Used</div>
              <Button variant="ghost" size="sm" onClick={createNewShortcut}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {getMostUsedShortcuts().map((shortcut) => (
                <div key={shortcut.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{shortcut.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Used {shortcut.usageCount} times
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getCategoryColor(shortcut.category)}`}
                    >
                      {shortcut.category}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleShortcut(shortcut.id)}
                    >
                      {shortcut.enabled ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
              
              {getMostUsedShortcuts().length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No shortcuts used yet. Try typing a command above!
                </div>
              )}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
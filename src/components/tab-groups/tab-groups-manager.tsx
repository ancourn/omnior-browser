'use client';

import React, { useState, useRef } from 'react';
import { useTabGroups } from '@/hooks/use-tab-groups';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  FolderOpen, 
  FolderClosed, 
  Trash2, 
  Settings, 
  Save,
  RotateCcw,
  GripVertical,
  MoreVertical,
  X,
  Globe,
  Star,
  Pin,
  PinOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface TabGroupsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  windowId?: string;
}

const GROUP_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4'
];

export function TabGroupsManager({ isOpen, onClose, windowId = 'default' }: TabGroupsManagerProps) {
  const {
    tabs,
    groups,
    sessions,
    isLoading,
    createTab,
    updateTab,
    deleteTab,
    createGroup,
    updateGroup,
    deleteGroup,
    addTabToGroup,
    removeTabFromGroup,
    toggleGroupCollapse,
    reorderGroups,
    getUngroupedTabs,
    getGroupTabs,
    createSession,
    deleteSession,
    restoreSession
  } = useTabGroups(windowId);

  const [newGroupName, setNewGroupName] = useState('');
  const [newSessionName, setNewSessionName] = useState('');
  const [selectedColor, setSelectedColor] = useState(GROUP_COLORS[0]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const [draggedGroup, setDraggedGroup] = useState<string | null>(null);
  
  const { toast } = useToast();

  const handleCreateGroup = () => {
    if (newGroupName.trim() === '') return;

    const group = createGroup(newGroupName.trim(), selectedColor);
    if (group) {
      setNewGroupName('');
      setIsCreatingGroup(false);
      toast({
        title: "Group created",
        description: "New tab group has been created successfully."
      });
    }
  };

  const handleCreateSession = () => {
    if (newSessionName.trim() === '') return;

    const session = createSession(newSessionName.trim());
    if (session) {
      setNewSessionName('');
      setIsCreatingSession(false);
      toast({
        title: "Session saved",
        description: "Current tab layout has been saved as a session."
      });
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group && deleteGroup(groupId)) {
      toast({
        title: "Group deleted",
        description: `"${group.name}" group has been deleted.`
      });
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session && deleteSession(sessionId)) {
      toast({
        title: "Session deleted",
        description: `"${session.name}" session has been deleted.`
      });
    }
  };

  const handleRestoreSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session && restoreSession(sessionId)) {
      toast({
        title: "Session restored",
        description: `"${session.name}" session has been restored.`
      });
    }
  };

  const handleTabDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTab(tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTabDragOver = (e: React.DragEvent, groupId?: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleTabDrop = (e: React.DragEvent, groupId?: string) => {
    e.preventDefault();
    if (!draggedTab) return;

    if (groupId) {
      addTabToGroup(draggedTab, groupId);
    } else {
      removeTabFromGroup(draggedTab);
    }

    setDraggedTab(null);
  };

  const handleGroupDragStart = (e: React.DragEvent, groupId: string) => {
    setDraggedGroup(groupId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleGroupDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleGroupDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    if (!draggedGroup || draggedGroup === targetGroupId) return;

    const draggedIndex = groups.findIndex(g => g.id === draggedGroup);
    const targetIndex = groups.findIndex(g => g.id === targetGroupId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOrder = groups.map(g => g.id);
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedGroup);

    reorderGroups(newOrder);
    setDraggedGroup(null);
  };

  const handleCreateSampleTab = () => {
    const sampleTabs = [
      { title: 'Google', url: 'https://google.com', favicon: '🔍' },
      { title: 'GitHub', url: 'https://github.com', favicon: '🐙' },
      { title: 'Stack Overflow', url: 'https://stackoverflow.com', favicon: '💬' },
      { title: 'MDN Web Docs', url: 'https://developer.mozilla.org', favicon: '📚' },
      { title: 'YouTube', url: 'https://youtube.com', favicon: '📺' }
    ];

    const randomTab = sampleTabs[Math.floor(Math.random() * sampleTabs.length)];
    createTab({
      title: randomTab.title,
      url: randomTab.url,
      favicon: randomTab.favicon,
      isActive: false,
      isPinned: false,
      windowId
    });
  };

  const ungroupedTabs = getUngroupedTabs();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative ml-auto h-full w-full max-w-4xl bg-background border-l shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Tab Groups Manager</h2>
            <Badge variant="secondary" className="text-xs">
              {groups.length} groups, {tabs.length} tabs
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Dialog open={isCreatingSession} onOpenChange={setIsCreatingSession}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Session
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Current Session</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Session name..."
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateSession();
                    }}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreatingSession(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateSession}>
                      Save Session
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex h-[calc(100%-60px)]">
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dialog open={isCreatingGroup} onOpenChange={setIsCreatingGroup}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Group</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Group name..."
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateGroup();
                        }}
                      />
                      <div>
                        <label className="text-sm font-medium mb-2 block">Group Color</label>
                        <div className="flex gap-2 flex-wrap">
                          {GROUP_COLORS.map(color => (
                            <button
                              key={color}
                              className={`w-8 h-8 rounded-full border-2 ${
                                selectedColor === color ? 'border-primary' : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => setSelectedColor(color)}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsCreatingGroup(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateGroup}>
                          Create Group
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" size="sm" onClick={handleCreateSampleTab}>
                  <Globe className="h-4 w-4 mr-2" />
                  Add Sample Tab
                </Button>
              </div>

              <Badge variant="outline" className="text-xs">
                Drag & drop to organize
              </Badge>
            </div>

            {/* Groups and Tabs */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {isLoading ? (
                  <div className="text-center text-muted-foreground py-8">
                    Loading tab groups...
                  </div>
                ) : groups.length === 0 && ungroupedTabs.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tabs or groups yet</p>
                    <p className="text-sm">Create a group or add some tabs to get started</p>
                  </div>
                ) : (
                  <>
                    {/* Groups */}
                    {groups.map((group, index) => (
                      <div
                        key={group.id}
                        className="border rounded-lg overflow-hidden"
                        draggable
                        onDragStart={(e) => handleGroupDragStart(e, group.id)}
                        onDragOver={handleGroupDragOver}
                        onDrop={(e) => handleGroupDrop(e, group.id)}
                      >
                        {/* Group Header */}
                        <div 
                          className="flex items-center justify-between p-3 cursor-move"
                          style={{ backgroundColor: `${group.color}20` }}
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <button
                              onClick={() => toggleGroupCollapse(group.id)}
                              className="flex items-center gap-2"
                            >
                              {group.collapsed ? (
                                <FolderClosed className="h-4 w-4" />
                              ) : (
                                <FolderOpen className="h-4 w-4" />
                              )}
                              <span className="font-medium">{group.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {getGroupTabs(group.id).length} tabs
                              </Badge>
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteGroup(group.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Group
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Group Tabs */}
                        {!group.collapsed && (
                          <div
                            className="min-h-[60px] p-2 space-y-1"
                            onDragOver={handleTabDragOver}
                            onDrop={(e) => handleTabDrop(e, group.id)}
                          >
                            {getGroupTabs(group.id).length === 0 ? (
                              <div className="text-center text-muted-foreground text-sm py-4">
                                Drag tabs here or click "Add Sample Tab"
                              </div>
                            ) : (
                              getGroupTabs(group.id).map(tab => (
                                <div
                                  key={tab.id}
                                  draggable
                                  onDragStart={(e) => handleTabDragStart(e, tab.id)}
                                  onDragOver={handleTabDragOver}
                                  className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 cursor-move"
                                >
                                  <GripVertical className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">{tab.favicon || '📄'}</span>
                                  <span className="flex-1 text-sm truncate">{tab.title}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => removeTabFromGroup(tab.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Ungrouped Tabs */}
                    {ungroupedTabs.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-3 bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span className="font-medium">Ungrouped Tabs</span>
                            <Badge variant="secondary" className="text-xs">
                              {ungroupedTabs.length} tabs
                            </Badge>
                          </div>
                        </div>
                        <div
                          className="min-h-[60px] p-2 space-y-1"
                          onDragOver={handleTabDragOver}
                          onDrop={(e) => handleTabDrop(e)}
                        >
                          {ungroupedTabs.map(tab => (
                            <div
                              key={tab.id}
                              draggable
                              onDragStart={(e) => handleTabDragStart(e, tab.id)}
                              onDragOver={handleTabDragOver}
                              className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 cursor-move"
                            >
                              <GripVertical className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{tab.favicon || '📄'}</span>
                              <span className="flex-1 text-sm truncate">{tab.title}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => deleteTab(tab.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Sessions Sidebar */}
          <div className="w-80 border-l flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold mb-2">Saved Sessions</h3>
              <p className="text-sm text-muted-foreground">
                Save and restore tab layouts
              </p>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {sessions.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Save className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No saved sessions</p>
                  </div>
                ) : (
                  sessions.map(session => (
                    <div key={session.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{session.name}</h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => handleRestoreSession(session.id)}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restore
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteSession(session.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {session.description && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {session.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {session.groups.length} groups
                        </Badge>
                        <span>•</span>
                        <span>
                          {session.groups.reduce((total, group) => total + group.tabs.length, 0)} tabs
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <span>Saved: {session.createdAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
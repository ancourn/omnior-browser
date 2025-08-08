'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Tab, TabGroup, Session, TabGroupsService } from '@/lib/tab-groups/tab-groups-service';

export function useTabGroups(windowId: string = 'default') {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [groups, setGroups] = useState<TabGroup[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  const tabGroupsServiceRef = useRef<TabGroupsService | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize tab groups service
  useEffect(() => {
    if (typeof window !== 'undefined') {
      tabGroupsServiceRef.current = new TabGroupsService();
      loadData();
      
      const settings = tabGroupsServiceRef.current.getSettings();
      setAutoSaveEnabled(settings.autoSave);
    }
  }, [windowId]);

  // Load data from storage
  const loadData = useCallback(() => {
    if (!tabGroupsServiceRef.current) return;
    
    setIsLoading(true);
    try {
      const loadedTabs = tabGroupsServiceRef.current.getTabs(windowId);
      const loadedGroups = tabGroupsServiceRef.current.getGroups(windowId);
      const loadedSessions = tabGroupsServiceRef.current.getSessions();

      setTabs(loadedTabs);
      setGroups(loadedGroups);
      setSessions(loadedSessions);
    } catch (error) {
      console.error('Error loading tab groups data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [windowId]);

  // Create a new tab
  const createTab = useCallback((tabData: Omit<Tab, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!tabGroupsServiceRef.current) return null;

    try {
      const newTab = tabGroupsServiceRef.current.createTab({
        ...tabData,
        windowId
      });

      setTabs(prev => [...prev, newTab]);
      return newTab;
    } catch (error) {
      console.error('Error creating tab:', error);
      return null;
    }
  }, [windowId]);

  // Update a tab
  const updateTab = useCallback((id: string, updates: Partial<Omit<Tab, 'id' | 'createdAt'>>) => {
    if (!tabGroupsServiceRef.current) return false;

    try {
      const updatedTab = tabGroupsServiceRef.current.updateTab(id, updates);
      if (!updatedTab) return false;

      setTabs(prev => prev.map(tab => 
        tab.id === id ? updatedTab : tab
      ));

      return true;
    } catch (error) {
      console.error('Error updating tab:', error);
      return false;
    }
  }, []);

  // Delete a tab
  const deleteTab = useCallback((id: string) => {
    if (!tabGroupsServiceRef.current) return false;

    try {
      const success = tabGroupsServiceRef.current.deleteTab(id);
      if (!success) return false;

      setTabs(prev => prev.filter(tab => tab.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting tab:', error);
      return false;
    }
  }, []);

  // Create a new group
  const createGroup = useCallback((name: string, color: string) => {
    if (!tabGroupsServiceRef.current) return null;

    try {
      const newGroup = tabGroupsServiceRef.current.createGroup(name, color, windowId);
      setGroups(prev => [...prev, newGroup]);
      return newGroup;
    } catch (error) {
      console.error('Error creating group:', error);
      return null;
    }
  }, [windowId]);

  // Update a group
  const updateGroup = useCallback((id: string, updates: Partial<Omit<TabGroup, 'id' | 'createdAt' | 'tabs'>>) => {
    if (!tabGroupsServiceRef.current) return false;

    try {
      const updatedGroup = tabGroupsServiceRef.current.updateGroup(id, updates);
      if (!updatedGroup) return false;

      setGroups(prev => prev.map(group => 
        group.id === id ? updatedGroup : group
      ));

      return true;
    } catch (error) {
      console.error('Error updating group:', error);
      return false;
    }
  }, []);

  // Delete a group
  const deleteGroup = useCallback((id: string) => {
    if (!tabGroupsServiceRef.current) return false;

    try {
      const success = tabGroupsServiceRef.current.deleteGroup(id);
      if (!success) return false;

      setGroups(prev => prev.filter(group => group.id !== id));
      
      // Update tabs that were in this group
      setTabs(prev => prev.map(tab => 
        tab.groupId === id ? { ...tab, groupId: undefined } : tab
      ));

      return true;
    } catch (error) {
      console.error('Error deleting group:', error);
      return false;
    }
  }, []);

  // Add tab to group
  const addTabToGroup = useCallback((tabId: string, groupId: string) => {
    if (!tabGroupsServiceRef.current) return false;

    try {
      const success = tabGroupsServiceRef.current.addTabToGroup(tabId, groupId);
      if (!success) return false;

      setTabs(prev => prev.map(tab => 
        tab.id === tabId ? { ...tab, groupId } : tab
      ));

      return true;
    } catch (error) {
      console.error('Error adding tab to group:', error);
      return false;
    }
  }, []);

  // Remove tab from group
  const removeTabFromGroup = useCallback((tabId: string) => {
    if (!tabGroupsServiceRef.current) return false;

    try {
      const success = tabGroupsServiceRef.current.removeTabFromGroup(tabId);
      if (!success) return false;

      setTabs(prev => prev.map(tab => 
        tab.id === tabId ? { ...tab, groupId: undefined } : tab
      ));

      return true;
    } catch (error) {
      console.error('Error removing tab from group:', error);
      return false;
    }
  }, []);

  // Toggle group collapse
  const toggleGroupCollapse = useCallback((id: string) => {
    if (!tabGroupsServiceRef.current) return false;

    try {
      const updatedGroup = tabGroupsServiceRef.current.toggleGroupCollapse(id);
      if (!updatedGroup) return false;

      setGroups(prev => prev.map(group => 
        group.id === id ? updatedGroup : group
      ));

      return true;
    } catch (error) {
      console.error('Error toggling group collapse:', error);
      return false;
    }
  }, []);

  // Reorder groups
  const reorderGroups = useCallback((groupIds: string[]) => {
    if (!tabGroupsServiceRef.current) return;

    try {
      tabGroupsServiceRef.current.reorderGroups(groupIds);
      
      setGroups(prev => {
        const reordered = [...prev];
        reordered.sort((a, b) => {
          const aIndex = groupIds.indexOf(a.id);
          const bIndex = groupIds.indexOf(b.id);
          return aIndex - bIndex;
        });
        return reordered;
      });
    } catch (error) {
      console.error('Error reordering groups:', error);
    }
  }, []);

  // Get ungrouped tabs
  const getUngroupedTabs = useCallback(() => {
    return tabs.filter(tab => !tab.groupId);
  }, [tabs]);

  // Get tabs for a specific group
  const getGroupTabs = useCallback((groupId: string) => {
    return tabs.filter(tab => tab.groupId === groupId);
  }, [tabs]);

  // Create session
  const createSession = useCallback((name: string, description?: string) => {
    if (!tabGroupsServiceRef.current) return null;

    try {
      const newSession = tabGroupsServiceRef.current.createSession(name, description, windowId);
      setSessions(prev => [newSession, ...prev]);
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  }, [windowId]);

  // Update session
  const updateSession = useCallback((id: string, updates: Partial<Omit<Session, 'id' | 'createdAt' | 'groups'>>) => {
    if (!tabGroupsServiceRef.current) return false;

    try {
      const updatedSession = tabGroupsServiceRef.current.updateSession(id, updates);
      if (!updatedSession) return false;

      setSessions(prev => prev.map(session => 
        session.id === id ? updatedSession : session
      ));

      return true;
    } catch (error) {
      console.error('Error updating session:', error);
      return false;
    }
  }, []);

  // Delete session
  const deleteSession = useCallback((id: string) => {
    if (!tabGroupsServiceRef.current) return false;

    try {
      const success = tabGroupsServiceRef.current.deleteSession(id);
      if (!success) return false;

      setSessions(prev => prev.filter(session => session.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }, []);

  // Restore session
  const restoreSession = useCallback((id: string) => {
    if (!tabGroupsServiceRef.current) return false;

    try {
      const success = tabGroupsServiceRef.current.restoreSession(id);
      if (success) {
        loadData(); // Reload all data
      }
      return success;
    } catch (error) {
      console.error('Error restoring session:', error);
      return false;
    }
  }, [loadData]);

  // Get settings
  const getSettings = useCallback(() => {
    if (!tabGroupsServiceRef.current) return null;
    return tabGroupsServiceRef.current.getSettings();
  }, []);

  // Update settings
  const updateSettings = useCallback((settings: any) => {
    if (!tabGroupsServiceRef.current) return false;

    try {
      tabGroupsServiceRef.current.updateSettings(settings);
      setAutoSaveEnabled(settings.autoSave ?? autoSaveEnabled);
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  }, [autoSaveEnabled]);

  // Auto-save functionality
  const startAutoSave = useCallback(() => {
    if (!tabGroupsServiceRef.current || !autoSaveEnabled) return;

    const settings = tabGroupsServiceRef.current.getSettings();
    if (!settings.autoSave) return;

    autoSaveTimerRef.current = setInterval(() => {
      // Auto-save is handled by the service, we just ensure it's running
      console.log('Auto-saving tab groups...');
    }, settings.autoSaveInterval * 1000);
  }, [autoSaveEnabled]);

  const stopAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  // Start auto-save when enabled
  useEffect(() => {
    if (autoSaveEnabled) {
      startAutoSave();
    } else {
      stopAutoSave();
    }

    return () => stopAutoSave();
  }, [autoSaveEnabled, startAutoSave, stopAutoSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoSave();
      if (tabGroupsServiceRef.current) {
        tabGroupsServiceRef.current.cleanup();
      }
    };
  }, [stopAutoSave]);

  return {
    tabs,
    groups,
    sessions,
    isLoading,
    autoSaveEnabled,
    setAutoSaveEnabled,
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
    updateSession,
    deleteSession,
    restoreSession,
    getSettings,
    updateSettings,
    loadData
  };
}
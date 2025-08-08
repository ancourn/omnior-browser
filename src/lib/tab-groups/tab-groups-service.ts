export interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isActive: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  groupId?: string;
  windowId: string;
}

export interface TabGroup {
  id: string;
  name: string;
  color: string;
  collapsed: boolean;
  tabs: Tab[];
  createdAt: Date;
  updatedAt: Date;
  windowId: string;
  order: number;
}

export interface Session {
  id: string;
  name: string;
  description?: string;
  groups: TabGroup[];
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
}

export interface TabGroupsStorage {
  tabs: Tab[];
  groups: TabGroup[];
  sessions: Session[];
  settings: {
    autoSave: boolean;
    autoSaveInterval: number;
    maxTabsPerGroup: number;
    maxGroups: number;
    defaultGroupColor: string;
    collapseOthersOnExpand: boolean;
    saveWindowSessions: boolean;
  };
}

export class TabGroupsService {
  private static STORAGE_KEY = 'omnior-tab-groups';
  private static SETTINGS_KEY = 'omnior-tab-groups-settings';
  private autoSaveTimer: NodeJS.Timeout | null = null;

  private getDefaultSettings(): TabGroupsStorage['settings'] {
    return {
      autoSave: true,
      autoSaveInterval: 30,
      maxTabsPerGroup: 50,
      maxGroups: 20,
      defaultGroupColor: '#6366f1',
      collapseOthersOnExpand: true,
      saveWindowSessions: true
    };
  }

  private getStorage(): TabGroupsStorage {
    if (typeof window === 'undefined') {
      return { 
        tabs: [], 
        groups: [], 
        sessions: [],
        settings: this.getDefaultSettings() 
      };
    }

    try {
      const tabsData = localStorage.getItem(this.STORAGE_KEY);
      const sessionsData = localStorage.getItem(`${this.STORAGE_KEY}-sessions`);
      const settingsData = localStorage.getItem(this.SETTINGS_KEY);

      const tabs = tabsData ? JSON.parse(tabsData) : [];
      const sessions = sessionsData ? JSON.parse(sessionsData) : [];
      const settings = settingsData ? JSON.parse(settingsData) : this.getDefaultSettings();

      // Convert date strings back to Date objects
      const parsedTabs = tabs.map((tab: any) => ({
        ...tab,
        createdAt: new Date(tab.createdAt),
        updatedAt: new Date(tab.updatedAt)
      }));

      const parsedGroups = this.reconstructGroups(parsedTabs);
      const parsedSessions = sessions.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        groups: session.groups.map((group: any) => ({
          ...group,
          createdAt: new Date(group.createdAt),
          updatedAt: new Date(group.updatedAt),
          tabs: group.tabs.map((tab: any) => ({
            ...tab,
            createdAt: new Date(tab.createdAt),
            updatedAt: new Date(tab.updatedAt)
          }))
        }))
      }));

      return { 
        tabs: parsedTabs, 
        groups: parsedGroups, 
        sessions: parsedSessions,
        settings 
      };
    } catch (error) {
      console.error('Error loading tab groups from storage:', error);
      return { 
        tabs: [], 
        groups: [], 
        sessions: [],
        settings: this.getDefaultSettings() 
      };
    }
  }

  private saveStorage(storage: TabGroupsStorage): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storage.tabs));
      localStorage.setItem(`${this.STORAGE_KEY}-sessions`, JSON.stringify(storage.sessions));
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(storage.settings));
    } catch (error) {
      console.error('Error saving tab groups to storage:', error);
    }
  }

  private reconstructGroups(tabs: Tab[]): TabGroup[] {
    const groupMap = new Map<string, TabGroup>();
    
    // Group tabs by groupId
    tabs.forEach(tab => {
      if (tab.groupId) {
        if (!groupMap.has(tab.groupId)) {
          groupMap.set(tab.groupId, {
            id: tab.groupId,
            name: `Group ${groupMap.size + 1}`,
            color: '#6366f1',
            collapsed: false,
            tabs: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            windowId: tab.windowId,
            order: groupMap.size
          });
        }
        groupMap.get(tab.groupId)!.tabs.push(tab);
      }
    });

    return Array.from(groupMap.values()).sort((a, b) => a.order - b.order);
  }

  getTabs(windowId?: string): Tab[] {
    const storage = this.getStorage();
    return windowId 
      ? storage.tabs.filter(tab => tab.windowId === windowId)
      : storage.tabs;
  }

  getTab(id: string): Tab | null {
    const storage = this.getStorage();
    return storage.tabs.find(tab => tab.id === id) || null;
  }

  createTab(tab: Omit<Tab, 'id' | 'createdAt' | 'updatedAt'>): Tab {
    const storage = this.getStorage();
    const newTab: Tab = {
      ...tab,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    storage.tabs.push(newTab);
    this.saveStorage(storage);

    return newTab;
  }

  updateTab(id: string, updates: Partial<Omit<Tab, 'id' | 'createdAt'>>): Tab | null {
    const storage = this.getStorage();
    const tabIndex = storage.tabs.findIndex(tab => tab.id === id);
    
    if (tabIndex === -1) return null;

    storage.tabs[tabIndex] = {
      ...storage.tabs[tabIndex],
      ...updates,
      updatedAt: new Date()
    };

    this.saveStorage(storage);
    return storage.tabs[tabIndex];
  }

  deleteTab(id: string): boolean {
    const storage = this.getStorage();
    const initialLength = storage.tabs.length;
    storage.tabs = storage.tabs.filter(tab => tab.id !== id);
    
    if (storage.tabs.length < initialLength) {
      this.saveStorage(storage);
      return true;
    }
    
    return false;
  }

  getGroups(windowId?: string): TabGroup[] {
    const storage = this.getStorage();
    return windowId 
      ? storage.groups.filter(group => group.windowId === windowId)
      : storage.groups;
  }

  getGroup(id: string): TabGroup | null {
    const storage = this.getStorage();
    return storage.groups.find(group => group.id === id) || null;
  }

  createGroup(name: string, color: string, windowId: string): TabGroup {
    const storage = this.getStorage();
    const newGroup: TabGroup = {
      id: this.generateId(),
      name,
      color,
      collapsed: false,
      tabs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      windowId,
      order: storage.groups.length
    };

    storage.groups.push(newGroup);
    this.saveStorage(storage);

    return newGroup;
  }

  updateGroup(id: string, updates: Partial<Omit<TabGroup, 'id' | 'createdAt' | 'tabs'>>): TabGroup | null {
    const storage = this.getStorage();
    const groupIndex = storage.groups.findIndex(group => group.id === id);
    
    if (groupIndex === -1) return null;

    storage.groups[groupIndex] = {
      ...storage.groups[groupIndex],
      ...updates,
      updatedAt: new Date()
    };

    this.saveStorage(storage);
    return storage.groups[groupIndex];
  }

  deleteGroup(id: string): boolean {
    const storage = this.getStorage();
    const group = storage.groups.find(g => g.id === id);
    
    if (!group) return false;

    // Remove group association from tabs
    storage.tabs.forEach(tab => {
      if (tab.groupId === id) {
        tab.groupId = undefined;
      }
    });

    // Remove group
    storage.groups = storage.groups.filter(g => g.id !== id);
    
    // Reorder remaining groups
    storage.groups.forEach((g, index) => {
      g.order = index;
    });

    this.saveStorage(storage);
    return true;
  }

  addTabToGroup(tabId: string, groupId: string): boolean {
    const storage = this.getStorage();
    const tab = storage.tabs.find(t => t.id === tabId);
    const group = storage.groups.find(g => g.id === groupId);
    
    if (!tab || !group) return false;

    // Check if group has space
    if (group.tabs.length >= storage.settings.maxTabsPerGroup) {
      return false;
    }

    tab.groupId = groupId;
    tab.updatedAt = new Date();
    
    this.saveStorage(storage);
    return true;
  }

  removeTabFromGroup(tabId: string): boolean {
    const storage = this.getStorage();
    const tab = storage.tabs.find(t => t.id === tabId);
    
    if (!tab || !tab.groupId) return false;

    tab.groupId = undefined;
    tab.updatedAt = new Date();
    
    this.saveStorage(storage);
    return true;
  }

  toggleGroupCollapse(id: string): TabGroup | null {
    const group = this.getGroup(id);
    if (!group) return null;
    
    const settings = this.getSettings();
    let updates: Partial<TabGroup> = { collapsed: !group.collapsed };

    // If expanding and collapseOthersOnExpand is enabled, collapse other groups
    if (!group.collapsed && settings.collapseOthersOnExpand) {
      const storage = this.getStorage();
      storage.groups.forEach(g => {
        if (g.id !== id && g.windowId === group.windowId) {
          g.collapsed = true;
        }
      });
      this.saveStorage(storage);
    }

    return this.updateGroup(id, updates);
  }

  reorderGroups(groupIds: string[]): void {
    const storage = this.getStorage();
    
    groupIds.forEach((groupId, index) => {
      const group = storage.groups.find(g => g.id === groupId);
      if (group) {
        group.order = index;
      }
    });

    this.saveStorage(storage);
  }

  getSessions(): Session[] {
    const storage = this.getStorage();
    return storage.sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  getSession(id: string): Session | null {
    const storage = this.getStorage();
    return storage.sessions.find(session => session.id === id) || null;
  }

  createSession(name: string, description?: string, windowId?: string): Session {
    const storage = this.getStorage();
    const groups = windowId ? this.getGroups(windowId) : this.getGroups();
    
    const newSession: Session = {
      id: this.generateId(),
      name,
      description,
      groups: groups.map(group => ({
        ...group,
        tabs: storage.tabs.filter(tab => tab.groupId === group.id)
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      isPinned: false
    };

    storage.sessions.push(newSession);
    this.saveStorage(storage);

    return newSession;
  }

  updateSession(id: string, updates: Partial<Omit<Session, 'id' | 'createdAt' | 'groups'>>): Session | null {
    const storage = this.getStorage();
    const sessionIndex = storage.sessions.findIndex(session => session.id === id);
    
    if (sessionIndex === -1) return null;

    storage.sessions[sessionIndex] = {
      ...storage.sessions[sessionIndex],
      ...updates,
      updatedAt: new Date()
    };

    this.saveStorage(storage);
    return storage.sessions[sessionIndex];
  }

  deleteSession(id: string): boolean {
    const storage = this.getStorage();
    const initialLength = storage.sessions.length;
    storage.sessions = storage.sessions.filter(session => session.id !== id);
    
    if (storage.sessions.length < initialLength) {
      this.saveStorage(storage);
      return true;
    }
    
    return false;
  }

  restoreSession(id: string): boolean {
    const storage = this.getStorage();
    const session = storage.sessions.find(s => s.id === id);
    
    if (!session) return false;

    // Clear existing groups and tabs for the session's window
    const windowId = session.groups[0]?.windowId || 'default';
    storage.groups = storage.groups.filter(g => g.windowId !== windowId);
    storage.tabs = storage.tabs.filter(t => t.windowId !== windowId);

    // Restore session groups and tabs
    session.groups.forEach(sessionGroup => {
      const newGroup = this.createGroup(sessionGroup.name, sessionGroup.color, windowId);
      
      sessionGroup.tabs.forEach(sessionTab => {
        this.createTab({
          ...sessionTab,
          groupId: newGroup.id,
          windowId
        });
      });
    });

    this.saveStorage(storage);
    return true;
  }

  getSettings(): TabGroupsStorage['settings'] {
    const storage = this.getStorage();
    return storage.settings;
  }

  updateSettings(settings: Partial<TabGroupsStorage['settings']>): void {
    const storage = this.getStorage();
    storage.settings = { ...storage.settings, ...settings };
    this.saveStorage(storage);
  }

  startAutoSave(callback: () => void): void {
    const settings = this.getSettings();
    if (!settings.autoSave) return;

    this.stopAutoSave();
    this.autoSaveTimer = setInterval(callback, settings.autoSaveInterval * 1000);
  }

  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  cleanup(): void {
    this.stopAutoSave();
  }
}
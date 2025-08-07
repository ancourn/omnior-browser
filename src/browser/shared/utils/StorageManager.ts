import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { BrowserProfile, BrowserSettings, Bookmark, HistoryItem, WindowState } from '../../types';

export class StorageManager {
  private userDataPath: string;
  private profilesPath: string;
  private historyPath: string;
  private bookmarksPath: string;
  private settingsPath: string;
  private sessionsPath: string;

  constructor() {
    this.userDataPath = app.getPath('userData');
    this.profilesPath = path.join(this.userDataPath, 'profiles.json');
    this.historyPath = path.join(this.userDataPath, 'history.json');
    this.bookmarksPath = path.join(this.userDataPath, 'bookmarks.json');
    this.settingsPath = path.join(this.userDataPath, 'settings.json');
    this.sessionsPath = path.join(this.userDataPath, 'sessions.json');
    
    this.ensureDirectoriesExist();
  }

  private ensureDirectoriesExist() {
    const dirs = [
      path.dirname(this.profilesPath),
      path.dirname(this.historyPath),
      path.dirname(this.bookmarksPath),
      path.dirname(this.settingsPath),
      path.dirname(this.sessionsPath)
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private async readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
    try {
      if (fs.existsSync(filePath)) {
        const data = await fs.promises.readFile(filePath, 'utf-8');
        return JSON.parse(data);
      }
      return defaultValue;
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error);
      return defaultValue;
    }
  }

  private async writeJsonFile<T>(filePath: string, data: T): Promise<void> {
    try {
      await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing ${filePath}:`, error);
      throw error;
    }
  }

  // Profile Management
  async getDefaultProfile(): Promise<BrowserProfile> {
    const profiles = await this.getProfiles();
    let defaultProfile = profiles.find(p => p.isDefault);
    
    if (!defaultProfile) {
      defaultProfile = await this.createDefaultProfile();
      profiles.push(defaultProfile);
      await this.saveProfiles(profiles);
    }
    
    return defaultProfile;
  }

  async getProfiles(): Promise<BrowserProfile[]> {
    return this.readJsonFile(this.profilesPath, []);
  }

  async saveProfiles(profiles: BrowserProfile[]): Promise<void> {
    await this.writeJsonFile(this.profilesPath, profiles);
  }

  private async createDefaultProfile(): Promise<BrowserProfile> {
    return {
      id: 'default',
      name: 'Default Profile',
      isDefault: true,
      settings: await this.getDefaultSettings(),
      bookmarks: await this.getDefaultBookmarks(),
      history: [],
      sessions: []
    };
  }

  // Settings Management
  async getSettings(): Promise<BrowserSettings> {
    return this.readJsonFile(this.settingsPath, await this.getDefaultSettings());
  }

  async saveSettings(settings: BrowserSettings): Promise<void> {
    await this.writeJsonFile(this.settingsPath, settings);
  }

  async updateSettings(updates: Partial<BrowserSettings>): Promise<BrowserSettings> {
    const currentSettings = await this.getSettings();
    const updatedSettings = { ...currentSettings, ...updates };
    await this.saveSettings(updatedSettings);
    return updatedSettings;
  }

  private async getDefaultSettings(): Promise<BrowserSettings> {
    const { DEFAULT_SETTINGS } = await import('../../types');
    return DEFAULT_SETTINGS;
  }

  // Bookmark Management
  async getBookmarks(): Promise<Bookmark[]> {
    return this.readJsonFile(this.bookmarksPath, await this.getDefaultBookmarks());
  }

  async saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
    await this.writeJsonFile(this.bookmarksPath, bookmarks);
  }

  async addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Promise<Bookmark> {
    const bookmarks = await this.getBookmarks();
    const newBookmark: Bookmark = {
      ...bookmark,
      id: this.generateId(),
      createdAt: Date.now()
    };
    
    bookmarks.push(newBookmark);
    await this.saveBookmarks(bookmarks);
    return newBookmark;
  }

  async updateBookmark(id: string, updates: Partial<Bookmark>): Promise<Bookmark | null> {
    const bookmarks = await this.getBookmarks();
    const index = bookmarks.findIndex(b => b.id === id);
    
    if (index === -1) {
      return null;
    }
    
    bookmarks[index] = { ...bookmarks[index], ...updates };
    await this.saveBookmarks(bookmarks);
    return bookmarks[index];
  }

  async removeBookmark(id: string): Promise<boolean> {
    const bookmarks = await this.getBookmarks();
    const index = bookmarks.findIndex(b => b.id === id);
    
    if (index === -1) {
      return false;
    }
    
    bookmarks.splice(index, 1);
    await this.saveBookmarks(bookmarks);
    return true;
  }

  private async getDefaultBookmarks(): Promise<Bookmark[]> {
    return [
      {
        id: 'toolbar',
        title: 'Bookmarks Toolbar',
        folder: true,
        children: [
          {
            id: 'github',
            title: 'GitHub',
            url: 'https://github.com',
            parentId: 'toolbar',
            createdAt: Date.now()
          },
          {
            id: 'omnior',
            title: 'Omnior Browser',
            url: 'https://omnior.browser',
            parentId: 'toolbar',
            createdAt: Date.now()
          }
        ],
        createdAt: Date.now()
      }
    ];
  }

  // History Management
  async getHistory(): Promise<HistoryItem[]> {
    return this.readJsonFile(this.historyPath, []);
  }

  async saveHistory(history: HistoryItem[]): Promise<void> {
    await this.writeJsonFile(this.historyPath, history);
  }

  async addHistoryItem(item: Omit<HistoryItem, 'id' | 'visitTime' | 'visitCount'>): Promise<HistoryItem> {
    const history = await this.getHistory();
    
    // Check if URL already exists in history
    const existingItem = history.find(h => h.url === item.url);
    
    if (existingItem) {
      // Update existing item
      existingItem.title = item.title;
      existingItem.visitTime = Date.now();
      existingItem.visitCount += 1;
      await this.saveHistory(history);
      return existingItem;
    }
    
    // Create new history item
    const newItem: HistoryItem = {
      ...item,
      id: this.generateId(),
      visitTime: Date.now(),
      visitCount: 1
    };
    
    history.unshift(newItem); // Add to beginning
    
    // Limit history size (keep last 10,000 items)
    if (history.length > 10000) {
      history.splice(10000);
    }
    
    await this.saveHistory(history);
    return newItem;
  }

  async searchHistory(query: string): Promise<HistoryItem[]> {
    const history = await this.getHistory();
    const lowercaseQuery = query.toLowerCase();
    
    return history.filter(item => 
      item.title.toLowerCase().includes(lowercaseQuery) ||
      item.url.toLowerCase().includes(lowercaseQuery)
    ).slice(0, 100); // Limit results
  }

  async clearHistory(): Promise<void> {
    await this.saveHistory([]);
  }

  // Session Management
  async getSessions(): Promise<WindowState[]> {
    return this.readJsonFile(this.sessionsPath, []);
  }

  async saveSessions(sessions: WindowState[]): Promise<void> {
    await this.writeJsonFile(this.sessionsPath, sessions);
  }

  async saveWindowState(windowState: WindowState): Promise<void> {
    const sessions = await this.getSessions();
    const existingIndex = sessions.findIndex(s => s.id === windowState.id);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = windowState;
    } else {
      sessions.push(windowState);
    }
    
    // Keep only last 10 sessions
    if (sessions.length > 10) {
      sessions.splice(0, sessions.length - 10);
    }
    
    await this.saveSessions(sessions);
  }

  async removeWindowState(windowId: string): Promise<void> {
    const sessions = await this.getSessions();
    const filteredSessions = sessions.filter(s => s.id !== windowId);
    await this.saveSessions(filteredSessions);
  }

  // Utility Methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async exportData(): Promise<string> {
    const data = {
      profiles: await this.getProfiles(),
      settings: await this.getSettings(),
      bookmarks: await this.getBookmarks(),
      history: await this.getHistory(),
      sessions: await this.getSessions(),
      exportedAt: Date.now()
    };
    
    return JSON.stringify(data, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.profiles) await this.saveProfiles(data.profiles);
      if (data.settings) await this.saveSettings(data.settings);
      if (data.bookmarks) await this.saveBookmarks(data.bookmarks);
      if (data.history) await this.saveHistory(data.history);
      if (data.sessions) await this.saveSessions(data.sessions);
      
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Invalid data format');
    }
  }

  async clearAllData(): Promise<void> {
    await this.saveProfiles([]);
    await this.saveSettings(await this.getDefaultSettings());
    await this.saveBookmarks(await this.getDefaultBookmarks());
    await this.saveHistory([]);
    await this.saveSessions([]);
  }
}
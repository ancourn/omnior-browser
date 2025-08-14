/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

import type { ProfileId, HistoryEntry } from '../common/models';
import { SimpleEventEmitter } from '../common/models';
import { StorageKeys } from '../common/storage-keys';
import { getSecureStorage } from '@/lib/auth/secure-storage';

export interface HistoryService {
  addVisit(entry: Omit<HistoryEntry, 'id'>): void;
  listByDay(dayKey: string): HistoryEntry[];
  search(q: string, range?: { from: number; to: number }): HistoryEntry[];
  clear(range?: { from: number; to: number }): void;
  persist(): Promise<void>;
  restore(range?: { days: number }): Promise<void>;
  on(event: string, callback: (...args: any[]) => void): () => void;
}

export class OmniorHistoryService extends SimpleEventEmitter implements HistoryService {
  private history: Map<string, HistoryEntry[]> = new Map(); // dayKey -> entries
  private profileId: ProfileId;
  private settings: any; // Will be injected from settings service
  private persistTimeout: NodeJS.Timeout | null = null;

  constructor(profileId: ProfileId, settingsService?: any) {
    super();
    this.profileId = profileId;
    if (settingsService) {
      this.settings = settingsService.get();
      // Listen to settings changes
      settingsService.on?.('settings-updated', (newSettings: any) => {
        this.settings = newSettings;
      });
    }
  }

  addVisit(entry: Omit<HistoryEntry, 'id'>): void {
    // Check if history is disabled
    if (this.settings?.privacy?.doNotTrack || this.isGuestMode()) {
      return;
    }

    const dayKey = this.getDayKey(entry.visitTime);
    const historyEntry: HistoryEntry = {
      ...entry,
      id: this.generateId(),
    };

    if (!this.history.has(dayKey)) {
      this.history.set(dayKey, []);
    }

    const dayEntries = this.history.get(dayKey)!;
    
    // Check if this URL was visited recently (within 5 minutes)
    const recentEntry = dayEntries.find(e => 
      e.url === entry.url && 
      Math.abs(e.visitTime - entry.visitTime) < 5 * 60 * 1000
    );

    if (recentEntry) {
      // Update existing entry instead of creating new one
      recentEntry.visitTime = entry.visitTime;
      recentEntry.durationMs = entry.durationMs;
    } else {
      // Add new entry
      dayEntries.unshift(historyEntry);
      
      // Keep only last 1000 entries per day
      if (dayEntries.length > 1000) {
        dayEntries.length = 1000;
      }
    }

    this.schedulePersist();
    this.emit('history-added', historyEntry);
  }

  listByDay(dayKey: string): HistoryEntry[] {
    return this.history.get(dayKey) || [];
  }

  search(q: string, range?: { from: number; to: number }): HistoryEntry[] {
    const query = q.toLowerCase();
    const results: HistoryEntry[] = [];

    const fromDate = range?.from || 0;
    const toDate = range?.to || Date.now();

    for (const [dayKey, entries] of this.history) {
      for (const entry of entries) {
        if (entry.visitTime >= fromDate && entry.visitTime <= toDate) {
          if (
            entry.url.toLowerCase().includes(query) ||
            (entry.title && entry.title.toLowerCase().includes(query))
          ) {
            results.push(entry);
          }
        }
      }
    }

    // Sort by visit time (newest first)
    return results.sort((a, b) => b.visitTime - a.visitTime);
  }

  clear(range?: { from: number; to: number }): void {
    if (!range) {
      // Clear all history
      this.history.clear();
    } else {
      // Clear history within range
      const { from, to } = range;
      
      for (const [dayKey, entries] of this.history) {
        const filteredEntries = entries.filter(entry => 
          entry.visitTime < from || entry.visitTime > to
        );
        
        if (filteredEntries.length === 0) {
          this.history.delete(dayKey);
        } else {
          this.history.set(dayKey, filteredEntries);
        }
      }
    }

    this.schedulePersist();
    this.emit('history-cleared', range);
  }

  async persist(): Promise<void> {
    const storage = getSecureStorage();
    
    // Persist each day's history separately
    for (const [dayKey, entries] of this.history) {
      if (entries.length > 0) {
        await storage.set(StorageKeys.history(this.profileId, dayKey), entries);
      }
    }
  }

  async restore(range?: { days: number }): Promise<void> {
    const storage = getSecureStorage();
    
    try {
      const now = Date.now();
      const daysToRestore = range?.days || 90; // Default to last 90 days
      
      for (let i = 0; i < daysToRestore; i++) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000);
        const dayKey = this.getDayKey(date.getTime());
        
        try {
          const entries = await storage.get(StorageKeys.history(this.profileId, dayKey));
          if (entries && Array.isArray(entries)) {
            this.history.set(dayKey, entries);
          }
        } catch (error) {
          console.warn(`Failed to restore history for ${dayKey}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to restore history:', error);
    }
  }

  getHistoryByDateRange(from: Date, to: Date): { [dayKey: string]: HistoryEntry[] } {
    const result: { [dayKey: string]: HistoryEntry[] } = {};
    
    for (const [dayKey, entries] of this.history) {
      const dayEntries = entries.filter(entry => {
        const entryDate = new Date(entry.visitTime);
        return entryDate >= from && entryDate <= to;
      });
      
      if (dayEntries.length > 0) {
        result[dayKey] = dayEntries;
      }
    }
    
    return result;
  }

  getMostVisited(limit: number = 10): Array<{ url: string; title: string; visitCount: number }> {
    const urlCounts = new Map<string, { title: string; count: number }>();
    
    for (const entries of this.history.values()) {
      for (const entry of entries) {
        const existing = urlCounts.get(entry.url);
        if (existing) {
          existing.count++;
        } else {
          urlCounts.set(entry.url, {
            title: entry.title || entry.url,
            count: 1
          });
        }
      }
    }
    
    return Array.from(urlCounts.entries())
      .map(([url, data]) => ({
        url,
        title: data.title,
        visitCount: data.count
      }))
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, limit);
  }

  private schedulePersist(): void {
    if (this.persistTimeout) {
      clearTimeout(this.persistTimeout);
    }

    this.persistTimeout = setTimeout(() => {
      this.persist();
    }, 300);
  }

  private getDayKey(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  }

  private generateId(): string {
    return `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isGuestMode(): boolean {
    return this.profileId === 'guest';
  }
}
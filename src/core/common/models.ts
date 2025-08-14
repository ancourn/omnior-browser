/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

export type TabId = string;
export type ProfileId = string;

export interface OmniorTab {
  id: TabId;
  title: string;
  url: string;
  favicon?: string;
  pinned?: boolean;
  audible?: boolean;
  groupId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BookmarkFolder {
  id: string;
  name: string;
  parentId?: string;
}

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  tags: string[];
  folderId?: string;
  createdAt: number;
  notes?: string;
}

export interface HistoryEntry {
  id: string;
  url: string;
  title?: string;
  visitTime: number;
  durationMs?: number;
}

export interface DownloadItem {
  id: string;
  url: string;
  fileName: string;
  sizeBytes?: number;
  status: 'queued' | 'downloading' | 'paused' | 'completed' | 'failed' | 'canceled';
  progress: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface Settings {
  homepage: string;
  defaultSearch: string;
  downloadDir: string;
  newTabBehavior: 'home' | 'blank' | 'last-session';
  privacy: {
    doNotTrack: boolean;
    blockThirdPartyCookies: boolean;
  };
  appearance: {
    theme: 'system' | 'light' | 'dark';
    density: 'compact' | 'cozy';
  };
  security: {
    autoLockMinutes: number;
  };
}

export class OmniorError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'OmniorError';
  }
}

export interface EventEmitter {
  on(event: string, callback: (...args: any[]) => void): () => void;
  emit(event: string, ...args: any[]): void;
  off(event: string, callback: (...args: any[]) => void): void;
}

export class SimpleEventEmitter implements EventEmitter {
  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map();

  on(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }

  off(event: string, callback: (...args: any[]) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
}
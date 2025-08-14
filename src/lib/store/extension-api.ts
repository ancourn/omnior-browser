/**
 * Extension API Implementation
 * 
 * Concrete implementations of all extension APIs for the Omnior Store
 */

import { db } from '@/lib/db';
import { ExtensionPermission, Tab, DownloadItem, BookmarkTreeNode, StorageArea } from './omnior-store';

export class ExtensionAPIImpl {
  // Storage API Implementation
  createStorageArea(extensionId: string, area: 'local' | 'sync' | 'managed'): StorageArea {
    return {
      get: async (keys?: any) => {
        try {
          if (keys === undefined) {
            // Get all data
            const result = await db.extensionStorage.findMany({
              where: {
                extensionId,
                area,
              },
            });
            return result.reduce((acc, item) => {
              acc[item.key] = item.value;
              return acc;
            }, {} as Record<string, any>);
          } else if (typeof keys === 'string') {
            // Get single key
            const item = await db.extensionStorage.findFirst({
              where: {
                extensionId,
                area,
                key: keys,
              },
            });
            return item ? { [keys]: item.value } : {};
          } else if (Array.isArray(keys)) {
            // Get multiple keys
            const result = await db.extensionStorage.findMany({
              where: {
                extensionId,
                area,
                key: { in: keys },
              },
            });
            return result.reduce((acc, item) => {
              acc[item.key] = item.value;
              return acc;
            }, {} as Record<string, any>);
          } else {
            // Get specific keys from object
            const result = await db.extensionStorage.findMany({
              where: {
                extensionId,
                area,
                key: { in: Object.keys(keys) },
              },
            });
            return result.reduce((acc, item) => {
              acc[item.key] = item.value;
              return acc;
            }, {} as Record<string, any>);
          }
        } catch (error) {
          console.error('Storage get error:', error);
          return {};
        }
      },

      set: async (items: Record<string, any>) => {
        try {
          const operations = Object.entries(items).map(([key, value]) =>
            db.extensionStorage.upsert({
              where: {
                extensionId_area_key: {
                  extensionId,
                  area,
                  key,
                },
              },
              update: { value },
              create: {
                extensionId,
                area,
                key,
                value,
              },
            })
          );

          await Promise.all(operations);
        } catch (error) {
          console.error('Storage set error:', error);
          throw error;
        }
      },

      remove: async (keys: string | string[]) => {
        try {
          const keyArray = Array.isArray(keys) ? keys : [keys];
          await db.extensionStorage.deleteMany({
            where: {
              extensionId,
              area,
              key: { in: keyArray },
            },
          });
        } catch (error) {
          console.error('Storage remove error:', error);
          throw error;
        }
      },

      clear: async () => {
        try {
          await db.extensionStorage.deleteMany({
            where: {
              extensionId,
              area,
            },
          });
        } catch (error) {
          console.error('Storage clear error:', error);
          throw error;
        }
      },
    };
  }

  // Tabs API Implementation
  createTabsAPI() {
    const eventEmitter = new EventTarget();

    return {
      create: async (createProperties: any): Promise<Tab> => {
        // This would integrate with the actual tab system
        // For now, return a mock tab
        return {
          id: Date.now(),
          index: 0,
          windowId: 1,
          active: true,
          pinned: false,
          highlighted: true,
          discarded: false,
          autoDiscardable: true,
          url: createProperties.url || 'about:blank',
          title: 'New Tab',
          status: 'complete',
        };
      },

      query: async (queryInfo: any): Promise<Tab[]> => {
        // Query tabs based on criteria
        // This would integrate with the actual tab system
        return [];
      },

      get: async (tabId: number): Promise<Tab> => {
        // Get specific tab
        // This would integrate with the actual tab system
        throw new Error('Tab not found');
      },

      update: async (tabId: number, updateProperties: any): Promise<Tab> => {
        // Update tab properties
        // This would integrate with the actual tab system
        throw new Error('Tab not found');
      },

      remove: async (tabId: number): Promise<void> => {
        // Remove tab
        // This would integrate with the actual tab system
        throw new Error('Tab not found');
      },

      onCreated: {
        addListener: (callback: (tab: Tab) => void) => {
          eventEmitter.addEventListener('created', (event: any) => callback(event.detail));
        },
        removeListener: (callback: (tab: Tab) => void) => {
          eventEmitter.removeEventListener('created', callback);
        },
        hasListener: (callback: (tab: Tab) => void) => {
          return eventEmitter.listeners('created').includes(callback);
        },
      },

      onUpdated: {
        addListener: (callback: (tabId: number, changeInfo: any, tab: Tab) => void) => {
          eventEmitter.addEventListener('updated', (event: any) => callback(event.detail.tabId, event.detail.changeInfo, event.detail.tab));
        },
        removeListener: (callback: (tabId: number, changeInfo: any, tab: Tab) => void) => {
          eventEmitter.removeEventListener('updated', callback);
        },
        hasListener: (callback: (tabId: number, changeInfo: any, tab: Tab) => void) => {
          return eventEmitter.listeners('updated').includes(callback);
        },
      },

      onRemoved: {
        addListener: (callback: (tabId: number, removeInfo: any) => void) => {
          eventEmitter.addEventListener('removed', (event: any) => callback(event.detail.tabId, event.detail.removeInfo));
        },
        removeListener: (callback: (tabId: number, removeInfo: any) => void) => {
          eventEmitter.removeEventListener('removed', callback);
        },
        hasListener: (callback: (tabId: number, removeInfo: any) => void) => {
          return eventEmitter.listeners('removed').includes(callback);
        },
      },
    };
  }

  // Downloads API Implementation
  createDownloadsAPI() {
    const eventEmitter = new EventTarget();

    return {
      download: async (options: any): Promise<number> => {
        try {
          // Create download record
          const download = await db.download.create({
            data: {
              url: options.url,
              filename: options.filename || 'download',
              totalBytes: 0,
              bytesReceived: 0,
              state: 'in_progress',
              paused: false,
              canResume: false,
              danger: 'safe',
              mime: 'application/octet-stream',
              startTime: new Date().toISOString(),
              exists: false,
            },
          });

          // Emit created event
          eventEmitter.dispatchEvent(new CustomEvent('created', {
            detail: download,
          }));

          return download.id;
        } catch (error) {
          console.error('Download create error:', error);
          throw error;
        }
      },

      search: async (query: any): Promise<DownloadItem[]> => {
        try {
          const downloads = await db.download.findMany({
            where: query,
          });
          return downloads as DownloadItem[];
        } catch (error) {
          console.error('Download search error:', error);
          return [];
        }
      },

      pause: async (id: number): Promise<void> => {
        try {
          await db.download.update({
            where: { id },
            data: { paused: true },
          });

          // Emit changed event
          eventEmitter.dispatchEvent(new CustomEvent('changed', {
            detail: { id, paused: { current: true, previous: false } },
          }));
        } catch (error) {
          console.error('Download pause error:', error);
          throw error;
        }
      },

      resume: async (id: number): Promise<void> => {
        try {
          await db.download.update({
            where: { id },
            data: { paused: false },
          });

          // Emit changed event
          eventEmitter.dispatchEvent(new CustomEvent('changed', {
            detail: { id, paused: { current: false, previous: true } },
          }));
        } catch (error) {
          console.error('Download resume error:', error);
          throw error;
        }
      },

      cancel: async (id: number): Promise<void> => {
        try {
          await db.download.update({
            where: { id },
            data: { state: 'interrupted', error: 'USER_CANCELED' },
          });

          // Emit changed event
          eventEmitter.dispatchEvent(new CustomEvent('changed', {
            detail: { id, state: { current: 'interrupted', previous: 'in_progress' } },
          }));
        } catch (error) {
          console.error('Download cancel error:', error);
          throw error;
        }
      },

      erase: async (query: any): Promise<number[]> => {
        try {
          const downloads = await db.download.findMany({
            where: query,
            select: { id: true },
          });
          
          const ids = downloads.map(d => d.id);
          
          await db.download.deleteMany({
            where: { id: { in: ids } },
          });

          return ids;
        } catch (error) {
          console.error('Download erase error:', error);
          return [];
        }
      },

      onCreated: {
        addListener: (callback: (downloadItem: DownloadItem) => void) => {
          eventEmitter.addEventListener('created', (event: any) => callback(event.detail));
        },
        removeListener: (callback: (downloadItem: DownloadItem) => void) => {
          eventEmitter.removeEventListener('created', callback);
        },
        hasListener: (callback: (downloadItem: DownloadItem) => void) => {
          return eventEmitter.listeners('created').includes(callback);
        },
      },

      onChanged: {
        addListener: (callback: (delta: any) => void) => {
          eventEmitter.addEventListener('changed', (event: any) => callback(event.detail));
        },
        removeListener: (callback: (delta: any) => void) => {
          eventEmitter.removeEventListener('changed', callback);
        },
        hasListener: (callback: (delta: any) => void) => {
          return eventEmitter.listeners('changed').includes(callback);
        },
      },
    };
  }

  // Bookmarks API Implementation
  createBookmarksAPI() {
    const eventEmitter = new EventTarget();

    return {
      create: async (bookmark: any): Promise<BookmarkTreeNode> => {
        try {
          const newBookmark = await db.bookmark.create({
            data: {
              title: bookmark.title,
              url: bookmark.url,
              parentId: bookmark.parentId,
              index: bookmark.index,
              dateAdded: Date.now(),
            },
          });

          // Emit created event
          eventEmitter.dispatchEvent(new CustomEvent('created', {
            detail: newBookmark.id,
            bookmark: newBookmark,
          }));

          return newBookmark as BookmarkTreeNode;
        } catch (error) {
          console.error('Bookmark create error:', error);
          throw error;
        }
      },

      getTree: async (): Promise<BookmarkTreeNode[]> => {
        try {
          const bookmarks = await db.bookmark.findMany({
            orderBy: { index: 'asc' },
          });

          // Build tree structure
          const buildTree = (parentId?: string): BookmarkTreeNode[] => {
            return bookmarks
              .filter(b => b.parentId === parentId)
              .map(b => ({
                id: b.id,
                parentId: b.parentId,
                index: b.index,
                url: b.url,
                title: b.title,
                dateAdded: b.dateAdded,
                dateGroupModified: b.dateGroupModified,
                children: buildTree(b.id),
              }));
          };

          return buildTree();
        } catch (error) {
          console.error('Bookmark getTree error:', error);
          return [];
        }
      },

      remove: async (id: string): Promise<void> => {
        try {
          const bookmark = await db.bookmark.findUnique({
            where: { id },
          });

          if (!bookmark) {
            throw new Error('Bookmark not found');
          }

          await db.bookmark.delete({
            where: { id },
          });

          // Emit removed event
          eventEmitter.dispatchEvent(new CustomEvent('removed', {
            detail: id,
            removeInfo: { parentId: bookmark.parentId, index: bookmark.index },
          }));
        } catch (error) {
          console.error('Bookmark remove error:', error);
          throw error;
        }
      },

      update: async (id: string, changes: any): Promise<void> => {
        try {
          await db.bookmark.update({
            where: { id },
            data: {
              ...changes,
              dateGroupModified: Date.now(),
            },
          });

          // Emit changed event
          eventEmitter.dispatchEvent(new CustomEvent('changed', {
            detail: id,
            changeInfo: changes,
          }));
        } catch (error) {
          console.error('Bookmark update error:', error);
          throw error;
        }
      },

      onCreated: {
        addListener: (callback: (id: string, bookmark: BookmarkTreeNode) => void) => {
          eventEmitter.addEventListener('created', (event: any) => callback(event.detail.id, event.detail.bookmark));
        },
        removeListener: (callback: (id: string, bookmark: BookmarkTreeNode) => void) => {
          eventEmitter.removeEventListener('created', callback);
        },
        hasListener: (callback: (id: string, bookmark: BookmarkTreeNode) => void) => {
          return eventEmitter.listeners('created').includes(callback);
        },
      },

      onRemoved: {
        addListener: (callback: (id: string, removeInfo: any) => void) => {
          eventEmitter.addEventListener('removed', (event: any) => callback(event.detail.id, event.detail.removeInfo));
        },
        removeListener: (callback: (id: string, removeInfo: any) => void) => {
          eventEmitter.removeEventListener('removed', callback);
        },
        hasListener: (callback: (id: string, removeInfo: any) => void) => {
          return eventEmitter.listeners('removed').includes(callback);
        },
      },

      onChanged: {
        addListener: (callback: (id: string, changeInfo: any) => void) => {
          eventEmitter.addEventListener('changed', (event: any) => callback(event.detail.id, event.detail.changeInfo));
        },
        removeListener: (callback: (id: string, changeInfo: any) => void) => {
          eventEmitter.removeEventListener('changed', callback);
        },
        hasListener: (callback: (id: string, changeInfo: any) => void) => {
          return eventEmitter.listeners('changed').includes(callback);
        },
      },
    };
  }

  // Permission checker
  async checkPermissions(extensionId: string, requiredPermissions: ExtensionPermission[]): Promise<boolean> {
    try {
      const extension = await db.extension.findUnique({
        where: { id: extensionId },
        select: { permissions: true },
      });

      if (!extension) {
        return false;
      }

      const grantedPermissions = extension.permissions as ExtensionPermission[];
      return requiredPermissions.every(permission => grantedPermissions.includes(permission));
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  // Request permissions
  async requestPermissions(extensionId: string, permissions: ExtensionPermission[]): Promise<boolean> {
    try {
      // This would typically show a UI dialog to the user
      // For now, we'll auto-grant for development
      const extension = await db.extension.findUnique({
        where: { id: extensionId },
      });

      if (!extension) {
        return false;
      }

      const currentPermissions = extension.permissions as ExtensionPermission[];
      const newPermissions = [...new Set([...currentPermissions, ...permissions])];

      await db.extension.update({
        where: { id: extensionId },
        data: { permissions: newPermissions },
      });

      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  // Remove permissions
  async removePermissions(extensionId: string, permissions: ExtensionPermission[]): Promise<void> {
    try {
      const extension = await db.extension.findUnique({
        where: { id: extensionId },
      });

      if (!extension) {
        return;
      }

      const currentPermissions = extension.permissions as ExtensionPermission[];
      const updatedPermissions = currentPermissions.filter(p => !permissions.includes(p));

      await db.extension.update({
        where: { id: extensionId },
        data: { permissions: updatedPermissions },
      });
    } catch (error) {
      console.error('Permission removal error:', error);
      throw error;
    }
  }
}

// Global API implementation instance
export const extensionAPI = new ExtensionAPIImpl();
'use client';

import { useState, useEffect } from 'react';

interface Extension {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  permissions: string[];
  enabled: boolean;
  installedAt: string;
  icons?: any;
}

interface ExtensionStorage {
  get(key?: string | string[] | Record<string, any>): Promise<Record<string, any>>;
  set(items: Record<string, any>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
  clear(): Promise<void>;
}

interface ExtensionAPI {
  local: ExtensionStorage;
  sync: ExtensionStorage;
  managed: ExtensionStorage;
}

export function useExtensions() {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load extensions
  const loadExtensions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/extensions?action=list');
      if (!response.ok) {
        throw new Error('Failed to load extensions');
      }
      
      const data = await response.json();
      const parsedExtensions = data.map((ext: any) => ({
        ...ext,
        permissions: JSON.parse(ext.permissions || '[]'),
        icons: JSON.parse(ext.icons || '{}'),
      }));
      
      setExtensions(parsedExtensions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Install extension
  const installExtension = async (manifest: any, extensionId: string) => {
    try {
      const response = await fetch('/api/extensions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'install',
          manifest,
          extensionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to install extension');
      }

      await loadExtensions(); // Refresh the list
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  };

  // Uninstall extension
  const uninstallExtension = async (extensionId: string) => {
    try {
      const response = await fetch('/api/extensions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'uninstall',
          id: extensionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to uninstall extension');
      }

      await loadExtensions(); // Refresh the list
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  };

  // Toggle extension
  const toggleExtension = async (extensionId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/extensions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle',
          id: extensionId,
          enabled,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle extension');
      }

      await loadExtensions(); // Refresh the list
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  };

  // Get extension storage API
  const getStorageAPI = (extensionId: string): ExtensionAPI => {
    const createStorageArea = (area: 'local' | 'sync' | 'managed'): ExtensionStorage => ({
      get: async (keys?: any) => {
        const response = await fetch('/api/extensions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'storage',
            id: extensionId,
            area,
            key: keys,
            operation: 'get',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get storage data');
        }

        return await response.json();
      },

      set: async (items: Record<string, any>) => {
        for (const [key, value] of Object.entries(items)) {
          const response = await fetch('/api/extensions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'storage',
              id: extensionId,
              area,
              key,
              value,
              operation: 'set',
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to set storage data');
          }
        }
      },

      remove: async (keys: string | string[]) => {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        
        for (const key of keyArray) {
          const response = await fetch('/api/extensions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'storage',
              id: extensionId,
              area,
              key,
              operation: 'remove',
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to remove storage data');
          }
        }
      },

      clear: async () => {
        const response = await fetch('/api/extensions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'storage',
            id: extensionId,
            area,
            operation: 'clear',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to clear storage data');
        }
      },
    });

    return {
      local: createStorageArea('local'),
      sync: createStorageArea('sync'),
      managed: createStorageArea('managed'),
    };
  };

  // Load extensions on mount
  useEffect(() => {
    loadExtensions();
  }, []);

  return {
    extensions,
    loading,
    error,
    loadExtensions,
    installExtension,
    uninstallExtension,
    toggleExtension,
    getStorageAPI,
  };
}
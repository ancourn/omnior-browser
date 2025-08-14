/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

import type { ProfileId, BookmarkFolder, BookmarkItem } from '../common/models';
import { SimpleEventEmitter } from '../common/models';
import { StorageKeys } from '../common/storage-keys';
import { getSecureStorage } from '@/lib/auth/secure-storage';

export interface BookmarkService {
  listFolders(): BookmarkFolder[];
  listItems(folderId?: string): BookmarkItem[];
  search(q: string): BookmarkItem[];
  createFolder(name: string, parentId?: string): BookmarkFolder;
  add(item: Omit<BookmarkItem, 'id' | 'createdAt'>): BookmarkItem;
  update(id: string, patch: Partial<BookmarkItem>): void;
  remove(id: string): void;
  importNetscape(html: string): Promise<{ folders: number; items: number }>;
  exportNetscape(): Promise<string>;
  persist(): Promise<void>;
  restore(): Promise<void>;
  on(event: string, callback: (...args: any[]) => void): () => void;
}

export class OmniorBookmarkService extends SimpleEventEmitter implements BookmarkService {
  private folders: BookmarkFolder[] = [];
  private items: BookmarkItem[] = [];
  private profileId: ProfileId;
  private persistTimeout: NodeJS.Timeout | null = null;

  constructor(profileId: ProfileId) {
    super();
    this.profileId = profileId;
  }

  listFolders(): BookmarkFolder[] {
    return [...this.folders];
  }

  listItems(folderId?: string): BookmarkItem[] {
    if (folderId) {
      return this.items.filter(item => item.folderId === folderId);
    }
    return this.items.filter(item => !item.folderId);
  }

  search(q: string): BookmarkItem[] {
    const query = q.toLowerCase();
    return this.items.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.url.toLowerCase().includes(query) ||
      item.tags.some(tag => tag.toLowerCase().includes(query)) ||
      (item.notes && item.notes.toLowerCase().includes(query))
    );
  }

  createFolder(name: string, parentId?: string): BookmarkFolder {
    const folder: BookmarkFolder = {
      id: this.generateId(),
      name,
      parentId,
    };

    this.folders.push(folder);
    this.schedulePersist();
    this.emit('folder-created', folder);
    
    return folder;
  }

  add(item: Omit<BookmarkItem, 'id' | 'createdAt'>): BookmarkItem {
    const bookmark: BookmarkItem = {
      ...item,
      id: this.generateId(),
      createdAt: Date.now(),
    };

    this.items.push(bookmark);
    this.schedulePersist();
    this.emit('bookmark-added', bookmark);
    
    return bookmark;
  }

  update(id: string, patch: Partial<BookmarkItem>): void {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error(`Bookmark with id ${id} not found`);
    }

    this.items[index] = {
      ...this.items[index],
      ...patch,
    };

    this.schedulePersist();
    this.emit('bookmark-updated', this.items[index]);
  }

  remove(id: string): void {
    const itemIndex = this.items.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      throw new Error(`Bookmark with id ${id} not found`);
    }

    const [removedItem] = this.items.splice(itemIndex, 1);
    this.schedulePersist();
    this.emit('bookmark-removed', removedItem);
  }

  async importNetscape(html: string): Promise<{ folders: number; items: number }> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const dl = doc.querySelector('dl');
    
    if (!dl) {
      throw new Error('Invalid Netscape bookmark format');
    }

    let foldersCreated = 0;
    let itemsCreated = 0;
    let currentFolder: string | undefined;

    const processNode = (node: Node, folderId?: string) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        
        if (element.tagName === 'DT') {
          const child = element.firstElementChild;
          
          if (child) {
            if (child.tagName === 'A') {
              // Bookmark item
              const bookmark: Omit<BookmarkItem, 'id' | 'createdAt'> = {
                title: child.textContent || '',
                url: child.getAttribute('href') || '',
                tags: [],
                folderId,
                notes: child.getAttribute('tags') || undefined,
              };
              
              this.add(bookmark);
              itemsCreated++;
            } else if (child.tagName === 'H3') {
              // Folder
              const folderName = child.textContent || '';
              const newFolder = this.createFolder(folderName, folderId);
              currentFolder = newFolder.id;
              foldersCreated++;
              
              // Process folder contents
              const nextDt = element.nextElementSibling;
              if (nextDt?.tagName === 'DD') {
                const dl = nextDt.querySelector('dl');
                if (dl) {
                  Array.from(dl.children).forEach(child => processNode(child, newFolder.id));
                }
              }
            }
          }
        }
      }
    };

    Array.from(dl.children).forEach(child => processNode(child));
    
    return { folders: foldersCreated, items: itemsCreated };
  }

  async exportNetscape(): Promise<string> {
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

    const exportFolder = (folder: BookmarkFolder, level: number = 0) => {
      const indent = '  '.repeat(level);
      html += `${indent}<DT><H3>${this.escapeHtml(folder.name)}</H3>\n`;
      html += `${indent}<DL><p>\n`;
      
      // Export items in this folder
      const itemsInFolder = this.items.filter(item => item.folderId === folder.id);
      itemsInFolder.forEach(item => {
        html += `${indent}  <DT><A HREF="${this.escapeHtml(item.url)}" TAGS="${item.tags.join(',')}">${this.escapeHtml(item.title)}</A>\n`;
      });
      
      // Export subfolders
      const subfolders = this.folders.filter(f => f.parentId === folder.id);
      subfolders.forEach(subfolder => {
        exportFolder(subfolder, level + 1);
      });
      
      html += `${indent}</DL><p>\n`;
    };

    // Export root level items
    const rootItems = this.items.filter(item => !item.folderId);
    rootItems.forEach(item => {
      html += `  <DT><A HREF="${this.escapeHtml(item.url)}" TAGS="${item.tags.join(',')}">${this.escapeHtml(item.title)}</A>\n`;
    });

    // Export root folders
    const rootFolders = this.folders.filter(folder => !folder.parentId);
    rootFolders.forEach(folder => {
      exportFolder(folder);
    });

    html += `</DL><p>\n`;
    return html;
  }

  async persist(): Promise<void> {
    const storage = getSecureStorage();
    const bookmarksData = {
      folders: this.folders,
      items: this.items,
    };

    await storage.set(StorageKeys.bookmarks(this.profileId), bookmarksData);
  }

  async restore(): Promise<void> {
    const storage = getSecureStorage();
    try {
      const bookmarksData = await storage.get(StorageKeys.bookmarks(this.profileId));
      if (bookmarksData) {
        this.folders = bookmarksData.folders || [];
        this.items = bookmarksData.items || [];
      }
    } catch (error) {
      console.error('Failed to restore bookmarks:', error);
    }
  }

  private schedulePersist(): void {
    if (this.persistTimeout) {
      clearTimeout(this.persistTimeout);
    }

    this.persistTimeout = setTimeout(() => {
      this.persist();
    }, 300);
  }

  private generateId(): string {
    return `bm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
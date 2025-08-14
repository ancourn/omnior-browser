/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

import { create } from 'zustand';
import type { BookmarkFolder, BookmarkItem } from '../common/models';
import type { OmniorBookmarkService } from './service';

interface BookmarksState {
  folders: BookmarkFolder[];
  items: BookmarkItem[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedFolderId: string | null;
}

interface BookmarksActions {
  setFolders: (folders: BookmarkFolder[]) => void;
  setItems: (items: BookmarkItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedFolderId: (folderId: string | null) => void;
  reset: () => void;
}

export const useBookmarksStore = create<BookmarksState & BookmarksActions>((set) => ({
  folders: [],
  items: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedFolderId: null,
  
  setFolders: (folders) => set({ folders }),
  setItems: (items) => set({ items }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedFolderId: (selectedFolderId) => set({ selectedFolderId }),
  reset: () => set({ 
    folders: [], 
    items: [], 
    isLoading: false, 
    error: null, 
    searchQuery: '', 
    selectedFolderId: null 
  }),
}));

export class BookmarksStoreManager {
  private service: OmniorBookmarkService;
  private store = useBookmarksStore.getState();

  constructor(service: OmniorBookmarkService) {
    this.service = service;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.service.on('folder-created', (folder: BookmarkFolder) => {
      useBookmarksStore.getState().setFolders(this.service.listFolders());
    });

    this.service.on('bookmark-added', (bookmark: BookmarkItem) => {
      useBookmarksStore.getState().setItems(this.service.listItems());
    });

    this.service.on('bookmark-updated', (bookmark: BookmarkItem) => {
      useBookmarksStore.getState().setItems(this.service.listItems());
    });

    this.service.on('bookmark-removed', (bookmark: BookmarkItem) => {
      useBookmarksStore.getState().setItems(this.service.listItems());
    });
  }

  async initialize(): Promise<void> {
    try {
      useBookmarksStore.getState().setLoading(true);
      await this.service.restore();
      useBookmarksStore.getState().setFolders(this.service.listFolders());
      useBookmarksStore.getState().setItems(this.service.listItems());
    } catch (error) {
      useBookmarksStore.getState().setError(error instanceof Error ? error.message : 'Failed to initialize bookmarks');
    } finally {
      useBookmarksStore.getState().setLoading(false);
    }
  }
}
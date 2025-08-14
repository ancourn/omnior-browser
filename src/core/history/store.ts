/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

import { create } from 'zustand';
import type { HistoryEntry } from '../common/models';
import type { OmniorHistoryService } from './service';

interface HistoryState {
  history: Map<string, HistoryEntry[]>;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedDate: Date | null;
}

interface HistoryActions {
  setHistory: (history: Map<string, HistoryEntry[]>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedDate: (date: Date | null) => void;
  reset: () => void;
}

export const useHistoryStore = create<HistoryState & HistoryActions>((set) => ({
  history: new Map(),
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedDate: null,
  
  setHistory: (history) => set({ history }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  reset: () => set({ 
    history: new Map(), 
    isLoading: false, 
    error: null, 
    searchQuery: '', 
    selectedDate: null 
  }),
}));

export class HistoryStoreManager {
  private service: OmniorHistoryService;
  private store = useHistoryStore.getState();

  constructor(service: OmniorHistoryService) {
    this.service = service;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.service.on('history-added', (entry: HistoryEntry) => {
      useHistoryStore.getState().setHistory(new Map(this.service['history']));
    });

    this.service.on('history-cleared', () => {
      useHistoryStore.getState().setHistory(new Map(this.service['history']));
    });
  }

  async initialize(): Promise<void> {
    try {
      useHistoryStore.getState().setLoading(true);
      await this.service.restore();
      useHistoryStore.getState().setHistory(new Map(this.service['history']));
    } catch (error) {
      useHistoryStore.getState().setError(error instanceof Error ? error.message : 'Failed to initialize history');
    } finally {
      useHistoryStore.getState().setLoading(false);
    }
  }
}
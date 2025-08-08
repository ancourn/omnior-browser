export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  profileId?: string;
}

export interface NotesStorage {
  notes: Note[];
  settings: {
    defaultProfile: string;
    autoSave: boolean;
    autoSaveInterval: number; // in seconds
    maxNotes: number;
    exportFormat: 'markdown' | 'txt';
  };
}

export class NotesService {
  private static STORAGE_KEY = 'omnior-notes';
  private static SETTINGS_KEY = 'omnior-notes-settings';
  private autoSaveTimer: NodeJS.Timeout | null = null;

  private getDefaultSettings(): NotesStorage['settings'] {
    return {
      defaultProfile: 'default',
      autoSave: true,
      autoSaveInterval: 30,
      maxNotes: 1000,
      exportFormat: 'markdown'
    };
  }

  private getStorage(): NotesStorage {
    if (typeof window === 'undefined') {
      return { notes: [], settings: this.getDefaultSettings() };
    }

    try {
      const notesData = localStorage.getItem(this.STORAGE_KEY);
      const settingsData = localStorage.getItem(this.SETTINGS_KEY);

      const notes = notesData ? JSON.parse(notesData) : [];
      const settings = settingsData ? JSON.parse(settingsData) : this.getDefaultSettings();

      // Convert date strings back to Date objects
      const parsedNotes = notes.map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt)
      }));

      return { notes: parsedNotes, settings };
    } catch (error) {
      console.error('Error loading notes from storage:', error);
      return { notes: [], settings: this.getDefaultSettings() };
    }
  }

  private saveStorage(storage: NotesStorage): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storage.notes));
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(storage.settings));
    } catch (error) {
      console.error('Error saving notes to storage:', error);
    }
  }

  getNotes(profileId?: string): Note[] {
    const storage = this.getStorage();
    const notes = profileId 
      ? storage.notes.filter(note => note.profileId === profileId)
      : storage.notes;
    
    // Sort by pinned first, then by updated date (newest first)
    return notes.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  }

  getNote(id: string): Note | null {
    const storage = this.getStorage();
    return storage.notes.find(note => note.id === id) || null;
  }

  createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note {
    const storage = this.getStorage();
    const newNote: Note = {
      ...note,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    storage.notes.push(newNote);
    this.saveStorage(storage);

    return newNote;
  }

  updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): Note | null {
    const storage = this.getStorage();
    const noteIndex = storage.notes.findIndex(note => note.id === id);
    
    if (noteIndex === -1) return null;

    storage.notes[noteIndex] = {
      ...storage.notes[noteIndex],
      ...updates,
      updatedAt: new Date()
    };

    this.saveStorage(storage);
    return storage.notes[noteIndex];
  }

  deleteNote(id: string): boolean {
    const storage = this.getStorage();
    const initialLength = storage.notes.length;
    storage.notes = storage.notes.filter(note => note.id !== id);
    
    if (storage.notes.length < initialLength) {
      this.saveStorage(storage);
      return true;
    }
    
    return false;
  }

  togglePin(id: string): Note | null {
    const note = this.getNote(id);
    if (!note) return null;
    
    return this.updateNote(id, { pinned: !note.pinned });
  }

  searchNotes(query: string, profileId?: string): Note[] {
    const notes = this.getNotes(profileId);
    const lowercaseQuery = query.toLowerCase().trim();
    
    if (!lowercaseQuery) return notes;

    return notes.filter(note => 
      note.title.toLowerCase().includes(lowercaseQuery) ||
      note.content.toLowerCase().includes(lowercaseQuery) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  getNotesByTag(tag: string, profileId?: string): Note[] {
    const notes = this.getNotes(profileId);
    return notes.filter(note => 
      note.tags.some(noteTag => noteTag.toLowerCase() === tag.toLowerCase())
    );
  }

  getAllTags(profileId?: string): string[] {
    const notes = this.getNotes(profileId);
    const tagSet = new Set<string>();
    
    notes.forEach(note => {
      note.tags.forEach(tag => tagSet.add(tag));
    });

    return Array.from(tagSet).sort();
  }

  exportNotes(format: 'markdown' | 'txt' = 'markdown', profileId?: string): string {
    const notes = this.getNotes(profileId);
    
    if (format === 'markdown') {
      return notes.map(note => {
        const tags = note.tags.length > 0 ? `\n**Tags:** ${note.tags.join(', ')}` : '';
        const pinned = note.pinned ? ' 📌' : '';
        return `# ${note.title}${pinned}\n\n${note.content}${tags}\n\n---\n\n`;
      }).join('');
    } else {
      return notes.map(note => {
        const tags = note.tags.length > 0 ? `\nTags: ${note.tags.join(', ')}` : '';
        const pinned = note.pinned ? ' [PINNED]' : '';
        return `${note.title}${pinned}\n${note.content}${tags}\n\n---\n\n`;
      }).join('');
    }
  }

  importNotes(markdownContent: string, profileId?: string): Note[] {
    const sections = markdownContent.split('---').filter(section => section.trim());
    const importedNotes: Note[] = [];

    sections.forEach(section => {
      const lines = section.trim().split('\n');
      if (lines.length === 0) return;

      // Extract title from first line (markdown heading)
      const titleMatch = lines[0].match(/^#\s+(.+?)(\s*📌)?$/);
      if (!titleMatch) return;

      const title = titleMatch[1].trim();
      const pinned = titleMatch[2] !== undefined;

      // Extract content (everything after title until tags)
      let contentStart = 1;
      let contentEnd = lines.length;
      let tags: string[] = [];

      // Find tags section
      const tagsIndex = lines.findIndex(line => 
        line.toLowerCase().includes('**tags:**') || line.toLowerCase().includes('tags:')
      );

      if (tagsIndex !== -1) {
        contentEnd = tagsIndex;
        const tagsLine = lines[tagsIndex];
        const tagsMatch = tagsLine.match(/(?:\*\*Tags:\*\*|Tags:)\s*(.+)/);
        if (tagsMatch) {
          tags = tagsMatch[1].split(',').map(tag => tag.trim()).filter(tag => tag);
        }
      }

      const content = lines.slice(contentStart, contentEnd)
        .join('\n')
        .trim();

      const note = this.createNote({
        title,
        content,
        tags,
        pinned,
        profileId
      });

      importedNotes.push(note);
    });

    return importedNotes;
  }

  getSettings(): NotesStorage['settings'] {
    const storage = this.getStorage();
    return storage.settings;
  }

  updateSettings(settings: Partial<NotesStorage['settings']>): void {
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
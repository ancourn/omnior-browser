'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Note, NotesService } from '@/lib/notes/notes-service';

export function useNotes(profileId?: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  const notesServiceRef = useRef<NotesService | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize notes service
  useEffect(() => {
    if (typeof window !== 'undefined') {
      notesServiceRef.current = new NotesService();
      loadNotes();
      
      const settings = notesServiceRef.current.getSettings();
      setAutoSaveEnabled(settings.autoSave);
    }
  }, []);

  // Load notes from storage
  const loadNotes = useCallback(() => {
    if (!notesServiceRef.current) return;
    
    setIsLoading(true);
    try {
      const loadedNotes = notesServiceRef.current.getNotes(profileId);
      setNotes(loadedNotes);
      
      if (loadedNotes.length > 0 && !selectedNote) {
        setSelectedNote(loadedNotes[0]);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profileId, selectedNote]);

  // Filter notes based on search query
  const filteredNotes = searchQuery.trim() === '' 
    ? notes 
    : notesServiceRef.current?.searchNotes(searchQuery, profileId) || [];

  // Create a new note
  const createNote = useCallback((title: string = 'New Note', content: string = '') => {
    if (!notesServiceRef.current) return null;

    try {
      const newNote = notesServiceRef.current.createNote({
        title,
        content,
        tags: [],
        pinned: false,
        profileId
      });

      setNotes(prev => {
        const updated = [newNote, ...prev];
        return updated.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        });
      });

      setSelectedNote(newNote);
      return newNote;
    } catch (error) {
      console.error('Error creating note:', error);
      return null;
    }
  }, [profileId]);

  // Update a note
  const updateNote = useCallback((id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
    if (!notesServiceRef.current) return false;

    try {
      const updatedNote = notesServiceRef.current.updateNote(id, updates);
      if (!updatedNote) return false;

      setNotes(prev => {
        const updated = prev.map(note => 
          note.id === id ? updatedNote : note
        );
        return updated.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        });
      });

      if (selectedNote?.id === id) {
        setSelectedNote(updatedNote);
      }

      return true;
    } catch (error) {
      console.error('Error updating note:', error);
      return false;
    }
  }, [selectedNote]);

  // Delete a note
  const deleteNote = useCallback((id: string) => {
    if (!notesServiceRef.current) return false;

    try {
      const success = notesServiceRef.current.deleteNote(id);
      if (!success) return false;

      setNotes(prev => prev.filter(note => note.id !== id));

      if (selectedNote?.id === id) {
        setSelectedNote(notes.find(note => note.id !== id) || null);
      }

      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  }, [notes, selectedNote]);

  // Toggle pin status
  const togglePin = useCallback((id: string) => {
    if (!notesServiceRef.current) return false;

    try {
      const updatedNote = notesServiceRef.current.togglePin(id);
      if (!updatedNote) return false;

      setNotes(prev => {
        const updated = prev.map(note => 
          note.id === id ? updatedNote : note
        );
        return updated.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        });
      });

      if (selectedNote?.id === id) {
        setSelectedNote(updatedNote);
      }

      return true;
    } catch (error) {
      console.error('Error toggling pin:', error);
      return false;
    }
  }, [selectedNote]);

  // Add tag to note
  const addTag = useCallback((id: string, tag: string) => {
    const note = notes.find(n => n.id === id);
    if (!note || note.tags.includes(tag)) return false;

    return updateNote(id, { tags: [...note.tags, tag] });
  }, [notes, updateNote]);

  // Remove tag from note
  const removeTag = useCallback((id: string, tag: string) => {
    const note = notes.find(n => n.id === id);
    if (!note || !note.tags.includes(tag)) return false;

    return updateNote(id, { tags: note.tags.filter(t => t !== tag) });
  }, [notes, updateNote]);

  // Export notes
  const exportNotes = useCallback((format: 'markdown' | 'txt' = 'markdown') => {
    if (!notesServiceRef.current) return '';

    try {
      return notesServiceRef.current.exportNotes(format, profileId);
    } catch (error) {
      console.error('Error exporting notes:', error);
      return '';
    }
  }, [profileId]);

  // Import notes
  const importNotes = useCallback((content: string) => {
    if (!notesServiceRef.current) return [];

    try {
      const importedNotes = notesServiceRef.current.importNotes(content, profileId);
      loadNotes(); // Reload to get the updated list
      return importedNotes;
    } catch (error) {
      console.error('Error importing notes:', error);
      return [];
    }
  }, [loadNotes, profileId]);

  // Get all tags
  const getAllTags = useCallback(() => {
    if (!notesServiceRef.current) return [];
    return notesServiceRef.current.getAllTags(profileId);
  }, [profileId]);

  // Get notes by tag
  const getNotesByTag = useCallback((tag: string) => {
    if (!notesServiceRef.current) return [];
    return notesServiceRef.current.getNotesByTag(tag, profileId);
  }, [profileId]);

  // Auto-save functionality
  const startAutoSave = useCallback(() => {
    if (!notesServiceRef.current || !autoSaveEnabled) return;

    const settings = notesServiceRef.current.getSettings();
    if (!settings.autoSave) return;

    autoSaveTimerRef.current = setInterval(() => {
      if (selectedNote) {
        // Auto-save is handled by the service, we just ensure it's running
        console.log('Auto-saving notes...');
      }
    }, settings.autoSaveInterval * 1000);
  }, [autoSaveEnabled, selectedNote]);

  const stopAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  // Start auto-save when enabled
  useEffect(() => {
    if (autoSaveEnabled) {
      startAutoSave();
    } else {
      stopAutoSave();
    }

    return () => stopAutoSave();
  }, [autoSaveEnabled, startAutoSave, stopAutoSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoSave();
      if (notesServiceRef.current) {
        notesServiceRef.current.cleanup();
      }
    };
  }, [stopAutoSave]);

  return {
    notes,
    filteredNotes,
    selectedNote,
    setSelectedNote,
    searchQuery,
    setSearchQuery,
    isLoading,
    autoSaveEnabled,
    setAutoSaveEnabled,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    addTag,
    removeTag,
    exportNotes,
    importNotes,
    getAllTags,
    getNotesByTag,
    loadNotes
  };
}
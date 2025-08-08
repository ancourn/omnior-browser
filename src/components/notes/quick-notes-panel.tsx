'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNotes } from '@/hooks/use-notes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Plus, 
  Pin, 
  PinOff, 
  Trash2, 
  Download, 
  Upload, 
  Tag,
  X,
  Save,
  FileText,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';

interface QuickNotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  profileId?: string;
}

export function QuickNotesPanel({ isOpen, onClose, profileId }: QuickNotesPanelProps) {
  const {
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
    getAllTags
  } = useNotes(profileId);

  const [newTagInput, setNewTagInput] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Keyboard shortcut to toggle panel
  useKeyboardShortcut(['Control', 'KeyN'], () => {
    if (isOpen) {
      onClose();
    } else {
      // This would be handled by the parent component
    }
  });

  // Auto-save functionality
  useEffect(() => {
    if (!selectedNote || !autoSaveEnabled) return;

    const autoSaveTimer = setTimeout(() => {
      if (selectedNote.content.trim() !== '') {
        updateNote(selectedNote.id, { content: selectedNote.content });
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [selectedNote?.content, autoSaveEnabled, updateNote, selectedNote]);

  const handleCreateNote = () => {
    const newNote = createNote();
    if (newNote) {
      toast({
        title: "Note created",
        description: "New note has been created successfully."
      });
    }
  };

  const handleDeleteNote = (id: string) => {
    if (deleteNote(id)) {
      toast({
        title: "Note deleted",
        description: "Note has been deleted successfully."
      });
    }
  };

  const handleTogglePin = (id: string) => {
    togglePin(id);
  };

  const handleContentChange = (content: string) => {
    if (selectedNote) {
      setSelectedNote({ ...selectedNote, content });
    }
  };

  const handleTitleEdit = () => {
    if (selectedNote && tempTitle.trim() !== '') {
      updateNote(selectedNote.id, { title: tempTitle.trim() });
      setIsEditingTitle(false);
    } else {
      setIsEditingTitle(false);
      setTempTitle(selectedNote?.title || '');
    }
  };

  const handleAddTag = () => {
    if (selectedNote && newTagInput.trim() !== '') {
      const tag = newTagInput.trim();
      if (!selectedNote.tags.includes(tag)) {
        addTag(selectedNote.id, tag);
        setNewTagInput('');
      }
    }
  };

  const handleRemoveTag = (tag: string) => {
    if (selectedNote) {
      removeTag(selectedNote.id, tag);
    }
  };

  const handleExportNotes = (format: 'markdown' | 'txt') => {
    const content = exportNotes(format);
    const blob = new Blob([content], { 
      type: format === 'markdown' ? 'text/markdown' : 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-export.${format === 'markdown' ? 'md' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Notes exported",
      description: `Notes have been exported as ${format.toUpperCase()}.`
    });
  };

  const handleImportNotes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const imported = importNotes(content);
      
      toast({
        title: "Notes imported",
        description: `${imported.length} notes have been imported successfully.`
      });
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const allTags = getAllTags();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative ml-auto h-full w-full max-w-2xl bg-background border-l shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Quick Notes</h2>
            <Badge variant="secondary" className="text-xs">
              {notes.length} notes
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt"
              className="hidden"
              onChange={handleImportNotes}
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleExportNotes('markdown')}
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex h-[calc(100%-60px)]">
          {/* Sidebar */}
          <div className="w-80 border-r flex flex-col">
            {/* Search */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div className="p-3 border-b">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4" />
                  <span className="text-sm font-medium">Tags</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {allTags.slice(0, 8).map(tag => (
                    <Badge 
                      key={tag} 
                      variant="outline" 
                      className="text-xs cursor-pointer hover:bg-secondary"
                      onClick={() => setSearchQuery(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes List */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {isLoading ? (
                  <div className="text-center text-muted-foreground py-8">
                    Loading notes...
                  </div>
                ) : filteredNotes.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    {searchQuery ? 'No notes found' : 'No notes yet'}
                  </div>
                ) : (
                  filteredNotes.map(note => (
                    <div
                      key={note.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedNote?.id === note.id 
                          ? 'bg-secondary' 
                          : 'hover:bg-secondary/50'
                      }`}
                      onClick={() => setSelectedNote(note)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            {note.pinned && <Pin className="h-3 w-3 text-yellow-500" />}
                            <h3 className="font-medium text-sm truncate">
                              {note.title}
                            </h3>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {note.content || 'Empty note'}
                          </p>
                          {note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {note.tags.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {note.tags.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{note.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePin(note.id);
                            }}
                          >
                            {note.pinned ? (
                              <PinOff className="h-3 w-3" />
                            ) : (
                              <Pin className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Create Note Button */}
            <div className="p-3 border-t">
              <Button 
                onClick={handleCreateNote} 
                className="w-full"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {selectedNote ? (
              <>
                {/* Note Header */}
                <div className="p-4 border-b">
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleTitleEdit();
                          if (e.key === 'Escape') {
                            setIsEditingTitle(false);
                            setTempTitle(selectedNote.title);
                          }
                        }}
                        autoFocus
                      />
                      <Button size="sm" onClick={handleTitleEdit}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setIsEditingTitle(false);
                          setTempTitle(selectedNote.title);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {selectedNote.pinned && (
                          <Pin className="h-4 w-4 text-yellow-500" />
                        )}
                        <h2 
                          className="text-xl font-semibold cursor-pointer hover:text-secondary-foreground"
                          onClick={() => {
                            setTempTitle(selectedNote.title);
                            setIsEditingTitle(true);
                          }}
                        >
                          {selectedNote.title}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePin(selectedNote.id)}
                        >
                          {selectedNote.pinned ? (
                            <PinOff className="h-4 w-4" />
                          ) : (
                            <Pin className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(selectedNote.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="p-4 border-b">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4" />
                    <span className="text-sm font-medium">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {selectedNote.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                        <X 
                          className="h-3 w-3 ml-1 cursor-pointer" 
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag..."
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTag();
                      }}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleAddTag}>
                      Add
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4">
                  <Textarea
                    value={selectedNote.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Start typing your note..."
                    className="min-h-full resize-none border-none p-0 focus-visible:ring-0"
                  />
                </div>

                {/* Footer */}
                <div className="p-3 border-t text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>
                      Created: {selectedNote.createdAt.toLocaleDateString()}
                    </span>
                    <span>
                      Updated: {selectedNote.updatedAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a note to start editing</p>
                  <p className="text-sm">or create a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
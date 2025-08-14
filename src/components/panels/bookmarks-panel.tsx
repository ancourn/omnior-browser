/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Folder, 
  FolderOpen, 
  Star, 
  MoreVertical, 
  Edit,
  Trash2,
  Download,
  Upload,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useBookmarksStore } from '@/core/bookmarks/store';
import type { BookmarkItem, BookmarkFolder } from '@/core/common/models';

interface BookmarksPanelProps {
  service: any; // OmniorBookmarkService - will be properly typed when imported
}

export function BookmarksPanel({ service }: BookmarksPanelProps) {
  const { 
    folders, 
    items, 
    isLoading, 
    error, 
    searchQuery, 
    selectedFolderId,
    setFolders,
    setItems,
    setLoading,
    setError,
    setSearchQuery,
    setSelectedFolderId
  } = useBookmarksStore();

  const [showAddFolderDialog, setShowAddFolderDialog] = useState(false);
  const [showAddBookmarkDialog, setShowAddBookmarkDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newBookmark, setNewBookmark] = useState({ title: '', url: '', tags: '' });
  const [importText, setImportText] = useState('');

  const filteredItems = React.useMemo(() => {
    if (searchQuery) {
      return service.search(searchQuery);
    }
    return service.listItems(selectedFolderId);
  }, [items, searchQuery, selectedFolderId]);

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      service.createFolder(newFolderName.trim(), selectedFolderId || undefined);
      setNewFolderName('');
      setShowAddFolderDialog(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create folder');
    }
  };

  const handleAddBookmark = async () => {
    if (!newBookmark.title.trim() || !newBookmark.url.trim()) return;
    
    try {
      service.add({
        title: newBookmark.title.trim(),
        url: newBookmark.url.trim(),
        tags: newBookmark.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        folderId: selectedFolderId || undefined,
      });
      setNewBookmark({ title: '', url: '', tags: '' });
      setShowAddBookmarkDialog(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create bookmark');
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    
    try {
      setLoading(true);
      const result = await service.importNetscape(importText);
      setImportText('');
      setShowImportDialog(false);
      console.log(`Imported ${result.folders} folders and ${result.items} bookmarks`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to import bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const html = await service.exportNetscape();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bookmarks.html';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to export bookmarks');
    }
  };

  const handleDeleteBookmark = (id: string) => {
    service.remove(id);
  };

  const handleFolderClick = (folderId: string | null) => {
    setSelectedFolderId(folderId);
  };

  const buildFolderTree = (parentId?: string): BookmarkFolder[] => {
    return folders
      .filter(folder => folder.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const FolderTree = ({ folders, level = 0 }: { folders: BookmarkFolder[]; level?: number }) => (
    <div className="space-y-1">
      {folders.map(folder => {
        const subfolders = buildFolderTree(folder.id);
        const isSelected = selectedFolderId === folder.id;
        const hasChildren = subfolders.length > 0;
        
        return (
          <div key={folder.id}>
            <div
              className={`
                flex items-center gap-2 px-2 py-1 rounded cursor-pointer
                ${isSelected 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }
              `}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => handleFolderClick(folder.id)}
            >
              {hasChildren ? (
                <FolderOpen className="h-4 w-4 text-slate-500" />
              ) : (
                <Folder className="h-4 w-4 text-slate-500" />
              )}
              <span className="flex-1 text-sm truncate">{folder.name}</span>
              <Badge variant="secondary" className="text-xs">
                {service.listItems(folder.id).length}
              </Badge>
            </div>
            
            {hasChildren && (
              <FolderTree folders={subfolders} level={level + 1} />
            )}
          </div>
        );
      })}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
          <Button variant="outline" onClick={() => setError(null)}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Bookmarks</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-1" />
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Bookmarks</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Paste Netscape bookmark HTML format below
                  </p>
                  <textarea
                    className="w-full h-32 p-2 border border-slate-300 dark:border-slate-600 rounded text-sm"
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="<!DOCTYPE NETSCAPE-Bookmark-file-1>..."
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleImport} disabled={!importText.trim()}>
                      Import
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Folder tree */}
        <div className="w-64 border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
          <div className="p-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Folders</h3>
              <Dialog open={showAddFolderDialog} onOpenChange={setShowAddFolderDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Plus className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Folder</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Folder name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddFolderDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddFolder} disabled={!newFolderName.trim()}>
                        Create
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* All Bookmarks */}
            <div
              className={`
                flex items-center gap-2 px-2 py-1 rounded cursor-pointer mb-2
                ${selectedFolderId === null 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }
              `}
              onClick={() => handleFolderClick(null)}
            >
              <Star className="h-4 w-4 text-slate-500" />
              <span className="flex-1 text-sm">All Bookmarks</span>
              <Badge variant="secondary" className="text-xs">
                {service.listItems().length}
              </Badge>
            </div>
            
            {/* Folder tree */}
            <FolderTree folders={buildFolderTree()} />
          </div>
        </div>

        {/* Bookmarks list */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {selectedFolderId 
                  ? folders.find(f => f.id === selectedFolderId)?.name || 'Bookmarks'
                  : searchQuery 
                    ? `Search Results (${filteredItems.length})`
                    : 'All Bookmarks'
                }
              </h3>
              <Dialog open={showAddBookmarkDialog} onOpenChange={setShowAddBookmarkDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Bookmark
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Bookmark</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Title"
                      value={newBookmark.title}
                      onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
                    />
                    <Input
                      placeholder="URL"
                      value={newBookmark.url}
                      onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
                    />
                    <Input
                      placeholder="Tags (comma-separated)"
                      value={newBookmark.tags}
                      onChange={(e) => setNewBookmark({ ...newBookmark, tags: e.target.value })}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddBookmarkDialog(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddBookmark} 
                        disabled={!newBookmark.title.trim() || !newBookmark.url.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Bookmarks grid */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-slate-400">
                  {searchQuery ? 'No bookmarks found' : 'No bookmarks yet'}
                </p>
              </div>
            ) : (
              <div className="grid gap-2">
                {filteredItems.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    onDelete={() => handleDeleteBookmark(bookmark.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface BookmarkCardProps {
  bookmark: BookmarkItem;
  onDelete: () => void;
}

function BookmarkCard({ bookmark, onDelete }: BookmarkCardProps) {
  const [faviconUrl, setFaviconUrl] = useState<string>('');
  
  React.useEffect(() => {
    if (bookmark.url) {
      try {
        const url = new URL(bookmark.url);
        setFaviconUrl(`${url.origin}/favicon.ico`);
      } catch {
        setFaviconUrl('');
      }
    }
  }, [bookmark.url]);

  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex-shrink-0">
        {faviconUrl ? (
          <img 
            src={faviconUrl} 
            alt="" 
            className="w-8 h-8 rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
            <Star className="h-4 w-4 text-slate-500" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{bookmark.title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {bookmark.url}
        </p>
        {bookmark.tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {bookmark.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {bookmark.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{bookmark.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => window.open(bookmark.url, '_blank')}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.316C18.114 15.062 18 14.518 18 14c0-.482.114-.938.316-1.342m0 2.684a3 3 0 110-2.684M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Copy Link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
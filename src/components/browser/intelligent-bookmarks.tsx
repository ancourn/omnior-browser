/**
 * Intelligent Bookmark System
 * 
 * AI-powered bookmark management with automatic categorization,
 * smart suggestions, and usage-based organization
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, 
  Search, 
  FolderOpen, 
  Plus, 
  Tag, 
  Clock, 
  TrendingUp,
  Brain,
  BookOpen,
  Heart,
  Share2,
  Archive,
  Filter
} from 'lucide-react';

interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  folder?: string;
  tags: string[];
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  category?: string;
  importance: 'low' | 'medium' | 'high';
}

interface BookmarkSuggestion {
  id: string;
  url: string;
  title: string;
  reason: string;
  confidence: number;
}

interface IntelligentBookmarksProps {
  onBookmarkCreate?: (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'accessCount'>) => void;
  onBookmarkAccess?: (bookmarkId: string) => void;
}

export function IntelligentBookmarks({ onBookmarkCreate, onBookmarkAccess }: IntelligentBookmarksProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [suggestions, setSuggestions] = useState<BookmarkSuggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [newBookmark, setNewBookmark] = useState({
    url: '',
    title: '',
    tags: ''
  });
  const [sortBy, setSortBy] = useState<'recent' | 'frequent' | 'importance'>('recent');

  // Initialize with sample bookmarks
  useEffect(() => {
    const sampleBookmarks: Bookmark[] = [
      {
        id: '1',
        url: 'https://github.com',
        title: 'GitHub',
        favicon: '🐙',
        folder: 'Development',
        tags: ['coding', 'git', 'opensource'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        lastAccessed: new Date(Date.now() - 1000 * 60 * 30),
        accessCount: 45,
        category: 'Development',
        importance: 'high'
      },
      {
        id: '2',
        url: 'https://stackoverflow.com',
        title: 'Stack Overflow',
        favicon: '📚',
        folder: 'Development',
        tags: ['programming', 'help', 'qa'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
        lastAccessed: new Date(Date.now() - 1000 * 60 * 60 * 2),
        accessCount: 32,
        category: 'Development',
        importance: 'high'
      },
      {
        id: '3',
        url: 'https://youtube.com',
        title: 'YouTube',
        favicon: '📺',
        folder: 'Entertainment',
        tags: ['videos', 'music', 'entertainment'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
        lastAccessed: new Date(Date.now() - 1000 * 60 * 60 * 5),
        accessCount: 28,
        category: 'Entertainment',
        importance: 'medium'
      },
      {
        id: '4',
        url: 'https://news.ycombinator.com',
        title: 'Hacker News',
        favicon: '📰',
        folder: 'News',
        tags: ['tech', 'news', 'startup'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
        lastAccessed: new Date(Date.now() - 1000 * 60 * 60 * 1),
        accessCount: 18,
        category: 'News',
        importance: 'medium'
      },
      {
        id: '5',
        url: 'https://mdn.mozilla.org',
        title: 'MDN Web Docs',
        favicon: '📖',
        folder: 'Development',
        tags: ['documentation', 'web', 'reference'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
        lastAccessed: new Date(Date.now() - 1000 * 60 * 60 * 3),
        accessCount: 25,
        category: 'Development',
        importance: 'high'
      }
    ];
    setBookmarks(sampleBookmarks);
    generateSuggestions(sampleBookmarks);
  }, []);

  const generateSuggestions = (bookmarkData: Bookmark[]) => {
    const newSuggestions: BookmarkSuggestion[] = [
      {
        id: '1',
        url: 'https://dev.to',
        title: 'DEV Community',
        reason: 'Similar to your developer bookmarks',
        confidence: 0.92
      },
      {
        id: '2',
        url: 'https://css-tricks.com',
        title: 'CSS Tricks',
        reason: 'Web development resource you might like',
        confidence: 0.88
      },
      {
        id: '3',
        url: 'https://producthunt.com',
        title: 'Product Hunt',
        reason: 'Based on your tech interests',
        confidence: 0.85
      }
    ];
    setSuggestions(newSuggestions);
  };

  const filteredAndSortedBookmarks = bookmarks
    .filter(bookmark => {
      const matchesSearch = bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           bookmark.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFolder = activeFolder === 'all' || bookmark.folder === activeFolder;
      return matchesSearch && matchesFolder;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'frequent':
          return b.accessCount - a.accessCount;
        case 'importance':
          const importanceOrder = { high: 3, medium: 2, low: 1 };
          return importanceOrder[b.importance] - importanceOrder[a.importance];
        case 'recent':
        default:
          return b.lastAccessed.getTime() - a.lastAccessed.getTime();
      }
    });

  const folders = Array.from(new Set(bookmarks.map(b => b.folder).filter(Boolean)));
  const categories = Array.from(new Set(bookmarks.map(b => b.category).filter(Boolean)));
  const allTags = Array.from(new Set(bookmarks.flatMap(b => b.tags)));

  const handleCreateBookmark = () => {
    if (!newBookmark.url.trim() || !newBookmark.title.trim()) return;

    const bookmarkData: Omit<Bookmark, 'id' | 'createdAt' | 'accessCount'> = {
      url: newBookmark.url.startsWith('http') ? newBookmark.url : `https://${newBookmark.url}`,
      title: newBookmark.title,
      tags: newBookmark.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      lastAccessed: new Date(),
      importance: 'medium'
    };

    // AI-powered categorization
    const category = categorizeBookmark(bookmarkData);
    const folder = suggestFolder(bookmarkData);

    const newBookmarkObj: Bookmark = {
      ...bookmarkData,
      id: Date.now().toString(),
      createdAt: new Date(),
      accessCount: 0,
      category,
      folder
    };

    setBookmarks(prev => [newBookmarkObj, ...prev]);
    onBookmarkCreate?.(bookmarkData);
    
    setNewBookmark({ url: '', title: '', tags: '' });
    setIsCreating(false);
  };

  const categorizeBookmark = (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'accessCount'>): string => {
    const url = bookmark.url.toLowerCase();
    const title = bookmark.title.toLowerCase();
    const tags = bookmark.tags.map(tag => tag.toLowerCase());

    if (url.includes('github') || url.includes('stackoverflow') || url.includes('dev') || 
        tags.some(tag => tag.includes('code') || tag.includes('dev'))) {
      return 'Development';
    } else if (url.includes('youtube') || url.includes('netflix') || title.includes('video')) {
      return 'Entertainment';
    } else if (url.includes('news') || title.includes('news')) {
      return 'News';
    } else if (url.includes('google') || url.includes('search')) {
      return 'Search';
    } else {
      return 'General';
    }
  };

  const suggestFolder = (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'accessCount'>): string => {
    const category = categorizeBookmark(bookmark);
    return category;
  };

  const handleAccessBookmark = (bookmarkId: string) => {
    setBookmarks(prev => 
      prev.map(bookmark => 
        bookmark.id === bookmarkId 
          ? { 
              ...bookmark, 
              lastAccessed: new Date(), 
              accessCount: bookmark.accessCount + 1 
            }
          : bookmark
      )
    );
    onBookmarkAccess?.(bookmarkId);
  };

  const getImportanceColor = (importance: Bookmark['importance']) => {
    switch (importance) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
    }
  };

  const getImportanceIcon = (importance: Bookmark['importance']) => {
    switch (importance) {
      case 'high': return <Star className="h-4 w-4 text-red-600" />;
      case 'medium': return <Star className="h-4 w-4 text-yellow-600" />;
      case 'low': return <Star className="h-4 w-4 text-green-600" />;
    }
  };

  const BookmarkItem = ({ bookmark }: { bookmark: Bookmark }) => (
    <div
      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
      onClick={() => handleAccessBookmark(bookmark.id)}
    >
      <div className="flex items-center space-x-3">
        <div className="text-lg">{bookmark.favicon || '🔖'}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className="font-medium truncate">{bookmark.title}</h4>
            {getImportanceIcon(bookmark.importance)}
          </div>
          <p className="text-sm text-gray-500 truncate">{bookmark.url}</p>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {bookmark.folder}
            </Badge>
            {bookmark.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            <span className="text-xs text-gray-400">
              {bookmark.accessCount} visits
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="sm" variant="ghost">
          <Heart className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Intelligent Bookmarks</h3>
          <Badge variant="secondary">{bookmarks.length} bookmarks</Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-purple-100 text-purple-800">
            AI-Powered
          </Badge>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Bookmark
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Bookmark</DialogTitle>
                <DialogDescription>
                  Add a new bookmark with AI-powered categorization
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Enter URL"
                  value={newBookmark.url}
                  onChange={(e) => setNewBookmark(prev => ({ ...prev, url: e.target.value }))}
                />
                <Input
                  placeholder="Enter title"
                  value={newBookmark.title}
                  onChange={(e) => setNewBookmark(prev => ({ ...prev, title: e.target.value }))}
                />
                <Input
                  placeholder="Tags (comma-separated)"
                  value={newBookmark.tags}
                  onChange={(e) => setNewBookmark(prev => ({ ...prev, tags: e.target.value }))}
                />
                <Button onClick={handleCreateBookmark} className="w-full">
                  <Brain className="h-4 w-4 mr-2" />
                  Create with AI
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={activeFolder} onValueChange={setActiveFolder}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {folders.map(folder => (
              <TabsTrigger key={folder} value={folder}>
                {folder}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="recent">Recently Used</option>
          <option value="frequent">Most Frequent</option>
          <option value="importance">By Importance</option>
        </select>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{bookmarks.length}</div>
                <div className="text-xs text-muted-foreground">Total Bookmarks</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{folders.length}</div>
                <div className="text-xs text-muted-foreground">Folders</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {bookmarks.reduce((sum, b) => sum + b.accessCount, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Total Visits</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{suggestions.length}</div>
                <div className="text-xs text-muted-foreground">AI Suggestions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Bookmark Suggestions
          </CardTitle>
          <CardDescription>
            Intelligent recommendations based on your browsing patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  const newBookmark: Bookmark = {
                    id: Date.now().toString(),
                    url: suggestion.url,
                    title: suggestion.title,
                    lastAccessed: new Date(),
                    createdAt: new Date(),
                    accessCount: 0,
                    tags: [],
                    importance: 'medium'
                  };
                  setBookmarks(prev => [newBookmark, ...prev]);
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Brain className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium">{suggestion.title}</div>
                    <div className="text-sm text-muted-foreground">{suggestion.reason}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {Math.round(suggestion.confidence * 100)}%
                  </Badge>
                  <Button size="sm" variant="ghost">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bookmarks List */}
      <div className="space-y-4">
        {folders.map(folder => {
          const folderBookmarks = filteredAndSortedBookmarks.filter(b => b.folder === folder);
          if (folderBookmarks.length === 0) return null;

          return (
            <Card key={folder}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <FolderOpen className="h-5 w-5" />
                  <span>{folder}</span>
                  <Badge variant="secondary">{folderBookmarks.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {folderBookmarks.map(bookmark => (
                    <BookmarkItem key={bookmark.id} bookmark={bookmark} />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Uncategorized Bookmarks */}
      {filteredAndSortedBookmarks.filter(b => !b.folder).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Archive className="h-5 w-5" />
              <span>Uncategorized</span>
              <Badge variant="secondary">
                {filteredAndSortedBookmarks.filter(b => !b.folder).length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredAndSortedBookmarks
                .filter(b => !b.folder)
                .map(bookmark => (
                  <BookmarkItem key={bookmark.id} bookmark={bookmark} />
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
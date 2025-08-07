import React from 'react';
import { Star, ChevronRight } from 'lucide-react';
import { Bookmark } from '../../types';

interface BookmarksBarProps {
  onBookmarkClick: (url: string) => void;
}

export const BookmarksBar: React.FC<BookmarksBarProps> = ({ onBookmarkClick }) => {
  const [bookmarks, setBookmarks] = React.useState<Bookmark[]>([]);

  React.useEffect(() => {
    // Mock bookmarks data - in real implementation, this would come from the store
    const mockBookmarks: Bookmark[] = [
      {
        id: '1',
        title: 'GitHub',
        url: 'https://github.com',
        createdAt: Date.now()
      },
      {
        id: '2',
        title: 'Omnior Browser',
        url: 'https://omnior.browser',
        createdAt: Date.now()
      },
      {
        id: '3',
        title: 'Documentation',
        url: 'https://docs.omnior.browser',
        createdAt: Date.now()
      }
    ];
    setBookmarks(mockBookmarks);
  }, []);

  const handleBookmarkClick = (url: string) => {
    onBookmarkClick(url);
  };

  const getFaviconUrl = (url: string): string => {
    try {
      const parsedUrl = new URL(url);
      return `${parsedUrl.origin}/favicon.ico`;
    } catch {
      return '';
    }
  };

  const renderBookmark = (bookmark: Bookmark) => {
    if (bookmark.folder) {
      return (
        <div key={bookmark.id} className="bookmark-item">
          <Star className="w-3 h-3" />
          <span>{bookmark.title}</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      );
    }

    return (
      <div
        key={bookmark.id}
        className="bookmark-item"
        onClick={() => handleBookmarkClick(bookmark.url)}
        title={bookmark.title}
      >
        <img
          src={getFaviconUrl(bookmark.url)}
          alt=""
          className="w-3 h-3"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <span>{bookmark.title}</span>
      </div>
    );
  };

  return (
    <div className="bookmarks-bar">
      {bookmarks.map(renderBookmark)}
    </div>
  );
};
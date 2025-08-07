import React from 'react';
import { X, Star as StarIcon } from 'lucide-react';
import { Bookmark } from '../../types';

interface BookmarksModalProps {
  onClose: () => void;
  onNavigate: (url: string) => void;
}

export const BookmarksModal: React.FC<BookmarksModalProps> = ({
  onClose,
  onNavigate
}) => {
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
      },
      {
        id: 'toolbar',
        title: 'Bookmarks Toolbar',
        folder: true,
        children: [
          {
            id: '4',
            title: 'Google',
            url: 'https://google.com',
            parentId: 'toolbar',
            createdAt: Date.now()
          },
          {
            id: '5',
            title: 'YouTube',
            url: 'https://youtube.com',
            parentId: 'toolbar',
            createdAt: Date.now()
          }
        ],
        createdAt: Date.now()
      }
    ];
    setBookmarks(mockBookmarks);
  }, []);

  const handleBookmarkClick = (url: string) => {
    onNavigate(url);
    onClose();
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
        <div key={bookmark.id} className="mb-4">
          <h3 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-1">
            <StarIcon className="w-3 h-3" />
            {bookmark.title}
          </h3>
          <div className="ml-4">
            {bookmark.children?.map(child => renderBookmark(child))}
          </div>
        </div>
      );
    }

    return (
      <div
        key={bookmark.id}
        className="p-3 rounded-lg border border-border hover:bg-muted cursor-pointer transition-colors"
        onClick={() => bookmark.url && handleBookmarkClick(bookmark.url)}
      >
        <div className="flex items-center gap-3">
          {bookmark.url && (
            <img
              src={getFaviconUrl(bookmark.url)}
              alt=""
              className="w-4 h-4"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{bookmark.title}</h3>
            {bookmark.url && (
              <p className="text-sm text-muted-foreground truncate">{bookmark.url}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <StarIcon className="w-5 h-5" />
            Bookmarks
          </h2>
          <button onClick={onClose} className="btn btn-ghost p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="space-y-2">
            {bookmarks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No bookmarks available
              </p>
            ) : (
              bookmarks.map(renderBookmark)
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
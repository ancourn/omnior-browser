import React from 'react';
import { X, History as HistoryIcon } from 'lucide-react';
import { HistoryItem } from '../../types';

interface HistoryModalProps {
  onClose: () => void;
  onNavigate: (url: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  onClose,
  onNavigate
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [history, setHistory] = React.useState<HistoryItem[]>([]);

  React.useEffect(() => {
    // Mock history data - in real implementation, this would come from the store
    const mockHistory: HistoryItem[] = [
      {
        id: '1',
        title: 'GitHub - Where software is built',
        url: 'https://github.com',
        visitTime: Date.now() - 3600000,
        visitCount: 5
      },
      {
        id: '2',
        title: 'Omnior Browser - Next-Gen Web Browser',
        url: 'https://omnior.browser',
        visitTime: Date.now() - 7200000,
        visitCount: 3
      },
      {
        id: '3',
        title: 'Google',
        url: 'https://google.com',
        visitTime: Date.now() - 10800000,
        visitCount: 10
      }
    ];
    setHistory(mockHistory);
  }, []);

  const filteredHistory = React.useMemo(() => {
    if (!searchQuery) return history;
    
    const query = searchQuery.toLowerCase();
    return history.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.url.toLowerCase().includes(query)
    );
  }, [history, searchQuery]);

  const formatVisitTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  const handleHistoryItemClick = (url: string) => {
    onNavigate(url);
    onClose();
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all browsing history?')) {
      setHistory([]);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <HistoryIcon className="w-5 h-5" />
            History
          </h2>
          <button onClick={onClose} className="btn btn-ghost p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="modal-body">
          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full"
            />
          </div>

          {/* History List */}
          <div className="space-y-2">
            {filteredHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {searchQuery ? 'No matching history found' : 'No history available'}
              </p>
            ) : (
              filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-border hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => handleHistoryItemClick(item.url)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{item.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{item.url}</p>
                    </div>
                    <div className="text-xs text-muted-foreground ml-4">
                      {formatVisitTime(item.visitTime)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button
            onClick={handleClearHistory}
            className="btn btn-destructive"
            disabled={history.length === 0}
          >
            Clear History
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
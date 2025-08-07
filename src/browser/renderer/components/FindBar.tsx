import React, { useState, useEffect, useRef } from 'react';
import { X, Search, ArrowUp, ArrowDown } from 'lucide-react';

interface FindBarProps {
  onClose: () => void;
}

export const FindBar: React.FC<FindBarProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input when find bar opens
    inputRef.current?.focus();
    
    // Set up keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        if (e.shiftKey) {
          handlePrevious();
        } else {
          handleNext();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (!term) {
      setCurrentMatch(0);
      setTotalMatches(0);
      return;
    }

    // Mock search implementation
    // In a real implementation, this would search through the webview content
    const mockMatches = 3; // Mock number of matches
    setTotalMatches(mockMatches);
    setCurrentMatch(1);
  };

  const handleNext = () => {
    if (totalMatches === 0) return;
    setCurrentMatch(prev => prev >= totalMatches ? 1 : prev + 1);
  };

  const handlePrevious = () => {
    if (totalMatches === 0) return;
    setCurrentMatch(prev => prev <= 1 ? totalMatches : prev - 1);
  };

  return (
    <div className="find-bar">
      <Search className="w-4 h-4 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Find in page..."
        className="find-input w-48"
      />
      
      {searchTerm && (
        <>
          <span className="text-xs text-muted-foreground">
            {currentMatch} of {totalMatches}
          </span>
          <button
            onClick={handlePrevious}
            className="btn btn-ghost p-1"
            title="Previous match"
            disabled={totalMatches === 0}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="btn btn-ghost p-1"
            title="Next match"
            disabled={totalMatches === 0}
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </>
      )}
      
      <button
        onClick={onClose}
        className="btn btn-ghost p-1"
        title="Close find bar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
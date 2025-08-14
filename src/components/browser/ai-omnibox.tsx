/**
 * AI-Powered Omnibox - Next Generation Address Bar
 * 
 * Revolutionary address bar that combines Chrome's functionality 
 * with AI intelligence, predictive capabilities, and next-level features
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Star, 
  Clock, 
  Globe, 
  Calculator, 
  MapPin, 
  Cloud,
  Zap,
  Brain,
  TrendingUp,
  Command,
  X,
  ArrowRight,
  Bookmark,
  History
} from 'lucide-react';

interface OmniboxSuggestion {
  id: string;
  type: 'search' | 'url' | 'bookmark' | 'history' | 'calculation' | 'conversion' | 'weather' | 'ai_suggestion';
  title: string;
  url?: string;
  description: string;
  favicon?: string;
  confidence: number;
  ai_enhanced?: boolean;
  action?: () => void;
}

interface AIOmniboxProps {
  onNavigate?: (url: string) => void;
  onSearch?: (query: string) => void;
}

export function AIOmnibox({ onNavigate, onSearch }: AIOmniboxProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<OmniboxSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [aiProcessing, setAiProcessing] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Sample data
  const bookmarks = [
    { url: 'https://github.com', title: 'GitHub', favicon: '🐙' },
    { url: 'https://stackoverflow.com', title: 'Stack Overflow', favicon: '📚' },
    { url: 'https://youtube.com', title: 'YouTube', favicon: '📺' },
    { url: 'https://google.com', title: 'Google', favicon: '🔍' },
  ];

  const history = [
    { url: 'https://developer.mozilla.org', title: 'MDN Web Docs', favicon: '📖' },
    { url: 'https://news.ycombinator.com', title: 'Hacker News', favicon: '📰' },
    { url: 'https://github.com/trending', title: 'GitHub Trending', favicon: '📈' },
  ];

  // Handle input changes with AI processing
  const handleInputChange = useCallback(async (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);
    
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    setAiProcessing(true);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const newSuggestions: OmniboxSuggestion[] = [];

    // AI-Powered URL/Query Analysis
    const lowerValue = value.toLowerCase();

    // 1. Check if it's a calculation
    if (/^[\d+\-*/().\s]+$/.test(value)) {
      try {
        const result = eval(value);
        newSuggestions.push({
          id: 'calc',
          type: 'calculation',
          title: `${value} = ${result}`,
          description: 'AI Calculator',
          confidence: 1.0,
          ai_enhanced: true,
          action: () => {
            setQuery(result.toString());
            setShowSuggestions(false);
          }
        });
      } catch (e) {
        // Invalid calculation
      }
    }

    // 2. Check for unit conversions
    const conversionMatch = value.match(/(\d+(?:\.\d+)?)\s*(kg|lb|km|mi|c|f|m|ft)\s+(to|in)\s*(kg|lb|km|mi|c|f|m|ft)/i);
    if (conversionMatch) {
      const [, amount, fromUnit, , toUnit] = conversionMatch;
      const conversions: Record<string, number> = {
        'kg': 1, 'lb': 2.20462,
        'km': 1, 'mi': 0.621371,
        'c': 1, 'f': 33.8,
        'm': 1, 'ft': 3.28084
      };
      
      if (conversions[fromUnit] && conversions[toUnit]) {
        const result = (parseFloat(amount) / conversions[fromUnit]) * conversions[toUnit];
        newSuggestions.push({
          id: 'conversion',
          type: 'conversion',
          title: `${amount} ${fromUnit} = ${result.toFixed(2)} ${toUnit}`,
          description: 'AI Unit Conversion',
          confidence: 0.95,
          ai_enhanced: true
        });
      }
    }

    // 3. Check for weather queries
    if (lowerValue.includes('weather') || lowerValue.includes('temperature')) {
      newSuggestions.push({
        id: 'weather',
        type: 'weather',
        title: 'Weather in your location',
        description: '72°F, Partly Cloudy • AI Weather',
        confidence: 0.9,
        ai_enhanced: true,
        favicon: '🌤️'
      });
    }

    // 4. Check for map/location queries
    if (lowerValue.includes('map') || lowerValue.includes('directions') || lowerValue.includes('near me')) {
      newSuggestions.push({
        id: 'map',
        type: 'ai_suggestion',
        title: 'Open Google Maps',
        description: 'AI-powered location services',
        confidence: 0.85,
        ai_enhanced: true,
        favicon: '🗺️'
      });
    }

    // 5. Bookmark matching
    const matchingBookmarks = bookmarks.filter(bookmark =>
      bookmark.title.toLowerCase().includes(lowerValue) ||
      bookmark.url.toLowerCase().includes(lowerValue)
    ).map(bookmark => ({
      id: `bookmark-${bookmark.url}`,
      type: 'bookmark' as const,
      title: bookmark.title,
      url: bookmark.url,
      description: bookmark.url,
      favicon: bookmark.favicon,
      confidence: 0.8
    }));

    newSuggestions.push(...matchingBookmarks);

    // 6. History matching
    const matchingHistory = history.filter(item =>
      item.title.toLowerCase().includes(lowerValue) ||
      item.url.toLowerCase().includes(lowerValue)
    ).map(item => ({
      id: `history-${item.url}`,
      type: 'history' as const,
      title: item.title,
      url: item.url,
      description: item.url,
      favicon: item.favicon,
      confidence: 0.7
    }));

    newSuggestions.push(...matchingHistory);

    // 7. Search suggestions
    if (value.length > 2) {
      const searchSuggestions = [
        `${value} tutorial`,
        `${value} best practices`,
        `${value} examples`,
        `how to ${value}`,
        `${value} documentation`
      ].map((suggestion, index) => ({
        id: `search-${index}`,
        type: 'search' as const,
        title: suggestion,
        description: `Search for "${suggestion}"`,
        confidence: 0.6 - (index * 0.1),
        favicon: '🔍'
      }));

      newSuggestions.push(...searchSuggestions);
    }

    // 8. AI-Powered intelligent suggestions
    if (value.length > 3) {
      const aiSuggestions = generateAISuggestions(value);
      newSuggestions.push(...aiSuggestions);
    }

    // Sort by confidence and limit results
    newSuggestions.sort((a, b) => b.confidence - a.confidence);
    setSuggestions(newSuggestions.slice(0, 8));
    setShowSuggestions(true);
    setIsLoading(false);
    setAiProcessing(false);
  }, []);

  const generateAISuggestions = (query: string): OmniboxSuggestion[] => {
    const suggestions: OmniboxSuggestion[] = [];
    const lowerQuery = query.toLowerCase();

    // AI-powered contextual suggestions
    if (lowerQuery.includes('code') || lowerQuery.includes('programming')) {
      suggestions.push({
        id: 'ai-code',
        type: 'ai_suggestion',
        title: 'Open AI Code Assistant',
        description: 'Get AI help with your coding tasks',
        confidence: 0.92,
        ai_enhanced: true,
        favicon: '🤖'
      });
    }

    if (lowerQuery.includes('learn') || lowerQuery.includes('tutorial')) {
      suggestions.push({
        id: 'ai-learn',
        type: 'ai_suggestion',
        title: 'AI Learning Path',
        description: 'Personalized learning recommendations',
        confidence: 0.88,
        ai_enhanced: true,
        favicon: '🎓'
      });
    }

    if (lowerQuery.includes('news') || lowerQuery.includes('latest')) {
      suggestions.push({
        id: 'ai-news',
        type: 'ai_suggestion',
        title: 'AI News Summary',
        description: 'Get latest news summarized by AI',
        confidence: 0.85,
        ai_enhanced: true,
        favicon: '📰'
      });
    }

    return suggestions;
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else if (query.trim()) {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: OmniboxSuggestion) => {
    if (suggestion.action) {
      suggestion.action();
    } else if (suggestion.url) {
      onNavigate?.(suggestion.url);
    } else if (suggestion.type === 'search') {
      onSearch?.(suggestion.title);
    }
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  // Handle search
  const handleSearch = () => {
    if (!query.trim()) return;
    
    // Check if it's a URL
    const urlPattern = /^https?:\/\/.+/;
    if (urlPattern.test(query)) {
      onNavigate?.(query);
    } else {
      // Add https:// if it looks like a domain
      if (query.includes('.') && !query.includes(' ')) {
        onNavigate?.(query.startsWith('http') ? query : `https://${query}`);
      } else {
        onSearch?.(query);
      }
    }
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIconForType = (type: OmniboxSuggestion['type']) => {
    switch (type) {
      case 'bookmark': return <Bookmark className="h-4 w-4 text-yellow-600" />;
      case 'history': return <History className="h-4 w-4 text-blue-600" />;
      case 'calculation': return <Calculator className="h-4 w-4 text-green-600" />;
      case 'conversion': return <Zap className="h-4 w-4 text-purple-600" />;
      case 'weather': return <Cloud className="h-4 w-4 text-cyan-600" />;
      case 'ai_suggestion': return <Brain className="h-4 w-4 text-pink-600" />;
      default: return <Search className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* AI-Powered Omnibox */}
      <div className="relative">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              {getIconForType(query ? 'search' : 'url')}
              {aiProcessing && (
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              )}
            </div>
            
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => query && setShowSuggestions(true)}
              placeholder="Search or enter website name..."
              className="pl-12 pr-12 h-12 text-base shadow-lg border-2 focus:border-blue-500 rounded-full"
            />
            
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setQuery('');
                    setShowSuggestions(false);
                  }}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <Button
                onClick={handleSearch}
                disabled={!query.trim() || isLoading}
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* AI Enhancement Badge */}
        {query && (
          <div className="absolute -top-6 right-0">
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <Brain className="h-3 w-3 mr-1" />
              AI Enhanced
            </Badge>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 z-50 shadow-xl border-0 bg-white/95 backdrop-blur-sm"
        >
          <CardContent className="p-0">
            {/* AI Processing Indicator */}
            {aiProcessing && (
              <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center space-x-2">
                  <Brain className="h-4 w-4 text-blue-600 animate-pulse" />
                  <span className="text-sm font-medium text-blue-800">AI Processing...</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  {suggestions.length} suggestions
                </Badge>
              </div>
            )}

            {/* Suggestions List */}
            <div className="max-h-96 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  className={`flex items-center justify-between p-3 cursor-pointer transition-all hover:bg-gray-50 ${
                    index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {suggestion.favicon ? (
                        <span className="text-lg">{suggestion.favicon}</span>
                      ) : (
                        getIconForType(suggestion.type)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className={`font-medium truncate ${index === selectedIndex ? 'text-blue-900' : 'text-gray-900'}`}>
                          {suggestion.title}
                        </h4>
                        {suggestion.ai_enhanced && (
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                            AI
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{suggestion.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {Math.round(suggestion.confidence * 100)}%
                    </Badge>
                    {suggestion.type === 'bookmark' && <Star className="h-4 w-4 text-yellow-500" />}
                    {suggestion.type === 'history' && <Clock className="h-4 w-4 text-blue-500" />}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <Separator />
            <div className="p-3 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <span><kbd className="px-1 py-0.5 bg-white border rounded">↑↓</kbd> Navigate</span>
                  <span><kbd className="px-1 py-0.5 bg-white border rounded">Enter</kbd> Select</span>
                  <span><kbd className="px-1 py-0.5 bg-white border rounded">Esc</kbd> Close</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Brain className="h-3 w-3 text-purple-600" />
                  <span>AI-Powered</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
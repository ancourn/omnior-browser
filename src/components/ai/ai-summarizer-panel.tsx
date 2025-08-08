'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAI } from '@/hooks/use-ai';
import { SummaryResponse } from '@/lib/ai/ai-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  FileText, 
  Globe, 
  Copy, 
  RefreshCw, 
  Settings, 
  X,
  Loader2,
  Zap,
  MessageSquare,
  TrendingUp,
  Hash,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';

interface AISummarizerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
}

export function AISummarizerPanel({ isOpen, onClose, initialText = '' }: AISummarizerPanelProps) {
  const {
    isProcessing,
    error,
    settings,
    usage,
    summarize,
    quickSummarize,
    summarizePage,
    summarizeSelection,
    getProviders,
    getSummaryStyles,
    updateSettings,
    hasValidApiKey,
    canUseCloud,
    isLocalOnly,
    clearError
  } = useAI();

  const [inputText, setInputText] = useState(initialText);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(settings.defaultSummaryStyle);
  const [selectedProvider, setSelectedProvider] = useState(settings.defaultProvider);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [sourceType, setSourceType] = useState<'manual' | 'page' | 'selection'>('manual');
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Keyboard shortcut to toggle panel
  useKeyboardShortcut(['Control', 'Shift', 'KeyS'], () => {
    if (isOpen) {
      onClose();
    }
  });

  // Handle initial text
  useEffect(() => {
    if (initialText) {
      setInputText(initialText);
      if (initialText.length > 0) {
        handleSummarize();
      }
    }
  }, [initialText]);

  // Auto-detect source type based on text
  useEffect(() => {
    if (initialText) {
      setSourceType('manual');
    }
  }, [initialText]);

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      toast({
        title: "No text to summarize",
        description: "Please enter or select text to summarize.",
        variant: "destructive"
      });
      return;
    }

    clearError();
    
    const result = await summarize({
      text: inputText,
      style: selectedStyle,
      provider: selectedProvider
    });

    if (result) {
      setSummary(result);
      toast({
        title: "Summary generated",
        description: `Generated ${result.style} summary using ${result.provider}.`
      });
    }
  };

  const handleSummarizePage = async () => {
    clearError();
    
    const result = await summarizePage(selectedStyle);
    if (result) {
      setSummary(result);
      setInputText('Page content extracted and summarized');
      setSourceType('page');
      toast({
        title: "Page summarized",
        description: "Current page content has been summarized."
      });
    }
  };

  const handleSummarizeSelection = async () => {
    clearError();
    
    const result = await summarizeSelection(selectedStyle);
    if (result) {
      setSummary(result);
      setInputText('Selected text summarized');
      setSourceType('selection');
      toast({
        title: "Selection summarized",
        description: "Selected text has been summarized."
      });
    }
  };

  const handleFollowUp = async () => {
    if (!followUpQuestion.trim() || !summary) return;

    const result = await summarize({
      text: inputText,
      style: selectedStyle,
      provider: selectedProvider,
      followUpQuestion: followUpQuestion
    });

    if (result) {
      setSummary(result);
      setFollowUpQuestion('');
      toast({
        title: "Follow-up answered",
        description: "Your question has been addressed in the updated summary."
      });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Summary has been copied to your clipboard."
    });
  };

  const handleStyleChange = (style: string) => {
    setSelectedStyle(style);
    updateSettings({ defaultSummaryStyle: style });
  };

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    updateSettings({ defaultProvider: provider });
  };

  const providers = getProviders();
  const summaryStyles = getSummaryStyles();
  const currentStyle = summaryStyles.find(s => s.id === selectedStyle);
  const currentProvider = providers.find(p => p.id === selectedProvider);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative ml-auto h-full w-full max-w-4xl bg-background border-l shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <h2 className="text-lg font-semibold">AI Summarizer</h2>
            <Badge variant={canUseCloud() ? "default" : "secondary"} className="text-xs">
              {isLocalOnly() ? "Local Mode" : canUseCloud() ? "Cloud Ready" : "Usage Limit"}
            </Badge>
            {usage && (
              <Badge variant="outline" className="text-xs">
                {usage.dailyTokens.toLocaleString()} tokens today
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSummarizeSelection}
              title="Summarize selected text"
            >
              <FileText className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSummarizePage}
              title="Summarize current page"
            >
              <Globe className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex h-[calc(100%-60px)]">
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Controls */}
            <div className="p-4 border-b space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Style:</span>
                  <Select value={selectedStyle} onValueChange={handleStyleChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {summaryStyles.map(style => (
                        <SelectItem key={style.id} value={style.id}>
                          {style.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Provider:</span>
                  <Select value={selectedProvider} onValueChange={handleProviderChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map(provider => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                          {!hasValidApiKey(provider.id) && !provider.isLocal && (
                            <span className="text-xs text-destructive ml-2">(No API key)</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1" />

                <Button 
                  onClick={handleSummarize}
                  disabled={isProcessing || !inputText.trim()}
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Summarize
                </Button>
              </div>

              {currentStyle && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  <span>{currentStyle.description}</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Input/Output Area */}
            <div className="flex-1 flex flex-col">
              <Tabs defaultValue="input" className="h-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="input">Input Text</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                </TabsList>

                <TabsContent value="input" className="flex-1 p-4">
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {sourceType === 'manual' ? 'Manual Input' : 
                           sourceType === 'page' ? 'Page Content' : 'Selected Text'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {inputText.length} characters
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setInputText('');
                            setSourceType('manual');
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>

                    <Textarea
                      ref={inputRef}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Enter text to summarize, or use the buttons above to extract from page or selection..."
                      className="flex-1 resize-none"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="summary" className="flex-1 p-4">
                  <div className="h-full flex flex-col">
                    {summary ? (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{summary.style}</Badge>
                            <Badge variant="outline">{summary.provider}</Badge>
                            <Badge variant="outline" className="text-xs">
                              {summary.tokensUsed} tokens
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {summary.processingTime}ms
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(summary.summary)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSummary(null);
                                setFollowUpQuestion('');
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <ScrollArea className="flex-1">
                          <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-wrap">{summary.summary}</p>
                          </div>
                        </ScrollArea>

                        {/* Follow-up Questions */}
                        {summary.followUpSuggestions && summary.followUpSuggestions.length > 0 && (
                          <div className="mt-4 space-y-3">
                            <Separator />
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              <span className="text-sm font-medium">Follow-up Questions</span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {summary.followUpSuggestions.map((question, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setFollowUpQuestion(question)}
                                >
                                  {question}
                                </Button>
                              ))}
                            </div>

                            <div className="flex gap-2">
                              <Input
                                placeholder="Ask a follow-up question..."
                                value={followUpQuestion}
                                onChange={(e) => setFollowUpQuestion(e.target.value)}
                                className="flex-1"
                              />
                              <Button 
                                onClick={handleFollowUp}
                                disabled={!followUpQuestion.trim() || isProcessing}
                                size="sm"
                              >
                                Ask
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No summary yet</p>
                          <p className="text-sm">Enter text and click "Summarize" to get started</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Settings Sidebar */}
          {showSettings && (
            <div className="w-80 border-l flex flex-col">
              <div className="p-4 border-b">
                <h3 className="font-semibold mb-4">AI Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Privacy Mode</label>
                    <Select 
                      value={settings.privacyMode} 
                      onValueChange={(value: any) => updateSettings({ privacyMode: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Local Only</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="cloud">Cloud Preferred</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Max Tokens</label>
                    <Input
                      type="number"
                      value={settings.maxTokens}
                      onChange={(e) => updateSettings({ maxTokens: parseInt(e.target.value) })}
                      min={100}
                      max={4000}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Temperature</label>
                    <Input
                      type="number"
                      value={settings.temperature}
                      onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
                      min={0}
                      max={2}
                      step={0.1}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="autoSummarize"
                      checked={settings.autoSummarize}
                      onChange={(e) => updateSettings({ autoSummarize: e.target.checked })}
                    />
                    <label htmlFor="autoSummarize" className="text-sm">
                      Auto-summarize long pages
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-4 border-b">
                <h4 className="font-medium mb-3">Usage Statistics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Daily Tokens:</span>
                    <span>{usage.dailyTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Tokens:</span>
                    <span>{usage.totalTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Requests:</span>
                    <span>{usage.requests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Limit:</span>
                    <span>{canUseCloud() ? '100,000' : 'Local only'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t">
                <h4 className="font-medium mb-3">API Keys</h4>
                <div className="space-y-3">
                  {providers.filter(p => !p.isLocal).map(provider => (
                    <div key={provider.id}>
                      <label className="text-sm font-medium mb-1 block">
                        {provider.name} API Key
                      </label>
                      <Input
                        type="password"
                        placeholder="Enter API key..."
                        value={provider.apiKey || ''}
                        onChange={(e) => {
                          // This would be handled by the parent component in a real implementation
                          console.log(`API key for ${provider.id}:`, e.target.value);
                        }}
                      />
                      {!hasValidApiKey(provider.id) && (
                        <p className="text-xs text-destructive mt-1">
                          API key required for cloud features
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
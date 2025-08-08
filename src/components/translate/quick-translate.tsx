'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslate } from '@/hooks/use-translate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Languages, 
  RotateCcw, 
  Copy, 
  Volume2, 
  History, 
  Settings, 
  Globe,
  X,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';

interface QuickTranslateProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
}

export function QuickTranslate({ isOpen, onClose, initialText = '' }: QuickTranslateProps) {
  const {
    isTranslating,
    error,
    history,
    settings,
    providers,
    languages,
    translate,
    quickTranslate,
    detectLanguage,
    translateSelection,
    translatePage,
    updateSettings,
    clearHistory,
    deleteFromHistory,
    getLanguageByCode,
    getProviderById,
    swapLanguages,
    clearError
  } = useTranslate();

  const [inputText, setInputText] = useState(initialText);
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState(settings.defaultSourceLanguage);
  const [targetLanguage, setTargetLanguage] = useState(settings.defaultTargetLanguage);
  const [selectedProvider, setSelectedProvider] = useState(settings.defaultProvider);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Keyboard shortcut to toggle panel
  useKeyboardShortcut(['Control', 'KeyT'], () => {
    if (isOpen) {
      onClose();
    }
  });

  // Auto-translate when text changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputText.trim() && inputText !== initialText) {
        handleTranslate();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [inputText, sourceLanguage, targetLanguage, selectedProvider]);

  // Handle initial text
  useEffect(() => {
    if (initialText) {
      setInputText(initialText);
      handleTranslate();
    }
  }, [initialText]);

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setTranslatedText('');
      return;
    }

    clearError();
    setDetectedLanguage(null);

    try {
      const result = await translate({
        text: inputText,
        sourceLanguage: sourceLanguage === 'auto' ? 'auto' : sourceLanguage,
        targetLanguage,
        provider: selectedProvider
      });

      if (result) {
        setTranslatedText(result.translatedText);
        if (result.detectedLanguage && result.detectedLanguage !== sourceLanguage) {
          setDetectedLanguage(result.detectedLanguage);
        }
      }
    } catch (error) {
      console.error('Translation failed:', error);
    }
  };

  const handleTranslateSelection = async () => {
    const result = await translateSelection();
    if (result) {
      setInputText(result.sourceLanguage === 'auto' ? inputText : inputText);
      setTranslatedText(result.translatedText);
      setSourceLanguage(result.sourceLanguage);
      setTargetLanguage(result.targetLanguage);
    }
  };

  const handleTranslatePage = async () => {
    await translatePage();
    toast({
      title: "Page Translation",
      description: "Translating page content..."
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Text has been copied to your clipboard."
    });
  };

  const handleSwapLanguages = () => {
    swapLanguages();
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    
    // Swap input and translated text
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  const handleSpeak = (text: string, lang: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "Speech not supported",
        description: "Your browser does not support speech synthesis."
      });
    }
  };

  const handleClear = () => {
    setInputText('');
    setTranslatedText('');
    setDetectedLanguage(null);
    clearError();
  };

  const handleSaveSettings = () => {
    updateSettings({
      defaultSourceLanguage: sourceLanguage,
      defaultTargetLanguage: targetLanguage,
      defaultProvider: selectedProvider
    });
    setShowSettings(false);
    toast({
      title: "Settings saved",
      description: "Translation preferences have been saved."
    });
  };

  const sourceLang = getLanguageByCode(sourceLanguage === 'auto' ? 'en' : sourceLanguage);
  const targetLang = getLanguageByCode(targetLanguage);
  const detectedLang = detectedLanguage ? getLanguageByCode(detectedLanguage) : null;
  const provider = getProviderById(selectedProvider);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative ml-auto h-full w-full max-w-3xl bg-background border-l shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Quick Translate</h2>
            {provider && (
              <Badge variant="outline" className="text-xs">
                {provider.name}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTranslateSelection}
              title="Translate selected text"
            >
              Copy Selection
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTranslatePage}
              title="Translate entire page"
            >
              <Globe className="h-4 w-4 mr-2" />
              Translate Page
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4" />
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
            {/* Language Selector */}
            <div className="p-4 border-b flex items-center gap-2">
              <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto Detect</SelectItem>
                  {languages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="ghost" size="sm" onClick={handleSwapLanguages}>
                <RotateCcw className="h-4 w-4" />
              </Button>

              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex-1" />

              {isTranslating && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {error && (
                <div className="flex items-center gap-1 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Translation Area */}
            <div className="flex-1 flex flex-col">
              {/* Input */}
              <div className="flex-1 p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {sourceLanguage === 'auto' ? 'Auto Detect' : sourceLang?.name}
                    </span>
                    {detectedLang && (
                      <Badge variant="secondary" className="text-xs">
                        Detected: {detectedLang.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {inputText && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSpeak(inputText, detectedLanguage || sourceLanguage)}
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(inputText)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" onClick={handleClear}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Enter text to translate..."
                  className="min-h-full resize-none border-none p-0 focus-visible:ring-0"
                />
              </div>

              {/* Output */}
              <div className="flex-1 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {targetLang?.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {translatedText && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSpeak(translatedText, targetLanguage)}
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(translatedText)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="min-h-full p-3 bg-muted/30 rounded-lg">
                  {translatedText ? (
                    <p className="whitespace-pre-wrap">{translatedText}</p>
                  ) : (
                    <p className="text-muted-foreground">Translation will appear here...</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          {(showHistory || showSettings) && (
            <div className="w-80 border-l flex flex-col">
              {showHistory && (
                <>
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold">Translation History</h3>
                    <Button variant="ghost" size="sm" onClick={clearHistory}>
                      Clear All
                    </Button>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-3">
                      {history.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No translation history</p>
                        </div>
                      ) : (
                        history.map((item, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {item.sourceLanguage}
                                </Badge>
                                <span className="text-xs">→</span>
                                <Badge variant="outline" className="text-xs">
                                  {item.targetLanguage}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => deleteFromHistory(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm font-medium mb-1 line-clamp-2">
                              {item.translatedText}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {item.translatedText}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </>
              )}

              {showSettings && (
                <>
                  <div className="p-4 border-b">
                    <h3 className="font-semibold mb-4">Translation Settings</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Default Provider</label>
                        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {providers.map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Default Source Language</label>
                        <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto Detect</SelectItem>
                            {languages.map(lang => (
                              <SelectItem key={lang.code} value={lang.code}>
                                {lang.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Default Target Language</label>
                        <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {languages.map(lang => (
                              <SelectItem key={lang.code} value={lang.code}>
                                {lang.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="autoDetect"
                          checked={settings.autoDetectLanguage}
                          onChange={(e) => updateSettings({ autoDetectLanguage: e.target.checked })}
                        />
                        <label htmlFor="autoDetect" className="text-sm">
                          Auto-detect language
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t">
                    <Button onClick={handleSaveSettings} className="w-full">
                      <Check className="h-4 w-4 mr-2" />
                      Save Settings
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
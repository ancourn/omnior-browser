import React, { useState, useEffect } from 'react';
import { Languages, RotateCcw, Volume2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useBrowserStore } from '../store/browserStore';

interface TranslationManagerProps {
  tabId: string;
  className?: string;
}

const SUPPORTED_LANGUAGES = [
  { code: 'auto', name: 'Auto Detect', flag: '🌐' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
];

interface TranslationState {
  isTranslating: boolean;
  detectedLanguage: string | null;
  sourceLanguage: string;
  targetLanguage: string;
  translatedText: string | null;
  originalText: string;
}

export const TranslationManager: React.FC<TranslationManagerProps> = ({ tabId, className = '' }) => {
  const [showTranslator, setShowTranslator] = useState(false);
  const [translation, setTranslation] = useState<TranslationState>({
    isTranslating: false,
    detectedLanguage: null,
    sourceLanguage: 'auto',
    targetLanguage: 'en',
    translatedText: null,
    originalText: '',
  });
  const [copied, setCopied] = useState(false);
  
  const { tabs } = useBrowserStore();
  const tab = tabs.find(t => t.id === tabId);

  const detectLanguage = async (text: string): Promise<string> => {
    // Simulate language detection
    // In a real implementation, this would use a language detection API
    const patterns = {
      'es': /[ñáéíóúü]/i,
      'fr': /[àâäçéèêëïîôùûüÿœæ]/i,
      'de': /[äöüß]/i,
      'it': /[àèéìòù]/i,
      'pt': /[áàâãéêíóôõúüç]/i,
      'ru': /[а-я]/i,
      'ja': /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/,
      'ko': /[\uac00-\ud7af]/,
      'zh': /[\u4e00-\u9fff]/,
      'ar': /[\u0600-\u06ff]/,
      'hi': /[\u0900-\u097f]/,
      'th': /[\u0e00-\u0e7f]/,
      'vi': /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữýỳỵỷỹđ]/i,
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }
    
    return 'en'; // Default to English
  };

  const translateText = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
    // Simulate translation
    // In a real implementation, this would use a translation API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock translations for demonstration
    const mockTranslations: Record<string, Record<string, string>> = {
      'es': { 'en': 'Hello, how are you?', 'fr': 'Bonjour, comment allez-vous?' },
      'fr': { 'en': 'Hello, how are you?', 'es': 'Hola, ¿cómo estás?' },
      'de': { 'en': 'Hello, how are you?', 'fr': 'Bonjour, comment allez-vous?' },
      'en': { 'es': 'Hola, ¿cómo estás?', 'fr': 'Bonjour, comment allez-vous?' },
    };

    const key = `${sourceLang}-${targetLang}`;
    if (mockTranslations[key] && mockTranslations[key][targetLang]) {
      return mockTranslations[key][targetLang];
    }

    return `[Translated from ${sourceLang} to ${targetLang}]: ${text}`;
  };

  const handleTranslate = async () => {
    if (!tab || translation.isTranslating) return;

    // Get page content (simplified for demo)
    const pageText = "This is a sample text to demonstrate translation functionality.";
    
    setTranslation(prev => ({
      ...prev,
      isTranslating: true,
      originalText: pageText,
    }));

    try {
      // Detect language
      const detected = await detectLanguage(pageText);
      
      // Translate if source and target are different
      let translated: string | null = null;
      if (detected !== translation.targetLanguage) {
        translated = await translateText(pageText, detected, translation.targetLanguage);
      }

      setTranslation(prev => ({
        ...prev,
        isTranslating: false,
        detectedLanguage: detected,
        sourceLanguage: detected,
        translatedText: translated,
      }));
    } catch (error) {
      console.error('Translation failed:', error);
      setTranslation(prev => ({
        ...prev,
        isTranslating: false,
      }));
    }
  };

  const handleCopyTranslation = () => {
    if (translation.translatedText) {
      navigator.clipboard.writeText(translation.translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSpeakTranslation = () => {
    if (translation.translatedText && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(translation.translatedText);
      utterance.lang = translation.targetLanguage;
      speechSynthesis.speak(utterance);
    }
  };

  const handleLanguageChange = (type: 'source' | 'target', code: string) => {
    setTranslation(prev => ({
      ...prev,
      [type === 'source' ? 'sourceLanguage' : 'targetLanguage']: code,
      translatedText: null, // Reset translation when language changes
    }));
  };

  const swapLanguages = () => {
    setTranslation(prev => ({
      ...prev,
      sourceLanguage: prev.targetLanguage,
      targetLanguage: prev.sourceLanguage,
      translatedText: null,
    }));
  };

  const getLanguageInfo = (code: string) => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || SUPPORTED_LANGUAGES[1]; // Default to English
  };

  const sourceLangInfo = getLanguageInfo(translation.sourceLanguage);
  const targetLangInfo = getLanguageInfo(translation.targetLanguage);

  if (!tab) return null;

  return (
    <div className={`translation-manager ${className}`}>
      <DropdownMenu open={showTranslator} onOpenChange={setShowTranslator}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="translation-toggle"
            title="Translate Page"
          >
            <Languages className="w-4 h-4" />
            {translation.detectedLanguage && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {translation.detectedLanguage.toUpperCase()}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-80">
          <div className="p-3">
            <h4 className="font-medium mb-3">Page Translation</h4>
            
            {/* Language Selection */}
            <div className="flex items-center gap-2 mb-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    <span className="mr-1">{sourceLangInfo.flag}</span>
                    {sourceLangInfo.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => handleLanguageChange('source', lang.code)}
                      className="flex items-center gap-2"
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="ghost" size="sm" onClick={swapLanguages}>
                <RotateCcw className="w-4 h-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    <span className="mr-1">{targetLangInfo.flag}</span>
                    {targetLangInfo.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => handleLanguageChange('target', lang.code)}
                      className="flex items-center gap-2"
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Translation Button */}
            <Button
              onClick={handleTranslate}
              disabled={translation.isTranslating}
              className="w-full mb-3"
            >
              {translation.isTranslating ? (
                <>
                  <div className="spinner w-4 h-4 mr-2" />
                  Translating...
                </>
              ) : (
                <>
                  <Languages className="w-4 h-4 mr-2" />
                  Translate Page
                </>
              )}
            </Button>
            
            {/* Translation Result */}
            {translation.translatedText && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Translation:</div>
                <div className="p-2 bg-muted rounded text-sm">
                  {translation.translatedText}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyTranslation}
                    className="flex-1"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSpeakTranslation}
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Detection Result */}
            {translation.detectedLanguage && (
              <div className="text-xs text-muted-foreground mt-2">
                Detected language: {getLanguageInfo(translation.detectedLanguage).name}
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
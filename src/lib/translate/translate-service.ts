export interface TranslationProvider {
  id: string;
  name: string;
  endpoint?: string;
  apiKey?: string;
  isLocal: boolean;
  supportedLanguages: string[];
}

export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  provider: string;
}

export interface TranslationResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  provider: string;
  confidence?: number;
  detectedLanguage?: string;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export class TranslateService {
  private static STORAGE_KEY = 'omnior-translate-settings';
  
  // Default translation providers
  private static PROVIDERS: TranslationProvider[] = [
    {
      id: 'libretranslate',
      name: 'LibreTranslate',
      endpoint: 'https://libretranslate.de/translate',
      isLocal: false,
      supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar']
    },
    {
      id: 'local',
      name: 'Local Dictionary',
      isLocal: true,
      supportedLanguages: ['en', 'es', 'fr', 'de']
    }
  ];

  // Supported languages
  private static LANGUAGES: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' }
  ];

  // Local dictionary for basic translations (fallback)
  private static LOCAL_DICTIONARY: Record<string, Record<string, string>> = {
    en: {
      es: {
        'hello': 'hola',
        'goodbye': 'adiós',
        'thank you': 'gracias',
        'please': 'por favor',
        'yes': 'sí',
        'no': 'no',
        'good morning': 'buenos días',
        'good night': 'buenas noches',
        'how are you': 'cómo estás',
        'my name is': 'me llamo'
      },
      fr: {
        'hello': 'bonjour',
        'goodbye': 'au revoir',
        'thank you': 'merci',
        'please': 's\'il vous plaît',
        'yes': 'oui',
        'no': 'non',
        'good morning': 'bonjour',
        'good night': 'bonne nuit',
        'how are you': 'comment allez-vous',
        'my name is': 'je m\'appelle'
      },
      de: {
        'hello': 'hallo',
        'goodbye': 'auf wiedersehen',
        'thank you': 'danke',
        'please': 'bitte',
        'yes': 'ja',
        'no': 'nein',
        'good morning': 'guten morgen',
        'good night': 'gute nacht',
        'how are you': 'wie geht es dir',
        'my name is': 'ich heiße'
      }
    }
  };

  private settings: {
    defaultProvider: string;
    defaultSourceLanguage: string;
    defaultTargetLanguage: string;
    autoDetectLanguage: boolean;
    history: TranslationResponse[];
    maxHistoryItems: number;
  };

  constructor() {
    this.settings = this.loadSettings();
  }

  private loadSettings() {
    if (typeof window === 'undefined') {
      return {
        defaultProvider: 'libretranslate',
        defaultSourceLanguage: 'auto',
        defaultTargetLanguage: 'en',
        autoDetectLanguage: true,
        history: [],
        maxHistoryItems: 100
      };
    }

    try {
      const stored = localStorage.getItem(TranslateService.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading translation settings:', error);
    }

    return {
      defaultProvider: 'libretranslate',
      defaultSourceLanguage: 'auto',
      defaultTargetLanguage: 'en',
      autoDetectLanguage: true,
      history: [],
      maxHistoryItems: 100
    };
  }

  private saveSettings() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(TranslateService.STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving translation settings:', error);
    }
  }

  getProviders(): TranslationProvider[] {
    return TranslateService.PROVIDERS;
  }

  getLanguages(): Language[] {
    return TranslateService.LANGUAGES;
  }

  getSettings() {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<typeof this.settings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const provider = TranslateService.PROVIDERS.find(p => p.id === request.provider);
    if (!provider) {
      throw new Error(`Provider "${request.provider}" not found`);
    }

    let response: TranslationResponse;

    if (provider.isLocal) {
      response = await this.translateLocal(request);
    } else {
      response = await this.translateRemote(request, provider);
    }

    // Add to history
    this.addToHistory(response);

    return response;
  }

  private async translateLocal(request: TranslationRequest): Promise<TranslationResponse> {
    const { text, sourceLanguage, targetLanguage } = request;
    
    // Simple word-by-word translation using local dictionary
    const words = text.toLowerCase().split(' ');
    const translatedWords = words.map(word => {
      const sourceDict = TranslateService.LOCAL_DICTIONARY[sourceLanguage];
      if (sourceDict && sourceDict[targetLanguage]) {
        return sourceDict[targetLanguage][word] || word;
      }
      return word;
    });

    return {
      translatedText: translatedWords.join(' '),
      sourceLanguage,
      targetLanguage,
      provider: 'local',
      confidence: 0.7 // Local translations have lower confidence
    };
  }

  private async translateRemote(request: TranslationRequest, provider: TranslationProvider): Promise<TranslationResponse> {
    if (!provider.endpoint) {
      throw new Error(`Provider "${provider.name}" has no endpoint configured`);
    }

    try {
      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: request.text,
          source: request.sourceLanguage === 'auto' ? 'auto' : request.sourceLanguage,
          target: request.targetLanguage,
          format: 'text'
        })
      });

      if (!response.ok) {
        throw new Error(`Translation request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        translatedText: data.translatedText,
        sourceLanguage: data.detectedLanguage || request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        provider: provider.id,
        confidence: data.confidence,
        detectedLanguage: data.detectedLanguage
      };
    } catch (error) {
      console.error('Remote translation failed:', error);
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async detectLanguage(text: string): Promise<string> {
    // Simple language detection based on character patterns
    const patterns = {
      'zh': /[\u4e00-\u9fff]/,
      'ja': /[\u3040-\u309f\u30a0-\u30ff]/,
      'ko': /[\uac00-\ud7af]/,
      'ar': /[\u0600-\u06ff]/,
      'ru': /[\u0400-\u04ff]/,
      'es': /\b(el|la|de|en|con|por|para|que|un|una|y|o)\b/i,
      'fr': /\b(le|la|de|et|à|un|une|des|que|qui|dans)\b/i,
      'de': /\b(der|die|das|und|in|zu|den|von|mit|sich)\b/i,
      'it': /\b(il|lo|la|di|e|in|a|da|un|una|che)\b/i,
      'pt': /\b(o|a|de|e|em|um|uma|para|com|não|se)\b/i
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }

    return 'en'; // Default to English
  }

  private addToHistory(response: TranslationResponse) {
    this.settings.history.unshift(response);
    
    // Limit history size
    if (this.settings.history.length > this.settings.maxHistoryItems) {
      this.settings.history = this.settings.history.slice(0, this.settings.maxHistoryItems);
    }

    this.saveSettings();
  }

  getHistory(): TranslationResponse[] {
    return [...this.settings.history];
  }

  clearHistory() {
    this.settings.history = [];
    this.saveSettings();
  }

  deleteFromHistory(index: number) {
    this.settings.history.splice(index, 1);
    this.saveSettings();
  }

  // Context menu integration
  createContextMenuItem(): chrome.contextMenus.CreateProperties {
    return {
      id: 'omnior-translate-selection',
      title: 'Translate Selection',
      contexts: ['selection']
    };
  }

  // Page translation
  async translatePage(targetLanguage: string): Promise<void> {
    if (typeof window === 'undefined') return;

    // This would be implemented in a browser extension context
    // For now, we'll just translate the visible text content
    const textNodes = this.getTextNodes(document.body);
    
    for (const node of textNodes) {
      const originalText = node.textContent || '';
      if (originalText.trim().length > 0) {
        try {
          const response = await this.translate({
            text: originalText,
            sourceLanguage: 'auto',
            targetLanguage,
            provider: this.settings.defaultProvider
          });
          
          node.textContent = response.translatedText;
        } catch (error) {
          console.error('Failed to translate page content:', error);
        }
      }
    }
  }

  private getTextNodes(element: Node): Text[] {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (parent && ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }

    return textNodes;
  }
}
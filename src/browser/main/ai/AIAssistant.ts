import { BrowserWindow, ipcMain, webContents } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import ZAI from 'z-ai-web-dev-sdk';

export interface AIAssistantConfig {
  enabled: boolean;
  autoSummarize: boolean;
  languageDetection: boolean;
  contentAnalysis: boolean;
  personalizedShortcuts: boolean;
  privacyMode: boolean;
  maxTokens: number;
  temperature: number;
}

export interface AIPrompt {
  id: string;
  type: 'summarize' | 'translate' | 'analyze' | 'explain' | 'custom';
  content: string;
  context?: string;
  language?: string;
  targetLanguage?: string;
  timestamp: number;
}

export interface AIResponse {
  id: string;
  promptId: string;
  content: string;
  confidence: number;
  timestamp: number;
  metadata?: {
    language?: string;
    wordCount?: number;
    readingTime?: number;
    keyPoints?: string[];
    sentiment?: 'positive' | 'neutral' | 'negative';
  };
}

export interface PersonalizedShortcut {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  frequency: number;
  lastUsed: number;
  enabled: boolean;
}

export class AIAssistant {
  private config: AIAssistantConfig;
  private zai: ZAI | null = null;
  private prompts: Map<string, AIPrompt> = new Map();
  private responses: Map<string, AIResponse> = new Map();
  private shortcuts: Map<string, PersonalizedShortcut> = new Map();
  private assistantWindow: BrowserWindow | null = null;
  private userDataPath: string;

  constructor(userDataPath: string) {
    this.userDataPath = userDataPath;
    this.config = {
      enabled: true,
      autoSummarize: true,
      languageDetection: true,
      contentAnalysis: true,
      personalizedShortcuts: true,
      privacyMode: false,
      maxTokens: 1000,
      temperature: 0.7
    };
    this.initialize();
  }

  private async initialize() {
    try {
      await this.loadConfig();
      await this.loadShortcuts();
      await this.initializeZAI();
      this.setupIPCHandlers();
    } catch (error) {
      console.error('Failed to initialize AI Assistant:', error);
    }
  }

  private async initializeZAI() {
    try {
      this.zai = await ZAI.create();
      console.log('AI Assistant initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ZAI:', error);
      this.config.enabled = false;
    }
  }

  private async loadConfig() {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const configPath = path.join(this.userDataPath, 'ai-assistant-config.json');
      
      if (fs.existsSync(configPath)) {
        const data = fs.readFileSync(configPath, 'utf-8');
        const saved = JSON.parse(data);
        this.config = { ...this.config, ...saved };
      }
    } catch (error) {
      console.error('Failed to load AI config:', error);
    }
  }

  private async saveConfig() {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const configPath = path.join(this.userDataPath, 'ai-assistant-config.json');
      
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save AI config:', error);
    }
  }

  private async loadShortcuts() {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const shortcutsPath = path.join(this.userDataPath, 'ai-shortcuts.json');
      
      if (fs.existsSync(shortcutsPath)) {
        const data = fs.readFileSync(shortcutsPath, 'utf-8');
        const saved = JSON.parse(data);
        
        if (Array.isArray(saved)) {
          for (const shortcut of saved) {
            this.shortcuts.set(shortcut.id, shortcut);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load AI shortcuts:', error);
    }
  }

  private async saveShortcuts() {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const shortcutsPath = path.join(this.userDataPath, 'ai-shortcuts.json');
      
      const shortcuts = Array.from(this.shortcuts.values());
      fs.writeFileSync(shortcutsPath, JSON.stringify(shortcuts, null, 2));
    } catch (error) {
      console.error('Failed to save AI shortcuts:', error);
    }
  }

  private setupIPCHandlers() {
    // Configuration
    ipcMain.handle('ai-get-config', async () => {
      return this.config;
    });

    ipcMain.handle('ai-update-config', async (event, newConfig: Partial<AIAssistantConfig>) => {
      this.config = { ...this.config, ...newConfig };
      await this.saveConfig();
      return this.config;
    });

    // Assistant window
    ipcMain.handle('ai-open-assistant', async () => {
      return await this.openAssistant();
    });

    ipcMain.handle('ai-close-assistant', async () => {
      return await this.closeAssistant();
    });

    // AI Processing
    ipcMain.handle('ai-summarize', async (event, content: string, context?: string) => {
      return await this.summarizeContent(content, context);
    });

    ipcMain.handle('ai-translate', async (event, content: string, targetLanguage: string, sourceLanguage?: string) => {
      return await this.translateContent(content, targetLanguage, sourceLanguage);
    });

    ipcMain.handle('ai-analyze', async (event, content: string, analysisType: string) => {
      return await this.analyzeContent(content, analysisType);
    });

    ipcMain.handle('ai-explain', async (event, content: string, context?: string) => {
      return await this.explainContent(content, context);
    });

    ipcMain.handle('ai-custom-prompt', async (event, prompt: string, context?: string) => {
      return await this.processCustomPrompt(prompt, context);
    });

    // Shortcuts
    ipcMain.handle('ai-get-shortcuts', async () => {
      return Array.from(this.shortcuts.values());
    });

    ipcMain.handle('ai-add-shortcut', async (event, shortcut: Omit<PersonalizedShortcut, 'id' | 'frequency' | 'lastUsed'>) => {
      return await this.addShortcut(shortcut);
    });

    ipcMain.handle('ai-update-shortcut', async (event, id: string, updates: Partial<PersonalizedShortcut>) => {
      return await this.updateShortcut(id, updates);
    });

    ipcMain.handle('ai-delete-shortcut', async (event, id: string) => {
      return await this.deleteShortcut(id);
    });

    ipcMain.handle('ai-trigger-shortcut', async (event, trigger: string) => {
      return await this.triggerShortcut(trigger);
    });

    // History
    ipcMain.handle('ai-get-history', async (event, limit?: number) => {
      return await this.getHistory(limit);
    });

    ipcMain.handle('ai-clear-history', async () => {
      return await this.clearHistory();
    });
  }

  public async openAssistant(): Promise<boolean> {
    if (this.assistantWindow && !this.assistantWindow.isDestroyed()) {
      this.assistantWindow.focus();
      return true;
    }

    try {
      const { BrowserWindow } = await import('electron');
      const path = await import('path');
      
      this.assistantWindow = new BrowserWindow({
        width: 600,
        height: 800,
        minWidth: 400,
        minHeight: 500,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: true,
          preload: path.join(__dirname, '../../renderer/preload.js')
        },
        title: 'AI Assistant',
        show: false
      });

      await this.assistantWindow.loadFile(path.join(__dirname, '../../renderer/ai-assistant.html'));

      this.assistantWindow.once('ready-to-show', () => {
        this.assistantWindow?.show();
      });

      this.assistantWindow.on('closed', () => {
        this.assistantWindow = null;
      });

      return true;
    } catch (error) {
      console.error('Failed to open AI Assistant:', error);
      return false;
    }
  }

  public async closeAssistant(): Promise<boolean> {
    if (this.assistantWindow && !this.assistantWindow.isDestroyed()) {
      this.assistantWindow.close();
      this.assistantWindow = null;
      return true;
    }
    return false;
  }

  public async summarizeContent(content: string, context?: string): Promise<AIResponse | null> {
    if (!this.zai || !this.config.enabled) {
      return null;
    }

    try {
      const promptId = uuidv4();
      const prompt: AIPrompt = {
        id: promptId,
        type: 'summarize',
        content,
        context,
        timestamp: Date.now()
      };

      this.prompts.set(promptId, prompt);

      const systemPrompt = `You are an AI assistant integrated into a web browser. Your task is to summarize the provided web content accurately and concisely.
      
      Guidelines:
      - Create a comprehensive summary that captures the main points
      - Keep the summary under 200 words unless the content is very complex
      - Highlight key information and insights
      - Maintain objectivity and accuracy
      - If the content is technical, ensure technical accuracy
      
      ${context ? `Context: ${context}` : ''}
      
      Content to summarize:`;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: content.substring(0, 4000) // Limit content length
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      });

      const responseContent = completion.choices[0]?.message?.content || '';
      
      const response: AIResponse = {
        id: uuidv4(),
        promptId,
        content: responseContent,
        confidence: 0.85, // Mock confidence score
        timestamp: Date.now(),
        metadata: {
          wordCount: responseContent.split(' ').length,
          readingTime: Math.ceil(responseContent.split(' ').length / 200),
          keyPoints: this.extractKeyPoints(responseContent),
          sentiment: this.analyzeSentiment(responseContent)
        }
      };

      this.responses.set(response.id, response);
      return response;
    } catch (error) {
      console.error('Failed to summarize content:', error);
      return null;
    }
  }

  public async translateContent(content: string, targetLanguage: string, sourceLanguage?: string): Promise<AIResponse | null> {
    if (!this.zai || !this.config.enabled) {
      return null;
    }

    try {
      const promptId = uuidv4();
      const prompt: AIPrompt = {
        id: promptId,
        type: 'translate',
        content,
        language: sourceLanguage,
        targetLanguage,
        timestamp: Date.now()
      };

      this.prompts.set(promptId, prompt);

      const systemPrompt = `You are a professional translator. Translate the following text from ${sourceLanguage || 'auto-detected language'} to ${targetLanguage}.
      
      Requirements:
      - Maintain the original meaning and tone
      - Keep cultural context appropriate
      - Preserve formatting and structure
      - If technical terms exist, use appropriate translations
      - Do not translate URLs, email addresses, or code snippets
      
      Text to translate:`;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: content.substring(0, 4000)
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: 0.3 // Lower temperature for more consistent translations
      });

      const responseContent = completion.choices[0]?.message?.content || '';
      
      const response: AIResponse = {
        id: uuidv4(),
        promptId,
        content: responseContent,
        confidence: 0.90,
        timestamp: Date.now(),
        metadata: {
          language: targetLanguage,
          wordCount: responseContent.split(' ').length
        }
      };

      this.responses.set(response.id, response);
      return response;
    } catch (error) {
      console.error('Failed to translate content:', error);
      return null;
    }
  }

  public async analyzeContent(content: string, analysisType: string): Promise<AIResponse | null> {
    if (!this.zai || !this.config.enabled) {
      return null;
    }

    try {
      const promptId = uuidv4();
      const prompt: AIPrompt = {
        id: promptId,
        type: 'analyze',
        content,
        timestamp: Date.now()
      };

      this.prompts.set(promptId, prompt);

      let systemPrompt = '';
      switch (analysisType) {
        case 'sentiment':
          systemPrompt = 'Analyze the sentiment of the following text. Provide a detailed analysis including emotional tone, positivity/negativity score, and key emotional indicators.';
          break;
        case 'keywords':
          systemPrompt = 'Extract and analyze the main keywords and topics from the following text. Provide relevance scores and categorize the keywords.';
          break;
        case 'readability':
          systemPrompt = 'Analyze the readability of the following text. Provide scores for complexity, reading level, and suggestions for improvement.';
          break;
        case 'structure':
          systemPrompt = 'Analyze the structure and organization of the following text. Identify main sections, logical flow, and structural strengths/weaknesses.';
          break;
        default:
          systemPrompt = 'Provide a comprehensive analysis of the following text, including its main themes, writing style, and key characteristics.';
      }

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: content.substring(0, 4000)
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      });

      const responseContent = completion.choices[0]?.message?.content || '';
      
      const response: AIResponse = {
        id: uuidv4(),
        promptId,
        content: responseContent,
        confidence: 0.80,
        timestamp: Date.now(),
        metadata: {
          wordCount: responseContent.split(' ').length,
          readingTime: Math.ceil(responseContent.split(' ').length / 200)
        }
      };

      this.responses.set(response.id, response);
      return response;
    } catch (error) {
      console.error('Failed to analyze content:', error);
      return null;
    }
  }

  public async explainContent(content: string, context?: string): Promise<AIResponse | null> {
    if (!this.zai || !this.config.enabled) {
      return null;
    }

    try {
      const promptId = uuidv4();
      const prompt: AIPrompt = {
        id: promptId,
        type: 'explain',
        content,
        context,
        timestamp: Date.now()
      };

      this.prompts.set(promptId, prompt);

      const systemPrompt = `You are an expert explainer. Your task is to explain the following content in a clear, understandable way.
      
      Requirements:
      - Break down complex concepts into simple terms
      - Use analogies and examples when helpful
      - Maintain accuracy while simplifying
      - Structure the explanation logically
      - Address potential confusion points
      
      ${context ? `Additional Context: ${context}` : ''}
      
      Content to explain:`;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: content.substring(0, 4000)
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: 0.5
      });

      const responseContent = completion.choices[0]?.message?.content || '';
      
      const response: AIResponse = {
        id: uuidv4(),
        promptId,
        content: responseContent,
        confidence: 0.85,
        timestamp: Date.now(),
        metadata: {
          wordCount: responseContent.split(' ').length,
          readingTime: Math.ceil(responseContent.split(' ').length / 200)
        }
      };

      this.responses.set(response.id, response);
      return response;
    } catch (error) {
      console.error('Failed to explain content:', error);
      return null;
    }
  }

  public async processCustomPrompt(prompt: string, context?: string): Promise<AIResponse | null> {
    if (!this.zai || !this.config.enabled) {
      return null;
    }

    try {
      const promptId = uuidv4();
      const promptObj: AIPrompt = {
        id: promptId,
        type: 'custom',
        content: prompt,
        context,
        timestamp: Date.now()
      };

      this.prompts.set(promptId, promptObj);

      const systemPrompt = `You are an AI assistant integrated into a web browser. Help the user with their request while being helpful, accurate, and concise.
      
      ${context ? `Context: ${context}` : ''}
      
      User's request:`;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      });

      const responseContent = completion.choices[0]?.message?.content || '';
      
      const response: AIResponse = {
        id: uuidv4(),
        promptId,
        content: responseContent,
        confidence: 0.75,
        timestamp: Date.now(),
        metadata: {
          wordCount: responseContent.split(' ').length,
          readingTime: Math.ceil(responseContent.split(' ').length / 200)
        }
      };

      this.responses.set(response.id, response);
      return response;
    } catch (error) {
      console.error('Failed to process custom prompt:', error);
      return null;
    }
  }

  private async addShortcut(shortcut: Omit<PersonalizedShortcut, 'id' | 'frequency' | 'lastUsed'>): Promise<PersonalizedShortcut> {
    const newShortcut: PersonalizedShortcut = {
      id: uuidv4(),
      ...shortcut,
      frequency: 0,
      lastUsed: Date.now()
    };

    this.shortcuts.set(newShortcut.id, newShortcut);
    await this.saveShortcuts();
    return newShortcut;
  }

  private async updateShortcut(id: string, updates: Partial<PersonalizedShortcut>): Promise<boolean> {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut) return false;

    Object.assign(shortcut, updates);
    await this.saveShortcuts();
    return true;
  }

  private async deleteShortcut(id: string): Promise<boolean> {
    const deleted = this.shortcuts.delete(id);
    if (deleted) {
      await this.saveShortcuts();
    }
    return deleted;
  }

  private async triggerShortcut(trigger: string): Promise<string | null> {
    const shortcut = Array.from(this.shortcuts.values()).find(s => s.trigger === trigger && s.enabled);
    if (!shortcut) return null;

    // Update usage statistics
    shortcut.frequency++;
    shortcut.lastUsed = Date.now();
    await this.saveShortcuts();

    // Execute the shortcut action
    const response = await this.processCustomPrompt(shortcut.action);
    return response ? response.content : null;
  }

  private async getHistory(limit: number = 50): Promise<AIResponse[]> {
    const responses = Array.from(this.responses.values());
    return responses
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  private async clearHistory(): Promise<boolean> {
    this.prompts.clear();
    this.responses.clear();
    return true;
  }

  private extractKeyPoints(content: string): string[] {
    // Simple key point extraction - in a real implementation, this would use more sophisticated NLP
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.slice(0, 3).map(s => s.trim());
  }

  private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    // Simple sentiment analysis - in a real implementation, this would use proper NLP
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'positive'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'negative', 'poor', 'worst'];
    
    const words = content.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  public async learnFromUserBehavior(action: string, context: string): Promise<void> {
    if (!this.config.personalizedShortcuts) return;

    // Analyze user behavior and potentially create new shortcuts
    // This is a simplified version - real implementation would be more sophisticated
    const commonActions = [
      { pattern: 'summarize', action: 'Summarize the current page' },
      { pattern: 'translate', action: 'Translate this content' },
      { pattern: 'explain', action: 'Explain this concept' }
    ];

    for (const { pattern, action } of commonActions) {
      if (action.toLowerCase().includes(pattern)) {
        const existingShortcut = Array.from(this.shortcuts.values())
          .find(s => s.action.includes(pattern));
        
        if (!existingShortcut) {
          await this.addShortcut({
            name: `${pattern.charAt(0).toUpperCase() + pattern.slice(1)} Shortcut`,
            description: `Quick ${pattern} action`,
            trigger: `/${pattern}`,
            action: action,
            enabled: true
          });
        }
      }
    }
  }

  public getConfig(): AIAssistantConfig {
    return this.config;
  }

  public async updateConfig(newConfig: Partial<AIAssistantConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfig();
  }

  public getStats(): {
    totalPrompts: number;
    totalResponses: number;
    totalShortcuts: number;
    enabledShortcuts: number;
    averageConfidence: number;
  } {
    const responses = Array.from(this.responses.values());
    const shortcuts = Array.from(this.shortcuts.values());
    
    return {
      totalPrompts: this.prompts.size,
      totalResponses: responses.length,
      totalShortcuts: shortcuts.length,
      enabledShortcuts: shortcuts.filter(s => s.enabled).length,
      averageConfidence: responses.length > 0 
        ? responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length 
        : 0
    };
  }
}
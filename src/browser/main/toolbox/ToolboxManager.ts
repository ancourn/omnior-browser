import { BrowserWindow, ipcMain, Menu } from 'electron';
import { v4 as uuidv4 } from 'uuid';

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: 'developer' | 'designer' | 'student' | 'writer' | 'security' | 'productivity';
  icon: string;
  version: string;
  enabled: boolean;
  shortcut?: string;
  permissions: string[];
  windowOptions?: Electron.BrowserWindowConstructorOptions;
}

export interface ToolInstance {
  id: string;
  toolId: string;
  window: BrowserWindow;
  createdAt: number;
  lastAccessed: number;
}

export class ToolboxManager {
  private tools: Map<string, Tool> = new Map();
  private toolInstances: Map<string, ToolInstance> = new Map();
  private toolboxWindow: BrowserWindow | null = null;
  private toolsPath: string;

  constructor(toolsPath: string) {
    this.toolsPath = toolsPath;
    this.initialize();
  }

  private async initialize() {
    await this.loadBuiltinTools();
    this.setupIPCHandlers();
    this.setupToolboxMenu();
  }

  private async loadBuiltinTools() {
    // Register all built-in tools
    const builtinTools: Tool[] = [
      {
        id: 'screenshot',
        name: 'Smart Screenshot Tool',
        description: 'Capture, annotate, and export screenshots with advanced features',
        category: 'designer',
        icon: '📸',
        version: '1.0.0',
        enabled: true,
        shortcut: 'CmdOrCtrl+Shift+S',
        permissions: ['screen', 'clipboard', 'filesystem']
      },
      {
        id: 'color-picker',
        name: 'Color Picker',
        description: 'Extract colors from web pages and generate color palettes',
        category: 'designer',
        icon: '🎨',
        version: '1.0.0',
        enabled: true,
        shortcut: 'CmdOrCtrl+Shift+C',
        permissions: ['dom', 'clipboard']
      },
      {
        id: 'json-viewer',
        name: 'JSON & XML Viewer',
        description: 'View and validate JSON/XML with tree and raw views',
        category: 'developer',
        icon: '📄',
        version: '1.0.0',
        enabled: true,
        permissions: ['dom', 'clipboard']
      },
      {
        id: 'regex-tester',
        name: 'Regex Tester',
        description: 'Test regular expressions with live matching and explanations',
        category: 'developer',
        icon: '🔍',
        version: '1.0.0',
        enabled: true,
        permissions: ['dom']
      },
      {
        id: 'code-runner',
        name: 'Code Snippet Runner',
        description: 'HTML/CSS/JS playground with live preview',
        category: 'developer',
        icon: '💻',
        version: '1.0.0',
        enabled: true,
        shortcut: 'CmdOrCtrl+Shift+R',
        permissions: ['dom', 'sandbox']
      },
      {
        id: 'markdown',
        name: 'Markdown Editor',
        description: 'Write and preview Markdown with live rendering',
        category: 'writer',
        icon: '📝',
        version: '1.0.0',
        enabled: true,
        shortcut: 'CmdOrCtrl+Shift+M',
        permissions: ['filesystem', 'clipboard']
      },
      {
        id: 'quick-notes',
        name: 'Quick Notes',
        description: 'Encrypted local note-taking with search and organization',
        category: 'productivity',
        icon: '📋',
        version: '1.0.0',
        enabled: true,
        shortcut: 'CmdOrCtrl+Shift+N',
        permissions: ['storage', 'encryption']
      },
      {
        id: 'password-generator',
        name: 'Password Generator',
        description: 'Generate secure passwords with strength analysis',
        category: 'security',
        icon: '🔐',
        version: '1.0.0',
        enabled: true,
        permissions: ['clipboard']
      },
      {
        id: 'performance-profiler',
        name: 'Performance Profiler',
        description: 'Analyze website performance with Lighthouse-style metrics',
        category: 'developer',
        icon: '⚡',
        version: '1.0.0',
        enabled: true,
        permissions: ['network', 'dom', 'performance']
      },
      {
        id: 'form-filler',
        name: 'Auto Form Filler',
        description: 'Secure form filling with customizable profiles',
        category: 'productivity',
        icon: '📝',
        version: '1.0.0',
        enabled: true,
        permissions: ['dom', 'storage', 'encryption']
      }
    ];

    // Register all tools
    for (const tool of builtinTools) {
      this.tools.set(tool.id, tool);
    }
  }

  private setupIPCHandlers() {
    // Toolbox management
    ipcMain.handle('open-toolbox', async () => {
      return await this.openToolbox();
    });

    ipcMain.handle('close-toolbox', async () => {
      return await this.closeToolbox();
    });

    ipcMain.handle('get-tools', async () => {
      return Array.from(this.tools.values());
    });

    ipcMain.handle('get-tool', async (event, toolId: string) => {
      return this.tools.get(toolId) || null;
    });

    ipcMain.handle('toggle-tool', async (event, toolId: string) => {
      return await this.toggleTool(toolId);
    });

    // Tool instance management
    ipcMain.handle('open-tool', async (event, toolId: string) => {
      return await this.openTool(toolId);
    });

    ipcMain.handle('close-tool', async (event, instanceId: string) => {
      return await this.closeTool(instanceId);
    });

    ipcMain.handle('get-tool-instances', async () => {
      return Array.from(this.toolInstances.values());
    });

    ipcMain.handle('get-tool-instance', async (event, instanceId: string) => {
      return this.toolInstances.get(instanceId) || null;
    });

    // Tool categories
    ipcMain.handle('get-tools-by-category', async (event, category: string) => {
      return Array.from(this.tools.values()).filter(tool => tool.category === category);
    });

    ipcMain.handle('get-tool-categories', async () => {
      const categories = new Set(Array.from(this.tools.values()).map(tool => tool.category));
      return Array.from(categories);
    });
  }

  private setupToolboxMenu() {
    const template = [
      {
        label: 'Tools',
        submenu: [
          {
            label: 'Open Toolbox',
            accelerator: 'CmdOrCtrl+Shift+T',
            click: () => this.openToolbox()
          },
          { type: 'separator' },
          {
            label: 'Smart Screenshot Tool',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: () => this.openTool('screenshot')
          },
          {
            label: 'Color Picker',
            accelerator: 'CmdOrCtrl+Shift+C',
            click: () => this.openTool('color-picker')
          },
          {
            label: 'Code Snippet Runner',
            accelerator: 'CmdOrCtrl+Shift+R',
            click: () => this.openTool('code-runner')
          },
          {
            label: 'Markdown Editor',
            accelerator: 'CmdOrCtrl+Shift+M',
            click: () => this.openTool('markdown')
          },
          {
            label: 'Quick Notes',
            accelerator: 'CmdOrCtrl+Shift+N',
            click: () => this.openTool('quick-notes')
          },
          { type: 'separator' },
          {
            label: 'More Tools...',
            click: () => this.openToolbox()
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template as any);
    Menu.setApplicationMenu(menu);
  }

  public async openToolbox(): Promise<boolean> {
    if (this.toolboxWindow && !this.toolboxWindow.isDestroyed()) {
      this.toolboxWindow.focus();
      return true;
    }

    try {
      const { BrowserWindow } = await import('electron');
      
      this.toolboxWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 600,
        minHeight: 400,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          enableRemoteModule: false,
          webSecurity: true,
          preload: (await import('path')).join(__dirname, '../../renderer/preload.js')
        },
        title: 'Omnior Toolbox',
        show: false
      });

      await this.toolboxWindow.loadFile((await import('path')).join(__dirname, '../../renderer/toolbox.html'));

      this.toolboxWindow.once('ready-to-show', () => {
        this.toolboxWindow?.show();
      });

      this.toolboxWindow.on('closed', () => {
        this.toolboxWindow = null;
      });

      return true;
    } catch (error) {
      console.error('Failed to open toolbox:', error);
      return false;
    }
  }

  public async closeToolbox(): Promise<boolean> {
    if (this.toolboxWindow && !this.toolboxWindow.isDestroyed()) {
      this.toolboxWindow.close();
      this.toolboxWindow = null;
      return true;
    }
    return false;
  }

  public async openTool(toolId: string): Promise<string | null> {
    const tool = this.tools.get(toolId);
    if (!tool || !tool.enabled) {
      return null;
    }

    try {
      const instanceId = uuidv4();
      const { BrowserWindow } = await import('electron');
      
      const windowOptions: Electron.BrowserWindowConstructorOptions = {
        width: 800,
        height: 600,
        minWidth: 400,
        minHeight: 300,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          enableRemoteModule: false,
          webSecurity: true,
          sandbox: tool.permissions.includes('sandbox'),
          preload: (await import('path')).join(__dirname, '../../renderer/preload.js')
        },
        title: tool.name,
        show: false,
        ...tool.windowOptions
      };

      const window = new BrowserWindow(windowOptions);

      // Load tool-specific HTML file
      const toolPath = (await import('path')).join(__dirname, `../../renderer/tools/${toolId}.html`);
      await window.loadFile(toolPath);

      const instance: ToolInstance = {
        id: instanceId,
        toolId: toolId,
        window: window,
        createdAt: Date.now(),
        lastAccessed: Date.now()
      };

      this.toolInstances.set(instanceId, instance);

      window.once('ready-to-show', () => {
        window.show();
      });

      window.on('closed', () => {
        this.toolInstances.delete(instanceId);
      });

      window.on('focus', () => {
        const instance = this.toolInstances.get(instanceId);
        if (instance) {
          instance.lastAccessed = Date.now();
        }
      });

      // Send tool data to renderer
      window.webContents.once('dom-ready', () => {
        window.webContents.send('tool-initialized', {
          tool: tool,
          instanceId: instanceId,
          permissions: tool.permissions
        });
      });

      return instanceId;
    } catch (error) {
      console.error(`Failed to open tool ${toolId}:`, error);
      return null;
    }
  }

  public async closeTool(instanceId: string): Promise<boolean> {
    const instance = this.toolInstances.get(instanceId);
    if (!instance) return false;

    try {
      if (!instance.window.isDestroyed()) {
        instance.window.close();
      }
      this.toolInstances.delete(instanceId);
      return true;
    } catch (error) {
      console.error(`Failed to close tool instance ${instanceId}:`, error);
      return false;
    }
  }

  public async toggleTool(toolId: string): Promise<boolean> {
    const tool = this.tools.get(toolId);
    if (!tool) return false;

    tool.enabled = !tool.enabled;
    return tool.enabled;
  }

  public getTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  public getTool(toolId: string): Tool | null {
    return this.tools.get(toolId) || null;
  }

  public getToolInstances(): ToolInstance[] {
    return Array.from(this.toolInstances.values());
  }

  public getToolsByCategory(category: string): Tool[] {
    return Array.from(this.tools.values()).filter(tool => tool.category === category);
  }

  public getToolCategories(): string[] {
    const categories = new Set(Array.from(this.tools.values()).map(tool => tool.category));
    return Array.from(categories);
  }

  public registerTool(tool: Tool): boolean {
    if (this.tools.has(tool.id)) {
      return false;
    }
    this.tools.set(tool.id, tool);
    return true;
  }

  public unregisterTool(toolId: string): boolean {
    return this.tools.delete(toolId);
  }

  public async closeAllTools(): Promise<void> {
    const closePromises = Array.from(this.toolInstances.keys()).map(instanceId => 
      this.closeTool(instanceId)
    );
    await Promise.all(closePromises);
  }

  public getToolStats(): {
    totalTools: number;
    enabledTools: number;
    activeInstances: number;
    categories: string[];
  } {
    const tools = Array.from(this.tools.values());
    const categories = this.getToolCategories();

    return {
      totalTools: tools.length,
      enabledTools: tools.filter(t => t.enabled).length,
      activeInstances: this.toolInstances.size,
      categories: categories
    };
  }
}
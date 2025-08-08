import { 
  Extension, 
  ExtensionManifest, 
  ExtensionPermission, 
  SandboxEnvironment,
  SandboxConfig,
  SecurityPolicy,
  ExtensionError,
  SecurityError,
  PermissionError,
  SandboxError
} from './types'

export class ExtensionSandbox {
  private sandboxes: Map<string, SandboxEnvironment> = new Map()
  private securityPolicy: SecurityPolicy
  private config: SandboxConfig

  constructor(config: SandboxConfig = {}) {
    this.config = {
      allowedOrigins: [],
      allowedPermissions: [],
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB
      maxExecutionTime: 5000, // 5 seconds
      enableConsole: true,
      enableNetwork: true,
      ...config
    }

    this.securityPolicy = {
      allowedAPIs: [
        'chrome.runtime',
        'chrome.storage',
        'chrome.tabs',
        'chrome.notifications',
        'chrome.alarms'
      ],
      blockedAPIs: [
        'eval',
        'Function',
        'GeneratorFunction',
        'AsyncFunction',
        'fetch',
        'XMLHttpRequest',
        'WebSocket',
        'Worker',
        'SharedWorker',
        'ServiceWorker',
        'importScripts'
      ],
      contentSecurityPolicy: [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "connect-src 'self'",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'"
      ].join('; '),
      sandboxAttributes: [
        'allow-scripts',
        'allow-same-origin'
      ]
    }
  }

  /**
   * Create a new sandbox environment for an extension
   */
  async createSandbox(extension: Extension): Promise<SandboxEnvironment> {
    try {
      // Validate extension permissions
      this.validatePermissions(extension.permissions)

      // Create isolated iframe
      const iframe = document.createElement('iframe')
      iframe.sandbox = this.securityPolicy.sandboxAttributes.join(' ')
      iframe.style.display = 'none'
      iframe.srcdoc = this.createSandboxHTML(extension)
      
      document.body.appendChild(iframe)

      // Wait for iframe to load
      await new Promise((resolve, reject) => {
        iframe.onload = resolve
        iframe.onerror = () => reject(new ExtensionError('Failed to load sandbox', extension.id))
      })

      const isolatedWindow = iframe.contentWindow!
      if (!isolatedWindow) {
        throw new ExtensionError('Failed to access sandbox window', extension.id)
      }

      // Set up message channel for communication
      const messageChannel = new MessageChannel()
      
      // Create extension context
      const context = this.createExtensionContext(extension, messageChannel.port1)

      // Initialize sandbox environment
      const sandbox: SandboxEnvironment = {
        id: `sandbox-${extension.id}-${Date.now()}`,
        extension,
        context,
        isolatedWindow,
        messageChannel,
        eventListeners: new Map(),
        isDestroyed: false
      }

      // Inject security controls
      this.injectSecurityControls(isolatedWindow, extension)

      // Set up communication
      this.setupCommunication(sandbox)

      // Store sandbox
      this.sandboxes.set(extension.id, sandbox)

      console.log(`Sandbox created for extension: ${extension.name} (${extension.id})`)
      return sandbox
    } catch (error) {
      console.error(`Failed to create sandbox for extension ${extension.id}:`, error)
      throw error
    }
  }

  /**
   * Destroy a sandbox environment
   */
  async destroySandbox(extensionId: string): Promise<void> {
    const sandbox = this.sandboxes.get(extensionId)
    if (!sandbox) {
      throw new ExtensionError(`Sandbox not found for extension: ${extensionId}`)
    }

    try {
      // Clean up event listeners
      sandbox.eventListeners.clear()

      // Close message channel
      sandbox.messageChannel.port1.close()
      sandbox.messageChannel.port2.close()

      // Remove iframe
      const iframe = sandbox.isolatedWindow.frameElement
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe)
      }

      // Mark as destroyed
      sandbox.isDestroyed = true

      // Remove from sandboxes map
      this.sandboxes.delete(extensionId)

      console.log(`Sandbox destroyed for extension: ${extensionId}`)
    } catch (error) {
      console.error(`Failed to destroy sandbox for extension ${extensionId}:`, error)
      throw error
    }
  }

  /**
   * Execute code in sandbox with security controls
   */
  async executeInSandbox<T>(
    extensionId: string, 
    code: string, 
    context: Record<string, any> = {}
  ): Promise<T> {
    const sandbox = this.sandboxes.get(extensionId)
    if (!sandbox || sandbox.isDestroyed) {
      throw new ExtensionError(`Sandbox not found or destroyed for extension: ${extensionId}`)
    }

    // Validate code for security
    this.validateCode(code)

    // Set execution timeout
    const timeoutId = setTimeout(() => {
      throw new SandboxError(`Execution timeout for extension: ${extensionId}`, extensionId)
    }, this.config.maxExecutionTime)

    try {
      // Send execution request to sandbox
      const message = {
        type: 'EXECUTE_CODE',
        code,
        context,
        timestamp: Date.now()
      }

      sandbox.messageChannel.port1.postMessage(message)

      // Wait for response
      const response = await new Promise<T>((resolve, reject) => {
        const handler = (event: MessageEvent) => {
          if (event.data.type === 'EXECUTION_RESULT') {
            sandbox.messageChannel.port1.removeEventListener('message', handler)
            clearTimeout(timeoutId)
            
            if (event.data.error) {
              reject(new ExtensionError(event.data.error, extensionId))
            } else {
              resolve(event.data.result)
            }
          }
        }
        
        sandbox.messageChannel.port1.addEventListener('message', handler)
      })

      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * Validate extension permissions against security policy
   */
  private validatePermissions(permissions: ExtensionPermission[]): void {
    const dangerousPermissions = [
      'debugger',
      'nativeMessaging',
      'proxy',
      'webRequestBlocking'
    ]

    for (const permission of permissions) {
      if (dangerousPermissions.includes(permission)) {
        throw new SecurityError(`Dangerous permission not allowed: ${permission}`)
      }
    }
  }

  /**
   * Validate code for security violations
   */
  private validateCode(code: string): void {
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /importScripts\s*\(/,
      /\.createElement\s*\(\s*['"]script['"]\s*\)/,
      /\.innerHTML\s*=/,
      /\.outerHTML\s*=/,
      /document\.write\s*\(/,
      /window\.location\s*=/,
      /window\.top\s*=/,
      /window\.parent\s*=/,
      /self\s*=/,
      /globalThis\s*=/
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        throw new SecurityError(`Code contains dangerous pattern: ${pattern}`)
      }
    }
  }

  /**
   * Create sandbox HTML content
   */
  private createSandboxHTML(extension: Extension): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta http-equiv="Content-Security-Policy" content="${this.securityPolicy.contentSecurityPolicy}">
          <title>Extension Sandbox: ${extension.name}</title>
          <script>
            // Sandbox security controls
            window.__SANDBOX_ID__ = '${extension.id}';
            window.__EXTENSION_ID__ = extension.id;
            
            // Block dangerous APIs
            (() => {
              const blocked = ${JSON.stringify(this.securityPolicy.blockedAPIs)};
              blocked.forEach(api => {
                try {
                  if (window[api]) {
                    Object.defineProperty(window, api, {
                      value: undefined,
                      writable: false,
                      configurable: false
                    });
                  }
                } catch (e) {
                  console.warn('Failed to block API:', api, e);
                }
              });
            })();
            
            // Safe console implementation
            if (${this.config.enableConsole}) {
              const originalConsole = {
                log: console.log,
                warn: console.warn,
                error: console.error,
                info: console.info,
                debug: console.debug
              };
              
              console.log = (...args) => {
                originalConsole.log('[Extension]', ...args);
                parent.postMessage({
                  type: 'CONSOLE_LOG',
                  args: args,
                  timestamp: Date.now()
                }, '*');
              };
              
              console.warn = (...args) => {
                originalConsole.warn('[Extension]', ...args);
                parent.postMessage({
                  type: 'CONSOLE_WARN',
                  args: args,
                  timestamp: Date.now()
                }, '*');
              };
              
              console.error = (...args) => {
                originalConsole.error('[Extension]', ...args);
                parent.postMessage({
                  type: 'CONSOLE_ERROR',
                  args: args,
                  timestamp: Date.now()
                }, '*');
              };
            } else {
              console.log = console.warn = console.error = console.info = console.debug = () => {};
            }
          </script>
        </head>
        <body>
          <script>
            // Wait for parent to establish communication
            window.addEventListener('message', (event) => {
              if (event.data.type === 'INITIALIZE_SANDBOX') {
                const port = event.ports[0];
                window.__SANDBOX_PORT__ = port;
                
                port.addEventListener('message', (messageEvent) => {
                  const message = messageEvent.data;
                  
                  switch (message.type) {
                    case 'EXECUTE_CODE':
                      try {
                        const result = new Function('context', 'chrome', message.code)(message.context, window.chrome);
                        port.postMessage({
                          type: 'EXECUTION_RESULT',
                          result: result,
                          timestamp: Date.now()
                        });
                      } catch (error) {
                        port.postMessage({
                          type: 'EXECUTION_RESULT',
                          error: error.message,
                          timestamp: Date.now()
                        });
                      }
                      break;
                  }
                });
                
                port.start();
                
                // Signal ready
                port.postMessage({
                  type: 'SANDBOX_READY',
                  timestamp: Date.now()
                });
              }
            });
          </script>
        </body>
      </html>
    `
  }

  /**
   * Create extension context with safe APIs
   */
  private createExtensionContext(extension: Extension, port: MessagePort): any {
    return {
      id: extension.id,
      permissions: extension.permissions,
      sendMessage: (message: any) => {
        port.postMessage({
          type: 'EXTENSION_MESSAGE',
          message,
          timestamp: Date.now()
        })
        return Promise.resolve()
      },
      storage: this.createStorageAPI(extension),
      runtime: this.createRuntimeAPI(extension),
      tabs: this.createTabsAPI(extension),
      notifications: this.createNotificationsAPI(extension),
      alarms: this.createAlarmsAPI(extension)
    }
  }

  /**
   * Inject security controls into sandbox window
   */
  private injectSecurityControls(window: Window, extension: Extension): void {
    // Monitor memory usage
    if (window.performance && window.performance.memory) {
      setInterval(() => {
        const memory = window.performance.memory
        if (memory.usedJSHeapSize > this.config.maxMemoryUsage) {
          throw new SandboxError(`Memory limit exceeded for extension: ${extension.id}`, extension.id)
        }
      }, 1000)
    }

    // Block direct DOM access
    Object.defineProperty(window, 'document', {
      get: () => {
        throw new SecurityError('Direct DOM access is not allowed in sandbox', extension.id)
      }
    })

    Object.defineProperty(window, 'window', {
      get: () => {
        throw new SecurityError('Direct window access is not allowed in sandbox', extension.id)
      }
    })
  }

  /**
   * Set up communication between sandbox and browser
   */
  private setupCommunication(sandbox: SandboxEnvironment): void {
    // Initialize sandbox
    sandbox.isolatedWindow.postMessage({
      type: 'INITIALIZE_SANDBOX'
    }, '*', [sandbox.messageChannel.port2])

    // Handle messages from sandbox
    sandbox.messageChannel.port1.addEventListener('message', (event) => {
      const message = event.data

      switch (message.type) {
        case 'SANDBOX_READY':
          console.log(`Sandbox ready for extension: ${sandbox.extension.id}`)
          break
        case 'CONSOLE_LOG':
          console.log(`[${sandbox.extension.name}]`, ...message.args)
          break
        case 'CONSOLE_WARN':
          console.warn(`[${sandbox.extension.name}]`, ...message.args)
          break
        case 'CONSOLE_ERROR':
          console.error(`[${sandbox.extension.name}]`, ...message.args)
          break
        case 'EXTENSION_MESSAGE':
          this.handleExtensionMessage(sandbox, message.message)
          break
      }
    })

    sandbox.messageChannel.port1.start()
  }

  /**
   * Handle messages from extension sandbox
   */
  private handleExtensionMessage(sandbox: SandboxEnvironment, message: any): void {
    // Route message to appropriate handler based on type
    console.log(`Message from extension ${sandbox.extension.id}:`, message)
    
    // Implement message routing logic here
    // This would connect to the actual browser APIs
  }

  /**
   * Create safe storage API
   */
  private createStorageAPI(extension: Extension): any {
    return {
      local: this.createStorageArea(extension, 'local'),
      sync: this.createStorageArea(extension, 'sync'),
      managed: this.createStorageArea(extension, 'managed')
    }
  }

  /**
   * Create storage area
   */
  private createStorageArea(extension: Extension, area: string): any {
    return {
      get: async (keys?: any) => {
        // Implement storage retrieval with permission checks
        return {}
      },
      set: async (items: any) => {
        // Implement storage setting with permission checks
      },
      remove: async (keys: any) => {
        // Implement storage removal with permission checks
      },
      clear: async () => {
        // Implement storage clearing with permission checks
      },
      getBytesInUse: async (keys?: any) => {
        // Implement storage size calculation
        return 0
      }
    }
  }

  /**
   * Create runtime API
   */
  private createRuntimeAPI(extension: Extension): any {
    return {
      id: extension.id,
      getURL: (path: string) => `chrome-extension://${extension.id}/${path}`,
      getManifest: () => extension.manifest,
      reload: () => {
        // Implement extension reload
      },
      requestUpdateCheck: async () => {
        // Implement update check
      },
      connect: (extensionId?: string) => {
        // Implement port connection
        return null
      },
      sendMessage: async (extensionId: string, message: any) => {
        // Implement message sending
      }
    }
  }

  /**
   * Create tabs API
   */
  private createTabsAPI(extension: Extension): any {
    if (!extension.permissions.includes('tabs')) {
      throw new PermissionError('tabs permission not granted', extension.id)
    }

    return {
      create: async (createProperties: any) => {
        // Implement tab creation with permission checks
        return {}
      },
      query: async (queryInfo: any) => {
        // Implement tab query with permission checks
        return []
      },
      update: async (tabId: number, updateProperties: any) => {
        // Implement tab update with permission checks
        return {}
      },
      remove: async (tabIds: any) => {
        // Implement tab removal with permission checks
      },
      executeScript: async (tabId: number, details: any) => {
        // Implement script execution with permission checks
        return []
      },
      insertCSS: async (tabId: number, details: any) => {
        // Implement CSS insertion with permission checks
      }
    }
  }

  /**
   * Create notifications API
   */
  private createNotificationsAPI(extension: Extension): any {
    if (!extension.permissions.includes('notifications')) {
      throw new PermissionError('notifications permission not granted', extension.id)
    }

    return {
      create: (id: string, options: any) => {
        // Implement notification creation
      },
      update: async (id: string, options: any) => {
        // Implement notification update
        return false
      },
      clear: async (id: string) => {
        // Implement notification clearing
        return false
      },
      getAll: async () => {
        // Implement getting all notifications
        return []
      }
    }
  }

  /**
   * Create alarms API
   */
  private createAlarmsAPI(extension: Extension): any {
    if (!extension.permissions.includes('alarms')) {
      throw new PermissionError('alarms permission not granted', extension.id)
    }

    return {
      create: (name: string, alarmInfo: any) => {
        // Implement alarm creation
      },
      get: async (name?: string) => {
        // Implement alarm retrieval
        return []
      },
      clear: async (name?: string) => {
        // Implement alarm clearing
        return false
      },
      getAll: async () => {
        // Implement getting all alarms
        return []
      }
    }
  }

  /**
   * Get sandbox by extension ID
   */
  getSandbox(extensionId: string): SandboxEnvironment | undefined {
    return this.sandboxes.get(extensionId)
  }

  /**
   * Get all active sandboxes
   */
  getAllSandboxes(): SandboxEnvironment[] {
    return Array.from(this.sandboxes.values())
  }

  /**
   * Check if sandbox exists for extension
   */
  hasSandbox(extensionId: string): boolean {
    return this.sandboxes.has(extensionId)
  }
}
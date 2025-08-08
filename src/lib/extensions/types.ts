// Extension Manifest Types
export interface ExtensionManifest {
  manifest_version: number
  name: string
  version: string
  description?: string
  author?: string
  homepage_url?: string
  icons?: {
    [size: string]: string
  }
  permissions?: ExtensionPermission[]
  optional_permissions?: ExtensionPermission[]
  content_scripts?: ContentScript[]
  background?: BackgroundScript
  options_page?: string
  options_ui?: OptionsUI
  browser_action?: BrowserAction
  page_action?: PageAction
  web_accessible_resources?: string[]
  update_url?: string
}

export interface ContentScript {
  matches: string[]
  css?: string[]
  js?: string[]
  run_at?: 'document_start' | 'document_end' | 'document_idle'
  all_frames?: boolean
}

export interface BackgroundScript {
  scripts?: string[]
  persistent?: boolean
  service_worker?: string
}

export interface OptionsUI {
  page: string
  open_in_tab?: boolean
}

export interface BrowserAction {
  default_title?: string
  default_icon?: string | { [size: string]: string }
  default_popup?: string
}

export interface PageAction {
  default_title?: string
  default_icon?: string | { [size: string]: string }
  default_popup?: string
}

export type ExtensionPermission = 
  | 'activeTab'
  | 'alarms'
  | 'bookmarks'
  | 'browsingData'
  | 'clipboardRead'
  | 'clipboardWrite'
  | 'contentSettings'
  | 'contextMenus'
  | 'cookies'
  | 'debugger'
  | 'downloads'
  | 'history'
  | 'identity'
  | 'management'
  | 'notifications'
  | 'pageCapture'
  | 'privacy'
  | 'proxy'
  | 'scripting'
  | 'search'
  | 'sessions'
  | 'storage'
  | 'tabs'
  | 'topSites'
  | 'webNavigation'
  | 'webRequest'
  | 'webRequestBlocking'
  | '<all_urls>'

// Extension Types
export interface Extension {
  id: string
  manifest: ExtensionManifest
  path: string
  enabled: boolean
  installedAt: Date
  lastUpdated: Date
  permissions: ExtensionPermission[]
  optionalPermissions: ExtensionPermission[]
  settings: Record<string, any>
  version: string
}

export interface ExtensionContext {
  id: string
  permissions: ExtensionPermission[]
  sendMessage: (message: ExtensionMessage) => Promise<any>
  storage: ExtensionStorage
  runtime: ExtensionRuntime
  tabs: ExtensionTabsAPI
  notifications: ExtensionNotificationsAPI
  alarms: ExtensionAlarmsAPI
}

export interface ExtensionMessage {
  type: string
  data?: any
  source: 'extension' | 'browser'
  target?: string
  timestamp: number
}

export interface ExtensionStorage {
  local: ExtensionStorageArea
  sync: ExtensionStorageArea
  managed: ExtensionStorageArea
}

export interface ExtensionStorageArea {
  get: (keys?: string | string[] | Record<string, any>) => Promise<Record<string, any>>
  set: (items: Record<string, any>) => Promise<void>
  remove: (keys: string | string[]) => Promise<void>
  clear: () => Promise<void>
  getBytesInUse: (keys?: string | string[]) => Promise<number>
}

export interface ExtensionRuntime {
  id: string
  getURL: (path: string) => string
  getManifest: () => ExtensionManifest
  reload: () => void
  requestUpdateCheck: () => Promise<void>
  connect: (extensionId?: string) => ExtensionPort
  sendMessage: (extensionId: string, message: any) => Promise<any>
}

export interface ExtensionTabsAPI {
  create: (createProperties: any) => Promise<chrome.tabs.Tab>
  query: (queryInfo: any) => Promise<chrome.tabs.Tab[]>
  update: (tabId: number, updateProperties: any) => Promise<chrome.tabs.Tab>
  remove: (tabIds: number | number[]) => Promise<void>
  executeScript: (tabId: number, details: any) => Promise<any[]>
  insertCSS: (tabId: number, details: any) => Promise<void>
}

export interface ExtensionNotificationsAPI {
  create: (id: string, options: any) => void
  update: (id: string, options: any) => Promise<boolean>
  clear: (id: string) => Promise<boolean>
  getAll: () => Promise<any[]>
}

export interface ExtensionAlarmsAPI {
  create: (name: string, alarmInfo: any) => void
  get: (name?: string) => Promise<any[]>
  clear: (name?: string) => Promise<boolean>
  getAll: () => Promise<any[]>
}

export interface ExtensionPort {
  name: string
  sender: ExtensionMessageSender
  disconnect: () => void
  postMessage: (message: any) => void
  onDisconnect: chrome.events.Event<() => void>
  onMessage: chrome.events.Event<(message: any, port: ExtensionPort) => void>
}

export interface ExtensionMessageSender {
  tab?: chrome.tabs.Tab
  frameId?: number
  id: string
  url?: string
  tlsChannelId?: string
}

// Sandbox Types
export interface SandboxEnvironment {
  id: string
  extension: Extension
  context: ExtensionContext
  isolatedWindow: Window
  messageChannel: MessageChannel
  eventListeners: Map<string, ((...args: any[]) => void)[]>
  isDestroyed: boolean
}

export interface SandboxConfig {
  allowedOrigins?: string[]
  allowedPermissions: ExtensionPermission[]
  maxMemoryUsage?: number
  maxExecutionTime?: number
  enableConsole?: boolean
  enableNetwork?: boolean
}

// Security Types
export interface PermissionCheck {
  permission: ExtensionPermission
  granted: boolean
  timestamp: Date
}

export interface SecurityPolicy {
  allowedAPIs: string[]
  blockedAPIs: string[]
  contentSecurityPolicy: string
  sandboxAttributes: string[]
}

// Update Types
export interface UpdateInfo {
  extensionId: string
  currentVersion: string
  availableVersion: string
  updateUrl: string
  downloadUrl: string
  checksum: string
  size: number
  releaseNotes?: string
}

export interface UpdateResult {
  extensionId: string
  success: boolean
  newVersion?: string
  error?: string
  rollbackRequired?: boolean
}

// Error Types
export class ExtensionError extends Error {
  constructor(
    message: string,
    public extensionId?: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ExtensionError'
  }
}

export class SecurityError extends ExtensionError {
  constructor(message: string, extensionId?: string) {
    super(message, extensionId, 'SECURITY_VIOLATION')
    this.name = 'SecurityError'
  }
}

export class PermissionError extends ExtensionError {
  constructor(message: string, extensionId?: string) {
    super(message, extensionId, 'PERMISSION_DENIED')
    this.name = 'PermissionError'
  }
}

export class SandboxError extends ExtensionError {
  constructor(message: string, extensionId?: string) {
    super(message, extensionId, 'SANDBOX_VIOLATION')
    this.name = 'SandboxError'
  }
}
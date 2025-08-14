export interface OmniboxSuggestion {
  content: string;
  description: string;
  type: 'url' | 'search' | 'download' | 'command';
  icon?: string;
  action?: () => void;
}

export interface OmniboxOptions {
  placeholder?: string;
  maxSuggestions?: number;
  enableSearch?: boolean;
  enableDownloads?: boolean;
  enableCommands?: boolean;
  searchEngine?: string;
  downloadManager?: any;
}

export class OmniboxService {
  private inputElement: HTMLInputElement | null = null;
  private suggestionsContainer: HTMLDivElement | null = null;
  private options: OmniboxOptions;
  private suggestions: OmniboxSuggestion[] = [];
  private selectedIndex = -1;
  private isOpen = false;
  private inputHandler: ((event: Event) => void) | null = null;
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;
  private blurHandler: ((event: FocusEvent) => void) | null = null;
  private globalClickHandler: ((event: MouseEvent) => void) | null = null;

  constructor(options: OmniboxOptions = {}) {
    this.options = {
      placeholder: 'Search or enter URL...',
      maxSuggestions: 8,
      enableSearch: true,
      enableDownloads: true,
      enableCommands: true,
      searchEngine: 'https://www.google.com/search?q={query}',
      ...options
    };
  }

  attach(inputElement: HTMLInputElement): void {
    this.detach();
    this.inputElement = inputElement;
    
    // Setup suggestions container
    this.createSuggestionsContainer();
    
    // Setup event handlers
    this.setupEventHandlers();
    
    // Set placeholder
    inputElement.placeholder = this.options.placeholder!;
  }

  detach(): void {
    if (this.inputElement) {
      if (this.inputHandler) {
        this.inputElement.removeEventListener('input', this.inputHandler);
      }
      if (this.keydownHandler) {
        this.inputElement.removeEventListener('keydown', this.keydownHandler);
      }
      if (this.blurHandler) {
        this.inputElement.removeEventListener('blur', this.blurHandler);
      }
      this.inputElement = null;
    }
    
    if (this.suggestionsContainer) {
      this.suggestionsContainer.remove();
      this.suggestionsContainer = null;
    }
    
    if (this.globalClickHandler) {
      document.removeEventListener('click', this.globalClickHandler);
      this.globalClickHandler = null;
    }
  }

  private createSuggestionsContainer(): void {
    this.suggestionsContainer = document.createElement('div');
    this.suggestionsContainer.className = 'omnibox-suggestions';
    this.suggestionsContainer.setAttribute('role', 'listbox');
    document.body.appendChild(this.suggestionsContainer);
  }

  private setupEventHandlers(): void {
    if (!this.inputElement) return;

    // Input handler
    this.inputHandler = (event: Event) => {
      const value = (event.target as HTMLInputElement).value;
      this.handleInput(value);
    };
    this.inputElement.addEventListener('input', this.inputHandler);

    // Keydown handler
    this.keydownHandler = (event: KeyboardEvent) => {
      this.handleKeydown(event);
    };
    this.inputElement.addEventListener('keydown', this.keydownHandler);

    // Blur handler
    this.blurHandler = () => {
      setTimeout(() => this.hideSuggestions(), 200);
    };
    this.inputElement.addEventListener('blur', this.blurHandler);

    // Global click handler
    this.globalClickHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isOmniboxClick = target.closest('.omnibox-suggestions') || target === this.inputElement;
      
      if (!isOmniboxClick) {
        this.hideSuggestions();
      }
    };
    document.addEventListener('click', this.globalClickHandler);
  }

  private async handleInput(value: string): Promise<void> {
    if (!value.trim()) {
      this.hideSuggestions();
      return;
    }

    this.suggestions = await this.generateSuggestions(value);
    this.showSuggestions();
  }

  private async generateSuggestions(value: string): Promise<OmniboxSuggestion[]> {
    const suggestions: OmniboxSuggestion[] = [];
    const trimmedValue = value.trim();

    // URL detection
    if (this.isUrl(trimmedValue)) {
      suggestions.push({
        content: trimmedValue,
        description: `Go to ${trimmedValue}`,
        type: 'url',
        icon: '🌐'
      });

      // Download suggestion for direct file URLs
      if (this.isFileUrl(trimmedValue) && this.options.enableDownloads) {
        suggestions.push({
          content: trimmedValue,
          description: `Download ${this.getFileNameFromUrl(trimmedValue)}`,
          type: 'download',
          icon: '⬇️',
          action: () => this.handleDownload(trimmedValue)
        });
      }
    }

    // Search suggestions
    if (this.options.enableSearch) {
      suggestions.push({
        content: trimmedValue,
        description: `Search for "${trimmedValue}"`,
        type: 'search',
        icon: '🔍',
        action: () => this.handleSearch(trimmedValue)
      });
    }

    // Download suggestions
    if (this.options.enableDownloads && this.isFileUrl(trimmedValue)) {
      suggestions.push({
        content: trimmedValue,
        description: `Download with Omnior Turbo`,
        type: 'download',
        icon: '⚡',
        action: () => this.handleDownload(trimmedValue)
      });
    }

    // Command suggestions
    if (this.options.enableCommands) {
      const commands = this.getCommandSuggestions(trimmedValue);
      suggestions.push(...commands);
    }

    return suggestions.slice(0, this.options.maxSuggestions);
  }

  private isUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  private isFileUrl(value: string): boolean {
    const fileExtensions = [
      '.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm',
      '.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.zip', '.rar', '.7z', '.tar', '.gz',
      '.exe', '.dmg', '.iso', '.apk'
    ];
    
    const lowerValue = value.toLowerCase();
    return fileExtensions.some(ext => lowerValue.includes(ext));
  }

  private getFileNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split('/').pop() || 'file';
    } catch {
      return 'file';
    }
  }

  private getCommandSuggestions(value: string): OmniboxSuggestion[] {
    const commands: OmniboxSuggestion[] = [];
    const lowerValue = value.toLowerCase();

    if (lowerValue.includes('download')) {
      commands.push({
        content: 'download manager',
        description: 'Open Download Manager',
        type: 'command',
        icon: '⬇️',
        action: () => this.handleCommand('openDownloads')
      });
    }

    if (lowerValue.includes('setting') || lowerValue.includes('pref')) {
      commands.push({
        content: 'settings',
        description: 'Open Settings',
        type: 'command',
        icon: '⚙️',
        action: () => this.handleCommand('openSettings')
      });
    }

    if (lowerValue.includes('history')) {
      commands.push({
        content: 'history',
        description: 'View Browsing History',
        type: 'command',
        icon: '📚',
        action: () => this.handleCommand('openHistory')
      });
    }

    return commands;
  }

  private showSuggestions(): void {
    if (!this.inputElement || !this.suggestionsContainer) return;

    // Clear existing suggestions
    this.suggestionsContainer.innerHTML = '';
    this.selectedIndex = -1;

    if (this.suggestions.length === 0) {
      this.hideSuggestions();
      return;
    }

    // Create suggestion elements
    this.suggestions.forEach((suggestion, index) => {
      const suggestionElement = this.createSuggestionElement(suggestion, index);
      this.suggestionsContainer!.appendChild(suggestionElement);
    });

    // Position container
    this.positionSuggestionsContainer();

    // Show container
    this.suggestionsContainer.style.display = 'block';
    this.isOpen = true;
  }

  private createSuggestionElement(suggestion: OmniboxSuggestion, index: number): HTMLDivElement {
    const element = document.createElement('div');
    element.className = 'omnibox-suggestion';
    element.setAttribute('role', 'option');
    element.setAttribute('tabindex', '-1');
    
    if (index === this.selectedIndex) {
      element.classList.add('selected');
    }

    // Icon
    if (suggestion.icon) {
      const icon = document.createElement('span');
      icon.className = 'omnibox-suggestion-icon';
      icon.textContent = suggestion.icon;
      element.appendChild(icon);
    }

    // Content
    const content = document.createElement('span');
    content.className = 'omnibox-suggestion-content';
    content.textContent = suggestion.content;
    element.appendChild(content);

    // Description
    const description = document.createElement('span');
    description.className = 'omnibox-suggestion-description';
    description.textContent = suggestion.description;
    element.appendChild(description);

    // Event handlers
    element.addEventListener('click', () => {
      this.selectSuggestion(index);
    });

    element.addEventListener('mouseenter', () => {
      this.selectedIndex = index;
      this.updateSelection();
    });

    return element;
  }

  private positionSuggestionsContainer(): void {
    if (!this.inputElement || !this.suggestionsContainer) return;

    const inputRect = this.inputElement.getBoundingClientRect();
    const containerRect = this.suggestionsContainer.getBoundingClientRect();

    let top = inputRect.bottom + window.scrollY;
    let left = inputRect.left + window.scrollX;

    // Adjust if container goes off screen
    if (left + containerRect.width > window.innerWidth) {
      left = window.innerWidth - containerRect.width - 10;
    }

    if (top + containerRect.height > window.innerHeight + window.scrollY) {
      top = inputRect.top + window.scrollY - containerRect.height;
    }

    this.suggestionsContainer.style.top = `${top}px`;
    this.suggestionsContainer.style.left = `${left}px`;
    this.suggestionsContainer.style.width = `${inputRect.width}px`;
  }

  private hideSuggestions(): void {
    if (this.suggestionsContainer) {
      this.suggestionsContainer.style.display = 'none';
    }
    this.isOpen = false;
    this.selectedIndex = -1;
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (!this.isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.suggestions.length - 1);
        this.updateSelection();
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateSelection();
        break;

      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0) {
          this.selectSuggestion(this.selectedIndex);
        } else {
          this.handleEnter();
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.hideSuggestions();
        break;
    }
  }

  private updateSelection(): void {
    if (!this.suggestionsContainer) return;

    const items = this.suggestionsContainer.querySelectorAll('.omnibox-suggestion');
    items.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }

  private selectSuggestion(index: number): void {
    const suggestion = this.suggestions[index];
    if (!suggestion) return;

    if (suggestion.action) {
      suggestion.action();
    } else {
      this.inputElement!.value = suggestion.content;
      this.handleEnter();
    }

    this.hideSuggestions();
  }

  private handleEnter(): void {
    const value = this.inputElement!.value.trim();
    if (!value) return;

    if (this.isUrl(value)) {
      if (this.isFileUrl(value) && this.options.enableDownloads) {
        this.handleDownload(value);
      } else {
        this.handleNavigation(value);
      }
    } else {
      this.handleSearch(value);
    }
  }

  private handleNavigation(url: string): void {
    // In a real browser, this would navigate to the URL
    console.log('Navigating to:', url);
    window.location.href = url;
  }

  private handleSearch(query: string): void {
    const searchUrl = this.options.searchEngine!.replace('{query}', encodeURIComponent(query));
    console.log('Searching for:', query);
    window.location.href = searchUrl;
  }

  private handleDownload(url: string): void {
    if (this.options.downloadManager) {
      console.log('Downloading:', url);
      // In a real implementation, this would use the download manager
      // this.options.downloadManager.enqueue(profileId, url);
    } else {
      console.log('Download manager not available');
    }
  }

  private handleCommand(command: string): void {
    console.log('Executing command:', command);
    // In a real implementation, this would handle various commands
    switch (command) {
      case 'openDownloads':
        console.log('Opening download manager');
        break;
      case 'openSettings':
        console.log('Opening settings');
        break;
      case 'openHistory':
        console.log('Opening history');
        break;
    }
  }

  updateOptions(options: Partial<OmniboxOptions>): void {
    this.options = { ...this.options, ...options };
  }

  destroy(): void {
    this.detach();
  }
}

// CSS for omnibox
const style = document.createElement('style');
style.textContent = `
  .omnibox-suggestions {
    position: absolute;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    max-height: 300px;
    overflow-y: auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
  }
  
  .omnibox-suggestion {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .omnibox-suggestion:last-child {
    border-bottom: none;
  }
  
  .omnibox-suggestion:hover,
  .omnibox-suggestion.selected {
    background-color: #f5f5f5;
  }
  
  .omnibox-suggestion-icon {
    margin-right: 8px;
    font-size: 16px;
  }
  
  .omnibox-suggestion-content {
    flex: 1;
    font-weight: 500;
    color: #333;
  }
  
  .omnibox-suggestion-description {
    margin-left: 8px;
    color: #666;
    font-size: 12px;
  }
`;
document.head.appendChild(style);
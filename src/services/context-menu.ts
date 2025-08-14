export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  accelerator?: string;
  enabled?: boolean;
  visible?: boolean;
  submenu?: ContextMenuItem[];
  click?: () => void;
}

export interface ContextMenuOptions {
  id: string;
  title?: string;
  items: ContextMenuItem[];
  x?: number;
  y?: number;
  target?: HTMLElement;
}

export class ContextMenuService {
  private activeMenu: HTMLDivElement | null = null;
  private menuStack: HTMLDivElement[] = [];
  private globalClickHandler: ((event: MouseEvent) => void) | null = null;

  constructor() {
    this.setupGlobalClickHandler();
  }

  show(options: ContextMenuOptions): void {
    this.hideAll();
    
    const menu = this.createMenu(options);
    document.body.appendChild(menu);
    
    // Position menu
    this.positionMenu(menu, options.x, options.y);
    
    this.activeMenu = menu;
    this.menuStack.push(menu);
    
    // Focus first item
    const firstItem = menu.querySelector('.context-menu-item') as HTMLElement;
    if (firstItem) {
      firstItem.focus();
    }
  }

  hide(): void {
    if (this.activeMenu) {
      this.activeMenu.remove();
      this.activeMenu = null;
    }
  }

  hideAll(): void {
    this.menuStack.forEach(menu => menu.remove());
    this.menuStack = [];
    this.activeMenu = null;
  }

  private createMenu(options: ContextMenuOptions): HTMLDivElement {
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('tabindex', '-1');
    
    if (options.title) {
      const title = document.createElement('div');
      title.className = 'context-menu-title';
      title.textContent = options.title;
      menu.appendChild(title);
    }
    
    options.items.forEach(item => {
      if (item.visible === false) return;
      
      const menuItem = this.createMenuItem(item, menu);
      menu.appendChild(menuItem);
    });
    
    return menu;
  }

  private createMenuItem(item: ContextMenuItem, parentMenu: HTMLDivElement): HTMLElement {
    const menuItem = document.createElement('div');
    menuItem.className = 'context-menu-item';
    menuItem.setAttribute('role', 'menuitem');
    menuItem.setAttribute('tabindex', '-1');
    
    if (item.enabled === false) {
      menuItem.classList.add('disabled');
    }
    
    // Icon
    if (item.icon) {
      const icon = document.createElement('span');
      icon.className = 'context-menu-icon';
      icon.textContent = item.icon;
      menuItem.appendChild(icon);
    }
    
    // Label
    const label = document.createElement('span');
    label.className = 'context-menu-label';
    label.textContent = item.label;
    menuItem.appendChild(label);
    
    // Accelerator
    if (item.accelerator) {
      const accelerator = document.createElement('span');
      accelerator.className = 'context-menu-accelerator';
      accelerator.textContent = item.accelerator;
      menuItem.appendChild(accelerator);
    }
    
    // Submenu arrow
    if (item.submenu) {
      const arrow = document.createElement('span');
      arrow.className = 'context-menu-arrow';
      arrow.textContent = '▶';
      menuItem.appendChild(arrow);
    }
    
    // Event handlers
    menuItem.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (item.enabled !== false && item.click) {
        item.click();
        this.hideAll();
      }
    });
    
    menuItem.addEventListener('mouseenter', () => {
      if (item.submenu) {
        this.showSubmenu(item.submenu, menuItem, parentMenu);
      } else {
        this.hideSubmenus(parentMenu);
      }
    });
    
    menuItem.addEventListener('keydown', (e) => {
      this.handleKeydown(e as KeyboardEvent, menuItem, parentMenu);
    });
    
    return menuItem;
  }

  private showSubmenu(submenu: ContextMenuItem[], parentItem: HTMLElement, parentMenu: HTMLDivElement): void {
    this.hideSubmenus(parentMenu);
    
    const submenuElement = this.createMenu({ items: submenu });
    submenuElement.className += ' context-menu-submenu';
    
    document.body.appendChild(submenuElement);
    
    // Position submenu
    const parentRect = parentItem.getBoundingClientRect();
    const submenuRect = submenuElement.getBoundingClientRect();
    
    let x = parentRect.right;
    let y = parentRect.top;
    
    // Check if submenu goes off screen
    if (x + submenuRect.width > window.innerWidth) {
      x = parentRect.left - submenuRect.width;
    }
    
    if (y + submenuRect.height > window.innerHeight) {
      y = window.innerHeight - submenuRect.height;
    }
    
    submenuElement.style.left = `${x}px`;
    submenuElement.style.top = `${y}px`;
    
    this.menuStack.push(submenuElement);
  }

  private hideSubmenus(parentMenu: HTMLDivElement): void {
    const parentIndex = this.menuStack.indexOf(parentMenu);
    if (parentIndex >= 0) {
      const submenus = this.menuStack.slice(parentIndex + 1);
      submenus.forEach(menu => menu.remove());
      this.menuStack = this.menuStack.slice(0, parentIndex + 1);
    }
  }

  private positionMenu(menu: HTMLDivElement, x?: number, y?: number): void {
    const menuRect = menu.getBoundingClientRect();
    
    if (x !== undefined && y !== undefined) {
      // Use provided coordinates
      let finalX = x;
      let finalY = y;
      
      // Adjust if menu goes off screen
      if (finalX + menuRect.width > window.innerWidth) {
        finalX = window.innerWidth - menuRect.width;
      }
      
      if (finalY + menuRect.height > window.innerHeight) {
        finalY = window.innerHeight - menuRect.height;
      }
      
      menu.style.left = `${finalX}px`;
      menu.style.top = `${finalY}px`;
    } else {
      // Center the menu
      menu.style.left = `${(window.innerWidth - menuRect.width) / 2}px`;
      menu.style.top = `${(window.innerHeight - menuRect.height) / 2}px`;
    }
  }

  private handleKeydown(event: KeyboardEvent, menuItem: HTMLElement, parentMenu: HTMLDivElement): void {
    const items = Array.from(parentMenu.querySelectorAll('.context-menu-item:not(.disabled)')) as HTMLElement[];
    const currentIndex = items.indexOf(menuItem);
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextItem = items[currentIndex + 1] || items[0];
        nextItem.focus();
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        const prevItem = items[currentIndex - 1] || items[items.length - 1];
        prevItem.focus();
        break;
        
      case 'ArrowRight':
        event.preventDefault();
        const submenuArrow = menuItem.querySelector('.context-menu-arrow');
        if (submenuArrow) {
          menuItem.dispatchEvent(new Event('mouseenter'));
        }
        break;
        
      case 'ArrowLeft':
        event.preventDefault();
        if (parentMenu.classList.contains('context-menu-submenu')) {
          this.hideSubmenus(this.menuStack[0]);
          const parentItem = this.menuStack[0]?.querySelector('.context-menu-item') as HTMLElement;
          if (parentItem) {
            parentItem.focus();
          }
        }
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        menuItem.click();
        break;
        
      case 'Escape':
        event.preventDefault();
        if (parentMenu.classList.contains('context-menu-submenu')) {
          this.hideSubmenus(this.menuStack[0]);
          const parentItem = this.menuStack[0]?.querySelector('.context-menu-item') as HTMLElement;
          if (parentItem) {
            parentItem.focus();
          }
        } else {
          this.hideAll();
        }
        break;
    }
  }

  private setupGlobalClickHandler(): void {
    this.globalClickHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isMenuClick = target.closest('.context-menu');
      
      if (!isMenuClick) {
        this.hideAll();
      }
    };
    
    document.addEventListener('click', this.globalClickHandler);
  }

  destroy(): void {
    this.hideAll();
    if (this.globalClickHandler) {
      document.removeEventListener('click', this.globalClickHandler);
      this.globalClickHandler = null;
    }
  }
}

// CSS for context menu
const style = document.createElement('style');
style.textContent = `
  .context-menu {
    position: fixed;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    min-width: 200px;
    padding: 4px 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    outline: none;
  }
  
  .context-menu-submenu {
    position: fixed;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 10001;
    min-width: 200px;
    padding: 4px 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    outline: none;
  }
  
  .context-menu-title {
    padding: 8px 16px;
    font-weight: 600;
    color: #666;
    border-bottom: 1px solid #eee;
    margin-bottom: 4px;
  }
  
  .context-menu-item {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    cursor: pointer;
    color: #333;
    outline: none;
  }
  
  .context-menu-item:hover {
    background-color: #f5f5f5;
  }
  
  .context-menu-item:focus {
    background-color: #e8f4f8;
    outline: 2px solid #007acc;
    outline-offset: -2px;
  }
  
  .context-menu-item.disabled {
    color: #999;
    cursor: not-allowed;
  }
  
  .context-menu-item.disabled:hover {
    background-color: transparent;
  }
  
  .context-menu-icon {
    margin-right: 8px;
    width: 16px;
    text-align: center;
  }
  
  .context-menu-label {
    flex: 1;
  }
  
  .context-menu-accelerator {
    margin-left: 16px;
    color: #666;
    font-size: 12px;
  }
  
  .context-menu-arrow {
    margin-left: 8px;
    font-size: 10px;
    color: #666;
  }
`;
document.head.appendChild(style);
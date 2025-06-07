class PopupController {
  constructor() {
    this.tabManager = new TabManager();
    this.searchInput = document.getElementById('searchInput');
    this.sortSelect = document.getElementById('sortSelect');
    this.tabsList = document.getElementById('tabsList');
    this.tabCount = document.getElementById('tabCount');
    this.windowCount = document.getElementById('windowCount');
    this.closeDuplicatesBtn = document.getElementById('closeDuplicatesBtn');
    this.refreshBtn = document.getElementById('refreshBtn');
    this.currentSearchQuery = '';
    this.currentSort = 'title-asc';
    
    this.init();
  }

  async init() {
    console.log('Initializing PopupController'); // Debug logging
    this.showLoading();
    this.bindEvents();
    
    try {
      await this.loadTabs();
    } catch (error) {
      console.error('Failed to initialize popup:', error);
      this.showError('Failed to load tabs. Please try refreshing.');
    }
  }

  bindEvents() {
    this.searchInput.addEventListener('input', this.debounce((e) => {
      this.currentSearchQuery = e.target.value;
      this.filterAndSort();
    }, 300));

    this.sortSelect.addEventListener('change', (e) => {
      this.currentSort = e.target.value;
      this.filterAndSort();
    });

    this.closeDuplicatesBtn.addEventListener('click', async () => {
      try {
        const count = await this.tabManager.closeDuplicateTabs();
        if (count > 0) {
          this.showNotification(`Closed ${count} duplicate tabs`);
          await this.loadTabs();
        } else {
          this.showNotification('No duplicate tabs found');
        }
      } catch (error) {
        console.error('Error closing duplicates:', error);
        this.showNotification('Error closing duplicate tabs', 'error');
      }
    });

    this.refreshBtn.addEventListener('click', () => {
      this.loadTabs();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.close();
      }
    });
  }

  async loadTabs() {
    console.log('Loading tabs...'); // Debug logging
    this.showLoading();
    
    try {
      const tabs = await this.tabManager.getAllTabs();
      console.log('Loaded tabs:', tabs.length); // Debug logging
      
      if (tabs.length === 0) {
        console.warn('No tabs returned from TabManager');
      }
      
      this.filterAndSort();
    } catch (error) {
      console.error('Error loading tabs:', error);
      this.showError('Failed to load tabs. Please check permissions.');
    }
  }

  filterAndSort() {
    try {
      const filteredTabs = this.tabManager.filterTabs(this.currentSearchQuery);
      const [sortBy, order] = this.currentSort.split('-');
      const sortedTabs = this.tabManager.sortTabs(sortBy, order);
      
      console.log('Filtered and sorted tabs:', sortedTabs.length); // Debug logging
      
      this.updateStats(sortedTabs);
      this.renderTabs(sortedTabs);
    } catch (error) {
      console.error('Error filtering/sorting tabs:', error);
      this.showError('Error processing tabs');
    }
  }

  updateStats(tabs) {
    const windows = new Set(tabs.map(tab => tab.windowId));
    this.tabCount.textContent = `${tabs.length} tabs`;
    this.windowCount.textContent = `${windows.size} windows`;
  }

  renderTabs(tabs) {
    if (tabs.length === 0) {
      this.showEmptyState();
      return;
    }

    try {
      const windowGroups = this.tabManager.getTabsByWindow();
      const windowIds = Object.keys(windowGroups).sort((a, b) => {
        // Handle potential non-numeric window IDs
        const aNum = parseInt(a) || 0;
        const bNum = parseInt(b) || 0;
        return aNum - bNum;
      });
      
      let html = '';
      
      if (windowIds.length > 1) {
        windowIds.forEach(windowId => {
          const windowTabs = windowGroups[windowId];
          if (windowTabs.length === 0) return;
          
          html += `<div class="window-group">
            <div class="window-header">Window ${windowId} (${windowTabs.length} tabs)</div>
            ${windowTabs.map(tab => this.createTabHTML(tab)).join('')}
          </div>`;
        });
      } else {
        html = tabs.map(tab => this.createTabHTML(tab)).join('');
      }

      this.tabsList.innerHTML = html;
      this.bindTabEvents();
      this.bindFaviconEvents(); // Add this to handle favicon errors
    } catch (error) {
      console.error('Error rendering tabs:', error);
      this.showError('Error displaying tabs');
    }
  }

  createTabHTML(tab) {
    // More robust favicon handling - NO inline event handlers
    let favicon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMkMxMS4zIDIgMTQgNC43IDE0IDhTMTEuMyAxNCA4IDE0IDIgMTEuMyAyIDggNC43IDIgOCAyWiIgZmlsbD0iI0Y1RjVGNSIvPgo8L3N2Zz4K';
    
    if (tab.favIconUrl && tab.favIconUrl.startsWith('http')) {
      favicon = tab.favIconUrl;
    }
    
    const title = this.escapeHtml(tab.title || 'Untitled');
    const url = this.escapeHtml(tab.url || '');
    const isActive = tab.active ? 'active' : '';
    const isPinned = tab.pinned ? 'pinned' : '';
    
    return `
      <div class="tab-item ${isActive} ${isPinned}" data-tab-id="${tab.id}">
        <div class="tab-favicon">
          <img src="${favicon}" alt="" data-tab-favicon />
        </div>
        <div class="tab-info">
          <div class="tab-title" title="${title}">${title}</div>
          <div class="tab-url" title="${url}">${this.formatUrl(url)}</div>
        </div>
        <div class="tab-actions">
          <button class="tab-action pin" data-action="pin" title="${tab.pinned ? 'Unpin' : 'Pin'}">
            ${tab.pinned ? '📌' : '📍'}
          </button>
          <button class="tab-action duplicate" data-action="duplicate" title="Duplicate">
            📄
          </button>
          <button class="tab-action close" data-action="close" title="Close">
            ✕
          </button>
        </div>
      </div>
    `;
  }

  bindFaviconEvents() {
    // Handle favicon loading errors without inline handlers
    const faviconImages = this.tabsList.querySelectorAll('img[data-tab-favicon]');
    faviconImages.forEach(img => {
      img.addEventListener('error', () => {
        img.style.display = 'none';
      });
    });
  }

  bindTabEvents() {
    const tabItems = this.tabsList.querySelectorAll('.tab-item');
    
    tabItems.forEach(tabItem => {
      const tabId = parseInt(tabItem.dataset.tabId);
      
      tabItem.addEventListener('click', async (e) => {
        if (e.target.closest('.tab-actions')) return;
        
        try {
          const success = await this.tabManager.switchToTab(tabId);
          if (success) {
            window.close();
          } else {
            this.showNotification('Failed to switch to tab', 'error');
          }
        } catch (error) {
          console.error('Error switching tab:', error);
          this.showNotification('Error switching to tab', 'error');
        }
      });

      const actions = tabItem.querySelectorAll('.tab-action');
      actions.forEach(action => {
        action.addEventListener('click', async (e) => {
          e.stopPropagation();
          const actionType = action.dataset.action;
          
          try {
            switch (actionType) {
              case 'close':
                const closeSuccess = await this.tabManager.closeTab(tabId);
                if (closeSuccess) {
                  tabItem.remove();
                  this.updateStatsFromDOM();
                } else {
                  this.showNotification('Failed to close tab', 'error');
                }
                break;
              case 'pin':
                await this.tabManager.pinTab(tabId);
                await this.loadTabs();
                break;
              case 'duplicate':
                await this.tabManager.duplicateTab(tabId);
                await this.loadTabs();
                break;
            }
          } catch (error) {
            console.error(`Error performing ${actionType} action:`, error);
            this.showNotification(`Error performing ${actionType} action`, 'error');
          }
        });
      });
    });
  }

  updateStatsFromDOM() {
    const remainingTabs = this.tabsList.querySelectorAll('.tab-item').length;
    const windows = new Set(Array.from(this.tabsList.querySelectorAll('.tab-item')).map(item => {
      const windowHeader = item.closest('.window-group')?.querySelector('.window-header');
      return windowHeader ? windowHeader.textContent.match(/Window (\d+)/)?.[1] : '1';
    }));
    
    this.tabCount.textContent = `${remainingTabs} tabs`;
    this.windowCount.textContent = `${windows.size} windows`;
  }

  showLoading() {
    this.tabsList.innerHTML = '<div class="loading">Loading tabs...</div>';
  }

  showEmptyState() {
    const message = this.currentSearchQuery 
      ? `No tabs found matching "${this.currentSearchQuery}"`
      : 'No tabs found';
    
    this.tabsList.innerHTML = `<div class="empty-state">${message}</div>`;
  }

  showError(message) {
    this.tabsList.innerHTML = `<div class="empty-state" style="color: #dc3545;">${message}</div>`;
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.textContent = message;
    
    const backgroundColor = type === 'error' ? '#dc3545' : '#28a745';
    
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: ${backgroundColor};
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  formatUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname;
    } catch {
      return url;
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Enhanced initialization with error handling
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('DOM loaded, initializing PopupController');
    new PopupController();
  } catch (error) {
    console.error('Failed to initialize PopupController:', error);
    document.body.innerHTML = '<div style="padding: 20px; color: red;">Failed to initialize extension</div>';
  }
});

const css = `
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
`;

const style = document.createElement('style');
style.textContent = css;
document.head.appendChild(style);
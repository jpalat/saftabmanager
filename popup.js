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
    this.showLoading();
    this.bindEvents();
    await this.loadTabs();
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
      const count = await this.tabManager.closeDuplicateTabs();
      if (count > 0) {
        this.showNotification(`Closed ${count} duplicate tabs`);
        await this.loadTabs();
      } else {
        this.showNotification('No duplicate tabs found');
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
    this.showLoading();
    await this.tabManager.getAllTabs();
    this.filterAndSort();
  }

  filterAndSort() {
    const filteredTabs = this.tabManager.filterTabs(this.currentSearchQuery);
    const [sortBy, order] = this.currentSort.split('-');
    const sortedTabs = this.tabManager.sortTabs(sortBy, order);
    
    this.updateStats(sortedTabs);
    this.renderTabs(sortedTabs);
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

    const windowGroups = this.tabManager.getTabsByWindow();
    const windowIds = Object.keys(windowGroups).sort((a, b) => parseInt(a) - parseInt(b));
    
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
  }

  createTabHTML(tab) {
    const favicon = tab.favIconUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMkMxMS4zIDIgMTQgNC43IDE0IDhTMTEuMyAxNCA4IDE0IDIgMTEuMyAyIDggNC43IDIgOCAyWiIgZmlsbD0iI0Y1RjVGNSIvPgo8L3N2Zz4K';
    const title = this.escapeHtml(tab.title || 'Untitled');
    const url = this.escapeHtml(tab.url || '');
    const isActive = tab.active ? 'active' : '';
    const isPinned = tab.pinned ? 'pinned' : '';
    
    return `
      <div class="tab-item ${isActive} ${isPinned}" data-tab-id="${tab.id}">
        <div class="tab-favicon">
          <img src="${favicon}" alt="" onerror="this.style.display='none'" />
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

  bindTabEvents() {
    const tabItems = this.tabsList.querySelectorAll('.tab-item');
    
    tabItems.forEach(tabItem => {
      const tabId = parseInt(tabItem.dataset.tabId);
      
      tabItem.addEventListener('click', async (e) => {
        if (e.target.closest('.tab-actions')) return;
        
        await this.tabManager.switchToTab(tabId);
        window.close();
      });

      const actions = tabItem.querySelectorAll('.tab-action');
      actions.forEach(action => {
        action.addEventListener('click', async (e) => {
          e.stopPropagation();
          const actionType = action.dataset.action;
          
          switch (actionType) {
            case 'close':
              await this.tabManager.closeTab(tabId);
              tabItem.remove();
              this.updateStatsFromDOM();
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

  showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #28a745;
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

document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
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
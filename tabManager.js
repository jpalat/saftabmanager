class TabManager {
  constructor() {
    this.browser = this.getBrowserAPI();
    this.tabs = [];
    this.filteredTabs = [];
  }

  getBrowserAPI() {
    // Enhanced browser detection for Edge compatibility
    if (typeof browser !== 'undefined') {
      return browser;
    } else if (typeof chrome !== 'undefined') {
      return chrome;
    } else {
      // Fallback - this shouldn't happen in a proper extension context
      console.error('No browser API available');
      return null;
    }
  }

  async getAllTabs() {
    try {
      if (!this.browser) {
        throw new Error('Browser API not available');
      }
      
      // More robust tab querying with error handling
      const queryOptions = {};
      this.tabs = await this.browser.tabs.query(queryOptions);
      
      // Ensure tabs array is valid
      if (!Array.isArray(this.tabs)) {
        this.tabs = [];
      }
      
      this.filteredTabs = [...this.tabs];
      console.log(`Found ${this.tabs.length} tabs`); // Debug logging
      return this.tabs;
    } catch (error) {
      console.error('Error fetching tabs:', error);
      this.tabs = [];
      this.filteredTabs = [];
      return [];
    }
  }

  filterTabs(query) {
    if (!query || query.trim() === '') {
      this.filteredTabs = [...this.tabs];
      return this.filteredTabs;
    }

    const searchTerm = query.toLowerCase().trim();
    this.filteredTabs = this.tabs.filter(tab => {
      const title = tab.title ? tab.title.toLowerCase() : '';
      const url = tab.url ? tab.url.toLowerCase() : '';
      return title.includes(searchTerm) || url.includes(searchTerm);
    });

    return this.filteredTabs;
  }

  sortTabs(sortBy = 'title', order = 'asc') {
    const sortOrder = order === 'desc' ? -1 : 1;
    
    this.filteredTabs.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'title':
          valueA = (a.title || '').toLowerCase();
          valueB = (b.title || '').toLowerCase();
          break;
        case 'url':
          valueA = (a.url || '').toLowerCase();
          valueB = (b.url || '').toLowerCase();
          break;
        case 'lastAccessed':
          // Edge might not support lastAccessed - use id as fallback
          valueA = a.lastAccessed || a.id || 0;
          valueB = b.lastAccessed || b.id || 0;
          break;
        case 'windowId':
          valueA = a.windowId || 0;
          valueB = b.windowId || 0;
          break;
        default:
          valueA = (a.title || '').toLowerCase();
          valueB = (b.title || '').toLowerCase();
      }

      if (valueA < valueB) return -1 * sortOrder;
      if (valueA > valueB) return 1 * sortOrder;
      return 0;
    });

    return this.filteredTabs;
  }

  async switchToTab(tabId) {
    try {
      if (!this.browser) return false;
      
      await this.browser.tabs.update(tabId, { active: true });
      const tab = await this.browser.tabs.get(tabId);
      
      // Edge might handle window focusing differently
      if (tab && tab.windowId) {
        try {
          await this.browser.windows.update(tab.windowId, { focused: true });
        } catch (windowError) {
          console.warn('Could not focus window:', windowError);
          // Continue anyway - tab switching might still work
        }
      }
      return true;
    } catch (error) {
      console.error('Error switching to tab:', error);
      return false;
    }
  }

  async closeTab(tabId) {
    try {
      if (!this.browser) return false;
      
      await this.browser.tabs.remove(tabId);
      this.tabs = this.tabs.filter(tab => tab.id !== tabId);
      this.filteredTabs = this.filteredTabs.filter(tab => tab.id !== tabId);
      return true;
    } catch (error) {
      console.error('Error closing tab:', error);
      return false;
    }
  }

  async duplicateTab(tabId) {
    try {
      if (!this.browser) return false;
      
      const tab = this.tabs.find(t => t.id === tabId);
      if (!tab) return false;
      
      const newTab = await this.browser.tabs.create({
        url: tab.url,
        windowId: tab.windowId
      });
      
      await this.getAllTabs();
      return newTab;
    } catch (error) {
      console.error('Error duplicating tab:', error);
      return false;
    }
  }

  async pinTab(tabId) {
    try {
      if (!this.browser) return false;
      
      const tab = this.tabs.find(t => t.id === tabId);
      if (!tab) return false;
      
      await this.browser.tabs.update(tabId, { pinned: !tab.pinned });
      await this.getAllTabs();
      return true;
    } catch (error) {
      console.error('Error pinning/unpinning tab:', error);
      return false;
    }
  }

  getTabsByWindow() {
    const windowGroups = {};
    this.filteredTabs.forEach(tab => {
      const windowId = tab.windowId || 'unknown';
      if (!windowGroups[windowId]) {
        windowGroups[windowId] = [];
      }
      windowGroups[windowId].push(tab);
    });
    return windowGroups;
  }

  getDuplicateTabs() {
    const urlMap = {};
    const duplicates = [];
    
    this.tabs.forEach(tab => {
      if (tab.url) {
        if (urlMap[tab.url]) {
          if (!duplicates.some(dup => dup.url === tab.url)) {
            duplicates.push(...urlMap[tab.url], tab);
          } else {
            duplicates.push(tab);
          }
        } else {
          urlMap[tab.url] = [tab];
        }
      }
    });
    
    return duplicates;
  }

  async closeDuplicateTabs() {
    const duplicates = this.getDuplicateTabs();
    const urlMap = {};
    const tabsToClose = [];
    
    duplicates.forEach(tab => {
      if (urlMap[tab.url]) {
        tabsToClose.push(tab.id);
      } else {
        urlMap[tab.url] = tab;
      }
    });
    
    if (tabsToClose.length > 0) {
      try {
        if (!this.browser) return 0;
        
        await this.browser.tabs.remove(tabsToClose);
        await this.getAllTabs();
        return tabsToClose.length;
      } catch (error) {
        console.error('Error closing duplicate tabs:', error);
        return 0;
      }
    }
    
    return 0;
  }
}
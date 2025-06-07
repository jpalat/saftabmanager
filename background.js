// Cross-browser compatibility
const browserAPI = (() => {
  if (typeof browser !== 'undefined') {
    return browser; // Firefox
  } else if (typeof chrome !== 'undefined') {
    return chrome; // Chrome/Edge
  }
  return null;
})();

// Extension installation handler
if (browserAPI && browserAPI.runtime && browserAPI.runtime.onInstalled) {
  browserAPI.runtime.onInstalled.addListener(() => {
    console.log('SafTab Manager installed');
  });
}

// Handle browser action clicks (for browsers that support it)
if (browserAPI && browserAPI.browserAction && browserAPI.browserAction.onClicked) {
  browserAPI.browserAction.onClicked.addListener((tab) => {
    console.log('Extension icon clicked');
  });
}

// Alternative for browsers that use 'action' instead of 'browserAction'
if (browserAPI && browserAPI.action && browserAPI.action.onClicked) {
  browserAPI.action.onClicked.addListener((tab) => {
    console.log('Extension icon clicked');
  });
}
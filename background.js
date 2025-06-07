// Manifest V3 Service Worker for SafTab Manager

// Extension installation handler
chrome.runtime.onInstalled.addListener(() => {
  console.log('SafTab Manager v0.0.9 installed');
  
  // Show installation message with hotkey info
  try {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: 'SafTab Manager Installed!',
      message: 'Press Ctrl+G (Cmd+G on Mac) to open the tab manager'
    });
  } catch (error) {
    console.log('Notification not supported or blocked');
  }
});

// Handle keyboard commands
chrome.commands.onCommand.addListener((command) => {
  console.log('Command triggered:', command);
  
  switch (command) {
    case '_execute_action':
      // This is automatically handled by the browser for Manifest V3
      // Opens the popup when Ctrl+G / Cmd+G is pressed
      console.log('Action executed via hotkey');
      break;
      
    case 'open_popup':
      // Alternative command handler
      console.log('Alternative popup command triggered');
      
      // For Manifest V3, we can try to open the popup programmatically
      try {
        chrome.action.openPopup();
      } catch (error) {
        console.log('Popup cannot be opened programmatically:', error.message);
        // Fallback: Could show a notification or other action
      }
      break;
      
    default:
      console.log('Unknown command:', command);
  }
});

// Optional: Handle tab updates to refresh extension data
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only log significant changes to avoid spam
  if (changeInfo.status === 'complete' || changeInfo.title) {
    console.log('Tab updated:', tabId, changeInfo.status || 'title changed');
  }
});

// Optional: Handle tab creation/removal for live updates
chrome.tabs.onCreated.addListener((tab) => {
  console.log('New tab created:', tab.id);
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log('Tab removed:', tabId);
});

// Handle action clicks (when user clicks the extension icon)
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked');
});
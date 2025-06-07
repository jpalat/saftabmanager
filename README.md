# SafTab Manager

A cross-browser web extension for advanced tab management with filtering, sorting, and organization features.

## Features

- **List all tabs** across all windows
- **Search and filter** tabs by title or URL
- **Sort tabs** by title, URL, last accessed time, or window
- **Switch to tabs** with a single click
- **Close, duplicate, and pin/unpin** tabs
- **Group tabs by window** for better organization
- **Find and close duplicate tabs** automatically
- **Cross-browser compatibility** (Chrome, Firefox, Edge)

## Installation

### Chrome/Edge
1. Open `chrome://extensions/` or `edge://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the extension folder

### Firefox
1. Open `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file

## Usage

1. Click the extension icon in your browser toolbar
2. Use the search box to filter tabs by title or URL
3. Use the sort dropdown to organize tabs
4. Click on any tab to switch to it
5. Use action buttons to pin, duplicate, or close tabs
6. Click "Close Duplicates" to remove duplicate tabs

## File Structure

```
saftabmanager/
├── manifest.json       # Extension configuration
├── background.js       # Background service worker
├── tabManager.js       # Core tab management logic
├── popup.html          # Extension popup interface
├── popup.css          # Styling for the popup
├── popup.js           # Popup interaction logic
└── README.md          # Documentation
```

## Browser Compatibility

The extension uses Manifest V3 and includes cross-browser compatibility for:
- Chrome 88+
- Firefox 109+
- Edge 88+

## Permissions

- `tabs`: Required to access tab information and perform tab operations
- `activeTab`: Required to interact with the currently active tab
chrome.runtime.onInstalled.addListener(() => {
  console.log('SafTab Manager installed');
});

chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked');
});
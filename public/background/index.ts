// Log when background script is initialized
console.log('IntentID background script initialized');

// Function to inject content script
const injectContentScript = async (tabId: number) => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/index.js']
    });
    console.log('Content script injected into tab:', tabId);
  } catch (error) {
    console.error('Failed to inject content script:', error);
  }
};

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.startsWith('http')) {
    console.log('Tab updated, injecting content script:', tabId);
    injectContentScript(tabId);
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request.type);
  
  if (request.type === 'MetaMask_Account') {
    console.log('Received MetaMask account message:', request.accounts);
    sendResponse({ success: true });
  }
  return true;
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension clicked, tab:', tab.id);
  if (tab.id) {
    injectContentScript(tab.id);
  }
});
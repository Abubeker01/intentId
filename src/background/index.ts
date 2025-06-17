// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('IntentID Extension installed');
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
  console.log('Message received:', message);
  // Handle messages here
  sendResponse({ received: true });
}); 
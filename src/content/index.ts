// Content script
console.log('IntentID content script loaded');

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
  console.log('Content script received message:', message);
  // Handle messages here
  sendResponse({ received: true });
}); 
console.log('🧪 INTENTID DEBUG: content/index.js loaded');
// content/index.js

// Helper to inject our inpage.js into the page
function injectInpage() {
  const script = document.createElement('script');
  // chrome.runtime.getURL works in content scripts
  script.src = chrome.runtime.getURL('inpage.js');
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}

injectInpage();

// Listen for the page’s response
window.addEventListener('message', (event) => {
  if (event.source !== window || event.data?.source !== 'INTENTID_INPAGE') return;
  const { isMetaMask } = event.data;
  console.log('🛠️ [INPAGE] MetaMask available:', isMetaMask);
  // store it for your CHECK_METAMASK handler:
  window.__INTENTID_META_MASK_AVAILABLE__ = isMetaMask;
});


interface Window { 
  ethereum?: any;
  __INTENTID_META_MASK_AVAILABLE__?: boolean;
}

// Find the real MetaMask provider, even if there are multiple wallets
function getMetaMaskProvider() {
  const { ethereum } = window as any;
  if (!ethereum) return null;

  if (Array.isArray(ethereum.providers)) {
    return ethereum.providers.find((p: any) => p.isMetaMask) || null;
  }

  return ethereum.isMetaMask ? ethereum : null;
}

// Check availability
const isMetaMaskAvailable = () => !!getMetaMaskProvider();

// Check unlocked status
const isMetaMaskUnlocked = async (): Promise<boolean> => {
  try {
    const provider = getMetaMaskProvider();
    if (!provider) return false;
    const accounts = await provider.request({ method: 'eth_accounts' });
    return Array.isArray(accounts) && accounts.length > 0;
  } catch (err) {
    console.error('Error checking MetaMask unlock status:', err);
    return false;
  }
};

// debug dump (after the helpers are defined)
window.addEventListener('load', () => {
  console.log('🛠️ [DEBUG] ethereum (raw) →', (window as any).ethereum);
  console.log('🛠️ [DEBUG] MetaMask provider →', getMetaMaskProvider());
  if (Array.isArray((window as any).ethereum?.providers)) {
    console.log('🛠️ [DEBUG] ethereum.providers →', (window as any).ethereum.providers);
  }
});

console.log('IntentID content script initialized');

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('Content script received message:', msg.type);

  if (msg.type === 'PING') {
    console.log('PING received, responding with PONG');
    sendResponse({ pong: true });
    return true;
  }

  if (msg.type === 'CHECK_METAMASK') {
    const available = window.__INTENTID_META_MASK_AVAILABLE__ === true;;
    console.log('MetaMask available:', available);
    sendResponse({ available });
    return true;
  }

  if (msg.type === 'CHECK_UNLOCKED') {
    isMetaMaskUnlocked()
      .then(unlocked => {
        console.log('MetaMask unlocked:', unlocked);
        sendResponse({ unlocked });
      })
      .catch(error => {
        console.error('Error checking unlock status:', error);
        sendResponse({ unlocked: false });
      });
    return true;
  }

  if (msg.type === 'SIGN_INTENT') {
    const provider = getMetaMaskProvider();
    if (!provider) {
      sendResponse({ error: 'MetaMask not available' });
      return true;
    }

    const { domain, types, message } = msg;
    provider.request({ method: 'eth_requestAccounts' })
      .then((accounts: string[]) => {
        message.from = accounts[0];
        return provider.request({
          method: 'eth_signTypedData_v4',
          params: [accounts[0], JSON.stringify({ domain, types, message })]
        });
      })
      .then((signature: string) => {
        sendResponse({ signature });
      })
      .catch((error: any) => {
        console.error('Signing error:', error);
        sendResponse({ error: error.message || 'Signing failed' });
      });
    return true;
  }
});

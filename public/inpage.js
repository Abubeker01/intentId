// inpage.js — runs in the page’s JS world
console.log('🧪 INTENTID DEBUG: inpage.js loaded into page context.');

(function() {
  // Function to find the MetaMask provider and post the message
  function sendMetaMaskAvailability() {
    let provider = null;

    if (window.ethereum) {
      if (window.ethereum.isMetaMask) {
        provider = window.ethereum;
      } else if (Array.isArray(window.ethereum.providers)) {
        provider = window.ethereum.providers.find(p => p.isMetaMask);
      }
    }

    console.log(`🛠️ [INPAGE] MetaMask check result: ${!!provider}. Provider:`, provider);
    window.postMessage({
      source: 'INTENTID_INPAGE',
      isMetaMask: !!provider
    }, '*');
  }

  // 1. Initial check (in case MetaMask is already available)
  // This is for very fast loading pages or if MetaMask is super quick.
  sendMetaMaskAvailability();

  // 2. Listen for the 'ethereum#initialized' event.
  // This is the most reliable way as MetaMask fires this when it's ready.
  window.addEventListener('ethereum#initialized', () => {
    console.log('🛠️ [INPAGE] "ethereum#initialized" event detected.');
    sendMetaMaskAvailability();
  }, { once: true }); // Use { once: true } to prevent multiple executions

  // 3. Fallback: A small timeout in case the event is missed or delayed
  //    (Less ideal, but provides a second chance if event handling fails or is inconsistent)
  //    Only run if the initial check didn't find it.
  if (!window.ethereum?.isMetaMask && !Array.isArray(window.ethereum?.providers)) {
      setTimeout(() => {
          console.log('🛠️ [INPAGE] Fallback check after 500ms.');
          sendMetaMaskAvailability();
      }, 500); // Wait 500ms and check again
  }

})();
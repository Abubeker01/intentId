// inpage.js — runs in the page’s JS world
(function() {
  const provider = window.ethereum && window.ethereum.isMetaMask
    ? window.ethereum
    : Array.isArray(window.ethereum?.providers)
      ? window.ethereum.providers.find(p => p.isMetaMask)
      : null;

  window.postMessage({
    source: 'INTENTID_INPAGE',
    isMetaMask: !!provider
  }, '*');
})();

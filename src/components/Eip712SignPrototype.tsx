import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// EIP‑712 domain & types
const domain = {
  name: 'IntentID',
  version: '1',
  chainId: 1,
  verifyingContract: '0x0000000000000000000000000000000000000000',
};
const types = {
  Intent: [
    { name: 'type',    type: 'string' },
    { name: 'from',    type: 'address' },
    { name: 'dapp',    type: 'string' },
    { name: 'contract',type: 'address' },
    { name: 'method',  type: 'string' },
    { name: 'params',  type: 'string' },
    { name: 'issuedAt',type: 'uint256' },
  ],
};

interface IntentMessage {
  type: string;
  from: string;
  dapp: string;
  contract: string;
  method: string;
  params: string;
  issuedAt: number;
}

const Eip712SignPrototype: React.FC = () => {
  const [signature, setSignature] = useState<string>('');
  const [error, setError]         = useState<string>('');
  const [isAvailable, setAvailable] = useState<boolean>(false);
  const [isUnlocked,  setUnlocked]  = useState<boolean>(false);

  // Listen for availability broadcasts and query current status
  useEffect(() => {
    const checkMetaMask = async () => {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs[0]?.id) {
          setError('No active tab found');
          return;
        }

        // Try to connect to content script with retries
        let retries = 3;
        while (retries > 0) {
          try {
            await chrome.tabs.sendMessage(tabs[0].id, { type: 'PING' });
            break; // If successful, break the loop
          } catch (e) {
            retries--;
            if (retries === 0) {
              setError('Content script not ready. Please refresh the page.');
              return;
            }
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        // Now check MetaMask
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: 'CHECK_METAMASK' },
          (response: { available: boolean }) => {
            if (chrome.runtime.lastError) {
              console.error('MetaMask check error:', chrome.runtime.lastError);
              setError('Failed to check MetaMask status');
              return;
            }
            console.log('MetaMask check response:', response);
            setAvailable(!!response?.available);
          }
        );
      } catch (error) {
        console.error('Initialization error:', error);
        setError('Failed to initialize: ' + (error as Error).message);
      }
    };

    checkMetaMask();
  }, []);

  // Check MetaMask unlock state once available
  useEffect(() => {
    if (!isAvailable) return;

    const checkUnlockStatus = async () => {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs[0]?.id) return;

        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: 'CHECK_UNLOCKED' },
          (response: { unlocked: boolean }) => {
            if (chrome.runtime.lastError) {
              console.error('Unlock check error:', chrome.runtime.lastError);
              setError('Failed to check unlock status');
              return;
            }
            console.log('Unlock check response:', response);
            setUnlocked(!!response?.unlocked);
          }
        );
      } catch (error) {
        console.error('Unlock check error:', error);
        setError('Failed to check unlock status: ' + (error as Error).message);
      }
    };

    checkUnlockStatus();
  }, [isAvailable]);

  const signIntent = () => {
    setError('');
    if (!isAvailable) {
      setError('Please install MetaMask to use this feature');
      return;
    }
    if (!isUnlocked) {
      setError('Please unlock MetaMask to use this feature');
      return;
    }

    const message: IntentMessage = {
      type: 'swap',
      from: '', // will be set in content script
      dapp: 'QuickDEX',
      contract: '0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF',
      method: 'swapTokens',
      params: ethers.AbiCoder.defaultAbiCoder().encode(
        ['uint256', 'address'],
        [ethers.parseEther('1'), '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48']
      ),
      issuedAt: Math.floor(Date.now() / 1000),
    };

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log('▶️ Active tab URL:', tabs[0].url);
      chrome.tabs.sendMessage(
        tabs[0].id!,
        { type: 'SIGN_INTENT', domain, types, message },
        (response: { signature?: string; error?: string }) => {
          if (response.error) {
            setError(response.error);
          } else if (response.signature) {
            setSignature(response.signature);
          } else {
            setError('No response from signer');
          }
        }
      );
    });
  };

  return (
    <div className="space-y-4">
      {!isAvailable ? (
        <div className="p-4 bg-yellow-100 text-yellow-700 rounded">
          Please install MetaMask to use this feature
        </div>
      ) : !isUnlocked ? (
        <div className="p-4 bg-yellow-100 text-yellow-700 rounded">
          Please unlock MetaMask to use this feature
        </div>
      ) : (
        <button
          onClick={signIntent}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Sign Intent
        </button>
      )}

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {signature && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Signature:</h3>
          <div className="p-3 bg-gray-100 rounded break-all text-sm">
            {signature}
          </div>
        </div>
      )}
    </div>
  );
};

export default Eip712SignPrototype;

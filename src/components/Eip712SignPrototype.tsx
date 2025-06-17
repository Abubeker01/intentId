import React, { useState } from 'react';
import { ethers } from 'ethers';

// Define EIP-712 domain and types
const domain = {
  name: 'IntentID',
  version: '1',
  chainId: 1, // Mainnet; adjust for testing
  verifyingContract: '0x0000000000000000000000000000000000000000',
};

// Define the struct types for the intent message
const types = {
  Intent: [
    { name: 'type', type: 'string' },
    { name: 'from', type: 'address' },
    { name: 'dapp', type: 'string' },
    { name: 'contract', type: 'address' },
    { name: 'method', type: 'string' },
    { name: 'params', type: 'string' },
    { name: 'issuedAt', type: 'uint256' },
  ],
};

// Add TypeScript interface for the message
interface IntentMessage {
  type: string;
  from: string;
  dapp: string;
  contract: string;
  method: string;
  params: string;
  issuedAt: number;
}

// Add TypeScript interface for Ethereum window
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
    };
  }
}

const Eip712SignPrototype: React.FC = () => {
  const [signature, setSignature] = useState<string>('');

  const signIntent = async () => {
    try {
      // Ensure Ethereum provider (e.g., MetaMask) is available
      if (!window.ethereum) throw new Error('No Ethereum provider found');

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const fromAddress = await signer.getAddress();

      // Prepare the message payload
      const message: IntentMessage = {
        type: 'swap',
        from: fromAddress,
        dapp: 'QuickDEX',
        contract: '0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF',
        method: 'swapTokens',
        params: ethers.AbiCoder.defaultAbiCoder().encode(['uint256', 'address'], [
          ethers.parseEther('1'), // 1 ETH
          '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC contract
        ]),
        issuedAt: Math.floor(Date.now() / 1000),
      };

      // Request EIP-712 signature
      const sig = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [
          fromAddress,
          JSON.stringify({ domain, types, primaryType: 'Intent', message }),
        ],
      });

      setSignature(sig);
    } catch (err: any) {
      console.error('Signing failed', err);
      alert(err.message || err);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-md max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-4">EIP-712 Intent Signer</h2>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={signIntent}
      >
        Sign Intent
      </button>
      {signature && (
        <div className="mt-4">
          <label className="font-medium">Signature:</label>
          <pre className="p-2 bg-gray-100 rounded mt-2 break-all">{signature}</pre>
        </div>
      )}
    </div>
  );
};

export default Eip712SignPrototype; 
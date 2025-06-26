import React from 'react';
import Eip712SignPrototype from '../components/Eip712SignPrototype';

const Popup: React.FC = () => {
  return (
    <div className="p-4 w-96">
      <h1 className="text-2xl font-bold mb-4">IntentID</h1>
      <p className="text-gray-600 mb-6">Web3 Identity & Access Management</p>
      <Eip712SignPrototype />
    </div>
  );
};

export default Popup; 
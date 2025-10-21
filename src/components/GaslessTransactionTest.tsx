import React, { useState } from 'react';
import { useBaseWallet } from '../hooks/useBaseWallet';

const GaslessTransactionTest: React.FC = () => {
  const {
    isConnected,
    address,
    connect,
    disconnect,
    switchToBase,
    switchToTestnet,
    sendGaslessTransaction,
    getCurrentNetwork,
    error
  } = useBaseWallet();

  const [txHash, setTxHash] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [recipient, setRecipient] = useState('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
  const [amount, setAmount] = useState('0.001');

  const currentNetwork = getCurrentNetwork();

  const handleGaslessTransaction = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setTxHash('');

    try {
      // Simple ETH transfer transaction data
      const value = `0x${(parseFloat(amount) * 1e18).toString(16)}`; // Convert ETH to wei in hex
      const data = '0x'; // Empty data for simple transfer

      console.log('Sending gasless transaction:', {
        to: recipient,
        value,
        network: currentNetwork.isTestnet ? 'Base Sepolia' : 'Base Mainnet',
        paymaster: currentNetwork.paymaster
      });

      const hash = await sendGaslessTransaction(recipient, data, value);
      setTxHash(hash);
      alert(`Gasless transaction sent! Hash: ${hash}`);
    } catch (err: any) {
      console.error('Transaction failed:', err);
      alert(`Transaction failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getExplorerUrl = (hash: string) => {
    const baseUrl = currentNetwork.isTestnet 
      ? 'https://sepolia.basescan.org/tx/'
      : 'https://basescan.org/tx/';
    return `${baseUrl}${hash}`;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Gasless Transaction Test</h2>
      
      {/* Network Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Network Status</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Network:</strong> {currentNetwork.isTestnet ? 'Base Sepolia (Testnet)' : 'Base Mainnet'}</p>
          <p><strong>Chain ID:</strong> {currentNetwork.chainId}</p>
          <p><strong>RPC:</strong> {currentNetwork.rpc}</p>
          <p><strong>Paymaster:</strong> {currentNetwork.paymaster ? '✅ Configured' : '❌ Not configured'}</p>
        </div>
      </div>

      {/* Wallet Connection */}
      <div className="mb-6">
        {!isConnected ? (
          <button
            onClick={connect}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Connected: {address}</p>
            <div className="flex space-x-2">
              <button
                onClick={disconnect}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
              >
                Disconnect
              </button>
              <button
                onClick={switchToBase}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
              >
                Switch to Mainnet
              </button>
              <button
                onClick={switchToTestnet}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
              >
                Switch to Testnet
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Form */}
      {isConnected && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (ETH)
            </label>
            <input
              type="number"
              step="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.001"
            />
          </div>

          <button
            onClick={handleGaslessTransaction}
            disabled={loading || !currentNetwork.paymaster}
            className={`w-full font-bold py-2 px-4 rounded ${
              loading || !currentNetwork.paymaster
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-500 hover:bg-purple-600 text-white'
            }`}
          >
            {loading ? 'Sending...' : 'Send Gasless Transaction'}
          </button>

          {!currentNetwork.paymaster && (
            <p className="text-red-500 text-sm text-center">
              ⚠️ No paymaster configured for current network
            </p>
          )}
        </div>
      )}

      {/* Transaction Result */}
      {txHash && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Transaction Sent!</h3>
          <p className="text-sm text-gray-600 mb-2">Hash: {txHash}</p>
          <a
            href={getExplorerUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 underline"
          >
            View on Block Explorer
          </a>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

export default GaslessTransactionTest;
import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

// Lazy import to avoid immediate initialization errors
let createBaseAccountSDK: any = null;

interface WalletState {
  isConnected: boolean;
  address: string | null;
  isConnecting: boolean;
  error: string | null;
  user: any | null; // User data from database
  isNewUser: boolean;
}

interface UseBaseWalletReturn extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchToBase: () => Promise<void>;
  switchToTestnet: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkUserState: () => boolean;
  sendGaslessTransaction: (to: string, data: string, value?: string) => Promise<string>;
  getCurrentNetwork: () => { chainId: number; rpc: string; paymaster: string; isTestnet: boolean; name: string };
}

// Network configurations
const BASE_MAINNET_CHAIN_ID = 8453; // Base Mainnet
const BASE_SEPOLIA_CHAIN_ID = 84532; // Base Sepolia Testnet
const BASE_MAINNET_RPC_URL = 'https://mainnet.base.org';
const BASE_SEPOLIA_RPC_URL = 'https://sepolia.base.org';

// Paymaster endpoints from environment variables
const PAYMASTER_MAINNET = import.meta.env.VITE_PAYMASTER_MAINNET || '';
const PAYMASTER_TESTNET = import.meta.env.VITE_PAYMASTER_TESTNET || '';

// Current network configuration (default to testnet)
const CURRENT_CHAIN_ID = BASE_SEPOLIA_CHAIN_ID;
const CURRENT_RPC_URL = BASE_SEPOLIA_RPC_URL;
const CURRENT_PAYMASTER = PAYMASTER_TESTNET;

// Check IndexedDB availability and handle errors
const checkIndexedDBSupport = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    if (!window.indexedDB) {
      console.warn('⚠️ IndexedDB not supported in this environment');
      return false;
    }
    return true;
  } catch (error) {
    console.warn('⚠️ IndexedDB check failed:', error);
    return false;
  }
};

// Suppress IndexedDB errors globally for Base Account SDK
const suppressIndexedDBErrors = () => {
  if (typeof window !== 'undefined') {
    const originalError = window.console.error;
    window.console.error = (...args) => {
      const message = args.join(' ');
      // Suppress specific IndexedDB and Analytics SDK errors
      if (
        message.includes('IndexedDB:Get:InternalError') ||
        message.includes('Analytics SDK: Error') ||
        message.includes('Internal error when calculating storage usage') ||
        message.includes('checkCrossOriginOpenerPolicy') ||
        message.includes('Video load error') ||
        message.includes('net::ERR_ABORTED')
      ) {
        // Silently suppress these errors to reduce console spam
        return;
      }
      originalError.apply(console, args);
    };
  }
};

export const useBaseWallet = (): UseBaseWalletReturn => {
  const isDev = import.meta.env?.DEV === true;
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    isConnecting: false,
    error: null,
    user: null,
    isNewUser: false,
  });

  const [provider, setProvider] = useState<any>(null);
  const [sdkInitialized, setSdkInitialized] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState({
    chainId: BASE_SEPOLIA_CHAIN_ID,
    rpc: BASE_SEPOLIA_RPC_URL,
    paymaster: PAYMASTER_TESTNET,
    isTestnet: true,
    name: 'Base Sepolia Testnet'
  });

  // Helper function to check user state
  const checkUserState = () => {
    console.log('🔍 Current wallet state:', {
      isConnected: walletState.isConnected,
      address: walletState.address,
      hasUser: !!walletState.user,
      userWallet: walletState.user?.walletAddress,
      error: walletState.error
    });

    if (walletState.isConnected && walletState.address && !walletState.user) {
      console.warn('⚠️ DETECTED: Wallet connected but user not found!', {
        connectedAddress: walletState.address,
        userObject: walletState.user
      });
      return false;
    }
    return true;
  };

  // Initialize error suppression on mount
  useEffect(() => {
    suppressIndexedDBErrors();
  }, []);

  // Initialize Base Account SDK with proper error handling
  const initializeSDK = useCallback(async () => {
    if (sdkInitialized) return;

    try {
      logger.log('🔧 Initializing Base Account SDK...');

      // Check IndexedDB support
      const hasIndexedDB = checkIndexedDBSupport();
      if (!hasIndexedDB) {
        logger.warn('⚠️ Limited wallet functionality due to storage constraints');
      }

      // Lazy load the SDK to avoid immediate errors
      if (!createBaseAccountSDK) {
        const module = await import('@base-org/account');
        createBaseAccountSDK = module.createBaseAccountSDK;
      }

      // Check if we're in a secure context (required for some wallet features)
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        logger.warn('⚠️ Not in secure context, some wallet features may not work');
      }

      const baseAccountSDK = createBaseAccountSDK({
        appName: 'Dektirk',
        appLogoUrl: '/favicon.ico', // Use relative path to avoid CORS issues
        // Add configuration to handle storage errors gracefully
        options: {
          enableAnalytics: false, // Disable analytics to prevent IndexedDB errors
          storageType: 'memory', // Use memory storage as fallback
          crossOriginIsolated: false, // Disable cross-origin isolation checks
        }
      });

      const walletProvider = baseAccountSDK.getProvider();

      setProvider(walletProvider);
      setSdkInitialized(true);
      logger.log('✅ Base Account SDK initialized successfully');

    } catch (error: any) {
      logger.error('❌ Error initializing Base Account SDK:', error);
      // Don't set this as a critical error - the app should still work without wallet
      logger.log('🔄 App will continue without wallet functionality');
      setSdkInitialized(false);
    }
  }, [sdkInitialized]);

  // Initialize SDK on mount
  useEffect(() => {
    initializeSDK();
  }, [initializeSDK]);

  // Function to create or get user from database using API endpoint
  const createOrGetUser = useCallback(async (walletAddress: string) => {
    console.log('👤 Starting createOrGetUser for address:', walletAddress);
    console.log('🔍 Current wallet state before API call:', {
      isConnected: walletState.isConnected,
      address: walletState.address,
      hasUser: !!walletState.user,
      error: walletState.error
    });

    if (!walletAddress) {
      console.error('❌ No wallet address provided to createOrGetUser');
      setWalletState(prev => ({
        ...prev,
        error: 'No wallet address provided',
      }));
      return;
    }

    try {
      console.log('🔄 Creating/getting user via API endpoint:', walletAddress);

      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: walletAddress,
          userData: {
            username: `user_${walletAddress.slice(-8)}`,
            displayName: `User ${walletAddress.slice(-8)}`
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create/get user');
      }

      console.log('📊 Full API Response:', JSON.stringify(result, null, 2));

      if (result && result.success === true && result.data) {
        console.log('✅ User operation successful:', {
          username: result.data.username,
          walletAddress: result.data.walletAddress,
          viewCredits: result.data.viewCredits,
          isNewUser: result.isNewUser
        });

        console.log('Setting wallet state with user data:', {
          user: result.data,
          username: result.data?.username,
          viewCredits: result.data?.viewCredits,
          walletAddress: result.data?.walletAddress
        });

        setWalletState(prev => {
          const newState = {
            ...prev,
            isConnected: true, // Ensure connection state is true
            address: walletAddress,
            user: result.data,
            isNewUser: result.isNewUser || false,
            error: null, // Clear any previous errors
          };
          console.log('New wallet state after user data:', newState);
          return newState;
        });

        // Force a re-render by updating a dummy state
        setTimeout(() => {
          console.log('Forcing state refresh...');
          setWalletState(prev => ({ ...prev }));
        }, 100);

        // Additional verification
        if (result.data.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
          console.log('✅ Wallet address verification passed');
        } else {
          console.warn('⚠️ Wallet address mismatch:', {
            expected: walletAddress.toLowerCase(),
            received: result.data.walletAddress.toLowerCase()
          });
        }

        if (result.isNewUser) {
          console.log('🆕 New user created successfully:', result.data);
        } else {
          console.log('👋 Existing user logged in:', result.data);
        }
      } else {
        console.error('❌ User creation/retrieval failed:', result);
        setWalletState(prev => ({
          ...prev,
          error: result?.error || 'Failed to create or get user',
        }));
      }
    } catch (error) {
      console.error('❌ Error in createOrGetUser:', error);
      // In dev mode, create a temporary in-memory user so the app remains usable
      if (isDev && walletAddress) {
        console.warn('🧪 DEV: Falling back to temporary user due to API error');
        const tempUser = {
          _id: walletAddress.toLowerCase(), // Add _id field for consistency
          walletAddress: walletAddress.toLowerCase(),
          username: `user_${walletAddress.slice(-8)}`,
          displayName: `User ${walletAddress.slice(-8)}`,
          avatar: '',
          bio: '',
          viewCredits: 3,
          totalTipsEarned: 0,
          totalTipsSpent: 0,
          videosWatched: [],
          videosUnlocked: [],
          favoriteCategories: [],
          isActive: true,
          lastLoginAt: new Date().toISOString(),
          userContainer: {
            purchasedVideos: [],
            uploadedVideos: [],
            watchHistory: [],
            preferences: {
              autoPlay: true,
              notifications: true,
              theme: 'auto'
            }
          }
        };

        setWalletState(prev => ({
          ...prev,
          isConnected: true,
          address: walletAddress,
          user: tempUser,
          isNewUser: false,
          error: `DEV fallback user initialized: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }));
      } else {
        setWalletState(prev => ({
          ...prev,
          error: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }));
      }
    }
  }, [walletState.isConnected, walletState.address, walletState.user, walletState.error]);

  // Check for existing wallet connection on page load
  const checkExistingConnection = useCallback(async () => {
    if (!provider || !sdkInitialized) return;

    try {
      console.log('🔍 Checking for existing wallet connection...');

      // Check if wallet is already connected
      const accounts = await provider.request({ method: 'eth_accounts' });

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        console.log('✅ Found existing wallet connection:', address);

        setWalletState(prev => ({
          ...prev,
          isConnected: true,
          address: address,
          error: null,
        }));

        // Fetch user data for the connected wallet
        console.log('👤 Fetching user data for existing connection...');
        await createOrGetUser(address);
      } else {
        console.log('ℹ️ No existing wallet connection found');
      }
    } catch (error: any) {
      console.log('⚠️ Error checking existing connection:', error.message);
      // Don't set this as an error since it's just a check
    }
  }, [provider, sdkInitialized, createOrGetUser]);

  // Check for existing connection when SDK is ready
  useEffect(() => {
    if (provider && sdkInitialized) {
      checkExistingConnection();
    }
  }, [provider, sdkInitialized, checkExistingConnection]);

  // Set up event listeners only after SDK is initialized
  useEffect(() => {
    if (!provider || !sdkInitialized) return;

    console.log('🎧 Setting up wallet event listeners...');

    // Listen for account changes
    const handleAccountsChanged = async (accounts: string[]) => {
      console.log('🔄 Account change detected:', accounts);
      if (accounts.length > 0) {
        console.log('✅ New account connected:', accounts[0]);
        setWalletState(prev => ({
          ...prev,
          isConnected: true,
          address: accounts[0],
          error: null,
        }));

        // Create or get user from database
        console.log('👤 Creating/fetching user for wallet:', accounts[0]);
        await createOrGetUser(accounts[0]);
      } else {
        console.log('🔌 Wallet disconnected');
        setWalletState(prev => ({
          ...prev,
          isConnected: false,
          address: null,
          user: null,
          isNewUser: false,
        }));
      }
    };

    // Listen for chain changes
    const handleChainChanged = (chainId: string) => {
      console.log('🔗 Chain changed to:', chainId, '(decimal:', parseInt(chainId, 16), ')');
      // Optionally handle chain changes
    };

    try {
      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);
    } catch (error) {
      console.error('❌ Error setting up event listeners:', error);
    }

    return () => {
      try {
        provider.removeListener('accountsChanged', handleAccountsChanged);
        provider.removeListener('chainChanged', handleChainChanged);
      } catch (error) {
        console.error('❌ Error removing event listeners:', error);
      }
    };
  }, [provider, sdkInitialized, createOrGetUser]);

  // Refresh user data from database using API endpoint
  const refreshUser = useCallback(async () => {
    if (!walletState.address) {
      console.log('⚠️ No wallet address available for refresh');
      return;
    }

    try {
      console.log('🔄 Refreshing user data via API endpoint:', walletState.address);

      const response = await fetch(`/api/users/${walletState.address}`);

      if (!response.ok) {
        if (response.status === 404) {
          console.log('👤 User not found, creating new user...');
          await createOrGetUser(walletState.address);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch user data');
      }

      console.log('✅ User data refreshed from API:', {
        username: result.data.username,
        viewCredits: result.data.viewCredits,
        walletAddress: result.data.walletAddress
      });

      setWalletState(prev => ({
        ...prev,
        user: result.data,
        error: null
      }));

    } catch (error: any) {
      console.error('❌ Error refreshing user data:', error);
      if (isDev && walletState.address) {
        console.warn('🧪 DEV: Keeping existing temporary user after refresh failure');
        setWalletState(prev => ({
          ...prev,
          // preserve any existing temp user; ensure connected state remains
          isConnected: true,
          address: walletState.address,
          error: `Failed to refresh user data (dev fallback active): ${error.message}`
        }));
      } else {
        setWalletState(prev => ({
          ...prev,
          error: `Failed to refresh user data: ${error.message}`
        }));
      }
    }
  }, [walletState.address, createOrGetUser]);

  const connect = useCallback(async () => {
    console.log('🚀 Starting Base Account connection process...');

    if (!provider) {
      console.error('❌ Wallet provider not initialized');
      setWalletState(prev => ({
        ...prev,
        error: 'Wallet provider not initialized',
      }));
      return;
    }

    console.log('⏳ Setting connecting state...');
    setWalletState(prev => ({
      ...prev,
      isConnecting: true,
      error: null,
    }));

    try {
      // Generate a fresh nonce for authentication
      const generateNonce = () => {
        return crypto.randomUUID().replace(/-/g, '');
      };

      console.log('🔐 Connecting with Base Account using wallet_connect...');
      const nonce = generateNonce();

      // Connect and authenticate using the new wallet_connect method
      const { accounts } = await provider.request({
        method: 'wallet_connect',
        params: [{
          version: '1',
          capabilities: {
            signInWithEthereum: {
              nonce,
              chainId: `0x${CURRENT_CHAIN_ID.toString(16)}` // Current network chain ID
            }
          }
        }]
      });

      const { address } = accounts[0];
      const { message, signature } = accounts[0].capabilities.signInWithEthereum;

      console.log('✅ Base Account connected successfully:', address);
      console.log('📝 Authentication data received:', { address, message: message?.slice(0, 50) + '...', signature: signature?.slice(0, 20) + '...' });

      setWalletState(prev => ({
        ...prev,
        isConnected: true,
        address: address,
        isConnecting: false,
      }));

      // Create or get user from database
      console.log('👤 Creating/fetching user after connection...');
      await createOrGetUser(address);

      // Check user state after creation attempt
      setTimeout(() => {
        checkUserState();
      }, 1000); // Give time for state updates

    } catch (error: any) {
      console.error('💥 Error connecting to Base Account:', error);
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to connect Base Account',
      }));
    }
  }, [provider, createOrGetUser, checkUserState]);

  const disconnect = useCallback(async () => {
    console.log('🔌 Starting wallet disconnection...');
    if (!provider) {
      console.log('⚠️ No provider available for disconnection');
      return;
    }

    try {
      console.log('🔄 Calling provider disconnect...');
      await provider.disconnect();
      console.log('✅ Wallet disconnected successfully');
      setWalletState({
        isConnected: false,
        address: null,
        isConnecting: false,
        error: null,
        user: null,
        isNewUser: false
      });
    } catch (error: any) {
      console.error('❌ Error disconnecting wallet:', error);
      setWalletState(prev => ({
        ...prev,
        error: error.message || 'Failed to disconnect wallet',
      }));
    }
  }, [provider]);

  const switchToBase = useCallback(async () => {
    console.log('🔗 Switching to Base mainnet...');
    if (!provider) {
      console.error('❌ Wallet provider not initialized');
      setWalletState(prev => ({
        ...prev,
        error: 'Wallet provider not initialized',
      }));
      return;
    }

    try {
      // Update network state to mainnet
      setCurrentNetwork({
        chainId: BASE_MAINNET_CHAIN_ID,
        rpc: BASE_MAINNET_RPC_URL,
        paymaster: PAYMASTER_MAINNET,
        isTestnet: false,
        name: 'Base Mainnet'
      });

      console.log('🔄 Requesting chain switch to Base mainnet...');
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${BASE_MAINNET_CHAIN_ID.toString(16)}` }],
      });
      console.log('✅ Successfully switched to Base mainnet');
    } catch (switchError: any) {
      console.log('⚠️ Chain switch failed:', switchError.code);
      // If the chain hasn't been added to the wallet, add it
      if (switchError.code === 4902) {
        try {
          console.log('➕ Adding Base network...');
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${BASE_MAINNET_CHAIN_ID.toString(16)}`,
              chainName: 'Base Mainnet',
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: [BASE_MAINNET_RPC_URL],
              blockExplorerUrls: ['https://basescan.org'],
            }],
          });
          logger.debug('✅ Base network added successfully');
        } catch (addError: any) {
          logger.error('❌ Error adding Base network:', addError);
          setWalletState(prev => ({
            ...prev,
            error: addError.message || 'Failed to add Base network',
          }));
        }
      } else {
        logger.error('❌ Error switching to Base network:', switchError);
        setWalletState(prev => ({
          ...prev,
          error: switchError.message || 'Failed to switch to Base network',
        }));
      }
    }
  }, [provider]);

  // Switch to testnet
  const switchToTestnet = useCallback(async () => {
    console.log('🔗 Switching to Base Sepolia testnet...');
    if (!provider) {
      console.error('❌ Wallet provider not initialized');
      setWalletState(prev => ({
        ...prev,
        error: 'Wallet provider not initialized',
      }));
      return;
    }

    try {
      // Update network state first
      setCurrentNetwork({
        chainId: BASE_SEPOLIA_CHAIN_ID,
        rpc: BASE_SEPOLIA_RPC_URL,
        paymaster: PAYMASTER_TESTNET,
        isTestnet: true,
        name: 'Base Sepolia Testnet'
      });

      console.log('🔄 Requesting chain switch to Base Sepolia...');
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${BASE_SEPOLIA_CHAIN_ID.toString(16)}` }],
      });
      console.log('✅ Successfully switched to Base Sepolia testnet');
    } catch (switchError: any) {
      console.log('⚠️ Chain switch failed:', switchError.code);
      if (switchError.code === 4902) {
        try {
          console.log('➕ Adding Base Sepolia network...');
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${BASE_SEPOLIA_CHAIN_ID.toString(16)}`,
              chainName: 'Base Sepolia',
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: [BASE_SEPOLIA_RPC_URL],
              blockExplorerUrls: ['https://sepolia.basescan.org'],
            }],
          });
          logger.debug('✅ Base Sepolia network added successfully');
        } catch (addError: any) {
          logger.error('❌ Error adding Base Sepolia network:', addError);
          setWalletState(prev => ({
            ...prev,
            error: addError.message || 'Failed to add Base Sepolia network',
          }));
        }
      } else {
        logger.error('❌ Error switching to Base Sepolia network:', switchError);
        setWalletState(prev => ({
          ...prev,
          error: switchError.message || 'Failed to switch to Base Sepolia network',
        }));
      }
    }
  }, [provider]);

  // Send gasless transaction using paymaster
  const sendGaslessTransaction = useCallback(async (to: string, data: string, value: string = '0x0'): Promise<string> => {
    console.log('💸 Sending gasless transaction...');
    if (!provider) {
      throw new Error('Wallet provider not initialized');
    }

    if (!currentNetwork.paymaster) {
      throw new Error(`No paymaster configured for ${currentNetwork.isTestnet ? 'testnet' : 'mainnet'}`);
    }

    try {
      const accounts = await provider.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No wallet accounts available');
      }

      const from = accounts[0];
      console.log('📤 Preparing gasless transaction:', { from, to, data, value, paymaster: currentNetwork.paymaster });

      // Get nonce
      const nonce = await provider.request({
        method: 'eth_getTransactionCount',
        params: [from, 'pending']
      });

      // Estimate gas
      const gasEstimate = await provider.request({
        method: 'eth_estimateGas',
        params: [{ from, to, data, value }]
      });

      // Prepare transaction with paymaster
      const transaction = {
        from,
        to,
        data,
        value,
        gas: gasEstimate,
        gasPrice: '0x0', // Set to 0 for gasless transaction
        nonce,
        // Add paymaster data for EIP-4337 or custom paymaster implementation
        paymasterAndData: currentNetwork.paymaster
      };

      console.log('🚀 Sending transaction with paymaster...');
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [transaction]
      });

      console.log('✅ Gasless transaction sent:', txHash);
      return txHash;
    } catch (error: any) {
      console.error('❌ Error sending gasless transaction:', error);
      throw new Error(error.message || 'Failed to send gasless transaction');
    }
  }, [provider, currentNetwork]);

  // Get current network information
  const getCurrentNetwork = useCallback(() => {
    return currentNetwork;
  }, [currentNetwork]);

  return {
    ...walletState,
    connect,
    disconnect,
    switchToBase,
    switchToTestnet,
    refreshUser,
    checkUserState, // Expose for debugging
    sendGaslessTransaction,
    getCurrentNetwork,
  };
};
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
  refreshUser: () => Promise<void>;
  checkUserState: () => boolean;
}

const BASE_CHAIN_ID = 8453; // Base Mainnet
const BASE_RPC_URL = 'https://mainnet.base.org';

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
        message.includes('checkCrossOriginOpenerPolicy')
      ) {
        // Log as warning instead of error
        console.warn('🔇 Suppressed storage error:', ...args);
        return;
      }
      originalError.apply(console, args);
    };
  }
};

export const useBaseWallet = (): UseBaseWalletReturn => {
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
  }, [provider, sdkInitialized]);

  // Function to create or get user from database
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
      console.log('📡 Importing user API...');
      const { createOrGetUserByWallet } = await import('@/api/users');
      console.log('📦 API module imported successfully');

      console.log('🚀 Calling createOrGetUserByWallet API...');
      const result = await createOrGetUserByWallet(walletAddress);

      console.log('📊 Full API Response:', JSON.stringify(result, null, 2));

      if (result && result.success === true && result.data) {
        console.log('✅ User operation successful:', {
          username: result.data.username,
          walletAddress: result.data.walletAddress,
          isNewUser: result.isNewUser
        });

        console.log('🔄 Updating wallet state with user data...');
        setWalletState(prev => {
          const newState = {
            ...prev,
            user: result.data,
            isNewUser: result.isNewUser || false,
            error: null, // Clear any previous errors
          };
          console.log('📝 New wallet state after user update:', {
            isConnected: newState.isConnected,
            address: newState.address,
            hasUser: !!newState.user,
            username: newState.user?.username,
            error: newState.error
          });
          return newState;
        });

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

        // Verify state was actually updated
        setTimeout(() => {
          console.log('🔍 Verifying state update after 100ms...');
          console.log('Current walletState after user creation:', {
            isConnected: walletState.isConnected,
            address: walletState.address,
            hasUser: !!walletState.user,
            username: walletState.user?.username,
            error: walletState.error
          });
        }, 100);

      } else {
        const errorMsg = result?.error || 'Unknown error occurred';
        console.error('❌ API returned error:', {
          success: result?.success,
          error: errorMsg,
          hasData: !!result?.data
        });

        if (errorMsg.toLowerCase().includes('not found')) {
          console.log('🔍 User not found scenario detected - this should not happen in createOrGetUser');
        }

        setWalletState(prev => ({
          ...prev,
          error: `User operation failed: ${errorMsg}`,
          user: null,
        }));
      }
    } catch (error: any) {
      console.group('🚨 createOrGetUser Error');
      console.error('Error details:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      console.error('Wallet address:', walletAddress);
      console.groupEnd();

      // Check for specific error types
      if (error?.message?.includes('UnknownError') || error?.message?.includes('Internal error')) {
        console.error('🔍 DETECTED UNKNOWN/INTERNAL ERROR in createOrGetUser:', {
          error: error,
          message: error?.message,
          stack: error?.stack,
          walletAddress: walletAddress,
          timestamp: new Date().toISOString()
        });
      }

      setWalletState(prev => ({
        ...prev,
        error: `Failed to create/get user: ${error?.message || 'Unknown error'}`,
        user: null,
        isNewUser: false
      }));
    }
  }, [walletState]);

  // Function to refresh user data
  const refreshUser = useCallback(async () => {
    console.log('🔄 Refreshing user data...');
    if (walletState.address) {
      console.log('📍 Current wallet address:', walletState.address);
      await createOrGetUser(walletState.address);

      // Check state after refresh
      setTimeout(() => {
        checkUserState();
      }, 500);
    } else {
      console.log('⚠️ No wallet address available for refresh');
    }
  }, [walletState.address, createOrGetUser, checkUserState]);

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
              chainId: `0x${BASE_CHAIN_ID.toString(16)}` // Base Mainnet - 8453
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
  }, [provider, createOrGetUser]);

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
    console.log('🔗 Switching to Base network...');
    if (!provider) {
      console.error('❌ Wallet provider not initialized');
      setWalletState(prev => ({
        ...prev,
        error: 'Wallet provider not initialized',
      }));
      return;
    }

    try {
      console.log('🔄 Requesting chain switch to Base...');
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${BASE_CHAIN_ID.toString(16)}` }],
      });
      console.log('✅ Successfully switched to Base network');
    } catch (switchError: any) {
      console.log('⚠️ Chain switch failed:', switchError.code);
      // If the chain hasn't been added to the wallet, add it
      if (switchError.code === 4902) {
        try {
          console.log('➕ Adding Base network...');
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${BASE_CHAIN_ID.toString(16)}`,
              chainName: 'Base',
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: [BASE_RPC_URL],
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

  return {
    ...walletState,
    connect,
    disconnect,
    switchToBase,
    refreshUser,
    checkUserState, // Expose for debugging
  };
};
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

// Suppress IndexedDB/Analytics noise in console and global events
const suppressIndexedDBErrors = () => {
  if (typeof window === 'undefined') return;

  const originalError = window.console.error.bind(console);

  const shouldSuppress = (args: unknown[]): boolean => {
    try {
      const text = args
        .map((a: any) => {
          if (typeof a === 'string') return a;
          if (a instanceof Error) return a.message || '';
          if (typeof a === 'object') {
            try { return JSON.stringify(a); } catch { return ''; }
          }
          return '';
        })
        .join(' ');
      return [
        'IndexedDB:Get:InternalError',
        'Internal error when calculating storage usage',
        'Analytics SDK',
        'cca-lite.coinbase.com',
        'checkCrossOriginOpenerPolicy',
        'net::ERR_ABORTED',
        'net::ERR_NAME_NOT_RESOLVED',
        'net::ERR_NETWORK_IO_SUSPENDED'
      ].some((sig) => text.includes(sig));
    } catch {
      return false;
    }
  };

  window.console.error = (...args: any[]) => {
    if (shouldSuppress(args)) return;
    originalError(...args);
  };

  // Suppress global error noise
  window.addEventListener('error', (e: ErrorEvent) => {
    const msg = e.message || e.error?.message || '';
    if (
      msg.includes('IndexedDB') ||
      msg.includes('Analytics SDK') ||
      msg.includes('checkCrossOriginOpenerPolicy') ||
      msg.includes('net::ERR_ABORTED')
    ) {
      e.preventDefault();
    }
  });

  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    const reason: any = e.reason;
    const text = typeof reason === 'string' ? reason : (reason?.message || '');
    if (
      text.includes('IndexedDB') ||
      text.includes('Analytics SDK') ||
      text.includes('cca-lite.coinbase.com')
    ) {
      e.preventDefault();
    }
  });
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
  const initializeSDK = useCallback(async (): Promise<any> => {
    if (sdkInitialized) return;

    try {
      logger.log('🔧 Initializing Base Account SDK...');

      // Guard against insecure/non-COI contexts (avoid noisy SDK checks in dev/preview)
      if (typeof window !== 'undefined') {
        const isSecure = window.isSecureContext === true;
        const isCOI = (window as any).crossOriginIsolated === true;
        const enableEnv = (import.meta.env?.VITE_ENABLE_WALLET || '').toLowerCase() === 'true';
        const isProd = import.meta.env?.PROD === true;
        if (!(enableEnv || (isProd && isSecure && isCOI))) {
          logger.warn('🔇 Wallet SDK disabled: insecure/dev context (secure/coi not satisfied).');
          setSdkInitialized(false);
          return undefined;
        }
      }

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
      return walletProvider;

    } catch (error: any) {
      // Suppress expected COOP/COEP probe errors
      if (
        error instanceof Error &&
        (error.message.includes('COOP') || error.message.includes('Cross-Origin-Opener-Policy') || error.message.includes('net::ERR_ABORTED'))
      ) {
        logger.warn('🔇 COOP/COEP check failed (expected in dev).');
      } else {
        logger.error('❌ Error initializing Base Account SDK:', error);
      }
      // Don't set this as a critical error - the app should still work without wallet
      logger.log('🔄 App will continue without wallet functionality');
      setSdkInitialized(false);
      return undefined;
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
            // Let backend handle username generation to avoid duplicates
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
      console.warn('⏳ Wallet provider not ready, attempting initialization...');
      const newProvider = await initializeSDK();
      if (!newProvider) {
        console.error('❌ Wallet provider not initialized');
        setWalletState(prev => ({
          ...prev,
          error: 'Wallet provider not initialized. Set VITE_ENABLE_WALLET=true in .env and restart the dev server.',
        }));
        return;
      }
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
  }, [provider, createOrGetUser, checkUserState, initializeSDK]);

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

  // Send transaction (wallet handles fees). Includes network preflight check.
  const sendGaslessTransaction = useCallback(async (to: string, data: string, value: string = '0x0'): Promise<string> => {
    console.log('💸 Preparing transaction send...');
    if (!provider) {
      throw new Error('Wallet provider not initialized');
    }

    try {
      // Ensure wallet is on expected chain
      const chainIdHex = await provider.request({ method: 'eth_chainId' });
      const expectedHex = `0x${currentNetwork.chainId.toString(16)}`;
      if (chainIdHex !== expectedHex) {
        console.warn('⚠️ Wrong network detected', { chainIdHex, expectedHex, currentNetwork });
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: expectedHex }]
          });
          console.log('✅ Switched to expected network:', expectedHex);
        } catch (switchErr: any) {
          console.error('❌ Failed to switch network:', switchErr);
          throw new Error(`Wrong network. Please switch to ${currentNetwork.name}.`);
        }
      }

      const accounts = await provider.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No wallet accounts available');
      }

      const from = accounts[0];
      console.log('📤 Building transaction:', { from, to, value });

      // Estimate gas; omit unsupported fields and let wallet set fees
      const gasEstimate = await provider.request({
        method: 'eth_estimateGas',
        params: [{ from, to, data, value }]
      });

      const nonce = await provider.request({
        method: 'eth_getTransactionCount',
        params: [from, 'pending']
      });

      const transaction: any = {
        from,
        to,
        data,
        value,
        gas: gasEstimate,
        nonce
        // Do NOT set gasPrice/maxFee here; wallet/provider will populate EIP-1559 fees.
        // Do NOT include custom fields like paymasterAndData in eth_sendTransaction.
      };

      console.log('🚀 Sending transaction...');
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [transaction]
      });

      console.log('✅ Transaction sent:', txHash);
      return txHash;
    } catch (error: any) {
      const msg = error?.data?.message || error?.details || error?.message || 'Failed to send transaction';
      console.error('❌ Transaction error:', { message: msg, error });
      throw new Error(msg);
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
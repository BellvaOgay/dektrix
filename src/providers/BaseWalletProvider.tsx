import React, { createContext, useContext, ReactNode } from 'react';
import { useBaseWallet } from '@/hooks/useBaseWallet';

interface BaseWalletContextType {
  isConnected: boolean;
  address: string | null;
  isConnecting: boolean;
  error: string | null;
  user: any | null;
  isNewUser: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchToBase: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkUserState: () => boolean;
}

const BaseWalletContext = createContext<BaseWalletContextType | undefined>(undefined);

interface BaseWalletProviderProps {
  children: ReactNode;
}

export const BaseWalletProvider: React.FC<BaseWalletProviderProps> = ({ children }) => {
  const walletState = useBaseWallet();

  return (
    <BaseWalletContext.Provider value={walletState}>
      {children}
    </BaseWalletContext.Provider>
  );
};

export const useBaseWalletContext = () => {
  const context = useContext(BaseWalletContext);
  if (context === undefined) {
    throw new Error('useBaseWalletContext must be used within a BaseWalletProvider');
  }
  return context;
};

export default BaseWalletProvider;
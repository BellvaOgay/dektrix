import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet, Loader2, ExternalLink } from 'lucide-react';
import { useBaseWallet } from '@/hooks/useBaseWallet';
import { useToast } from '@/hooks/use-toast';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletConnectModal: React.FC<WalletConnectModalProps> = ({ isOpen, onClose }) => {
  const { connect, isConnecting, error, isConnected, address, switchToBase } = useBaseWallet();
  const { toast } = useToast();
  const [isConnectingBase, setIsConnectingBase] = useState(false);

  const handleConnectBase = async () => {
    setIsConnectingBase(true);
    try {
      await connect();

      // Check if connection was successful
      if (isConnected && address) {
        toast({
          title: "Base Account Connected! 🎉",
          description: `Signed in with Base: ${address.slice(0, 6)}...${address.slice(-4)}`,
        });
        onClose();
      }
    } catch (err: any) {
      console.error('Connection error:', err);
      toast({
        title: "Connection Failed",
        description: err.message || error || "Failed to sign in with Base Account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnectingBase(false);
    }
  };

  // Auto-close modal if connection succeeds
  React.useEffect(() => {
    if (isConnected && address && isOpen) {
      toast({
        title: "Base Account Connected! 🎉",
        description: `Signed in with Base: ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
      onClose();
    }
  }, [isConnected, address, isOpen, onClose, toast]);

  const handleConnectOther = () => {
    toast({
      title: "Coming Soon",
      description: "Other wallet integrations will be available soon!",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Unlock Premium Content
          </DialogTitle>
          <DialogDescription>
            Connect your Base Account to access premium videos, exclusive content, and advanced features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Base Wallet (Coinbase Smart Wallet) */}
          <div className="space-y-2">
            <Button
              onClick={handleConnectBase}
              disabled={isConnectingBase || isConnecting}
              className="w-full h-16 flex items-center justify-between p-4 border border-border hover:border-primary/50 bg-card hover:bg-card/80 text-left disabled:opacity-50"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-white"
                  >
                    <path
                      d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z"
                      fill="currentColor"
                    />
                    <path
                      d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z"
                      fill="#0052FF"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">Sign in with Base</div>
                  <div className="text-sm text-muted-foreground">
                    {isConnectingBase || isConnecting ? 'Connecting...' : 'Unlock premium videos & features'}
                  </div>
                </div>
              </div>
              {(isConnectingBase || isConnecting) ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ExternalLink className="w-5 h-5" />
              )}
            </Button>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium">Connection Error</p>
                <p className="text-xs text-destructive/80 mt-1">{error}</p>
              </div>
            )}
          </div>

          {/* Other Wallets - Coming Soon */}
          <div className="space-y-2">
            <Button
              onClick={handleConnectOther}
              className="w-full h-16 flex items-center justify-between p-4 border border-border hover:border-primary/50 bg-card hover:bg-card/80 text-left opacity-60"
              variant="outline"
              disabled
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold">Other Wallets</div>
                  <div className="text-sm text-muted-foreground">MetaMask, WalletConnect & more</div>
                </div>
              </div>
              <div className="text-xs bg-muted px-2 py-1 rounded">
                Coming Soon
              </div>
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          By connecting your Base Account, you agree to our Terms of Service and Privacy Policy.
          <br />
          <span className="text-green-500 font-medium">Free content is available without connecting.</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletConnectModal;
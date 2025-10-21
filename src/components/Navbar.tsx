import { useState } from "react";
import { Brain, Wallet, Home, Play, Video, ChevronDown, Copy, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import WalletConnectModal from "./WalletConnectModal";
import { useBaseWallet } from "@/hooks/useBaseWallet";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const { isConnected, address, user, disconnect, refreshUser } = useBaseWallet();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Debug logging
  console.log('🔍 Navbar Debug:', { 
    isConnected, 
    address, 
    hasAddress: !!address,
    user: user ? {
      username: user.username,
      viewCredits: user.viewCredits,
      walletAddress: user.walletAddress
    } : null
  });

  const getCurrentTab = () => {
    if (location.pathname === "/videos") return "videos";
    return "home";
  };
  
  const currentTab = getCurrentTab();

  const handleTabChange = (value: string) => {
    if (value === "home") {
      navigate("/");
    } else if (value === "videos") {
      navigate("/videos");
    }
  };

  const handleWalletClick = () => {
    if (!isConnected) {
      setIsWalletModalOpen(true);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected successfully.",
    });
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard.",
      });
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-primary animate-float" />
              <span className="text-2xl font-bold text-gradient">Dektrix</span>
            </div>
            
            {/* Navigation Tabs */}
            <Tabs value={currentTab} onValueChange={handleTabChange} className="hidden md:block">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="home" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Home
                </TabsTrigger>
                <TabsTrigger value="videos" className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Videos
                </TabsTrigger>

              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Wallet Info Display */}
            {isConnected && user && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded-lg">
                  <span className="text-primary font-medium text-xs sm:text-sm">{user.username}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 rounded-lg">
                  <Video className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  <span className="text-green-500 font-medium text-xs sm:text-sm">{user.viewCredits}</span>
                </div>
              </div>
            )}
            
            {/* Debug info - Enhanced for troubleshooting */}
            <div className="text-xs text-gray-400 mr-2 border border-gray-600 px-2 py-1 rounded">
              <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
              <div>Address: {address ? formatAddress(address) : 'No'}</div>
              <div>User: {user ? 'Yes' : 'No'}</div>
              {user && (
                <div className="text-green-400">
                  <div>Username: {user.username || 'N/A'}</div>
                  <div>Credits: {user.viewCredits ?? 'N/A'}</div>
                </div>
              )}
              {isConnected && address && !user && (
                 <div className="text-red-400">
                   <div>⚠️ Connected but no user data!</div>
                   <button 
                     onClick={() => {
                       console.log('Refreshing user data...');
                       refreshUser();
                     }}
                     className="text-blue-400 underline text-xs hover:text-blue-300"
                   >
                     Refresh User
                   </button>
                 </div>
               )}
            </div>
            
            {isConnected && address ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="cyber" size="sm" className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    {formatAddress(address)}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>Wallet Connected</span>
                      {user && (
                        <div className="text-xs text-muted-foreground mt-1">
                          <div>User: {user.username}</div>
                          <div>Credits: {user.viewCredits}</div>
                        </div>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCopyAddress} className="cursor-pointer">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Address
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="cyber" size="sm" onClick={handleWalletClick}>
                <Wallet className="w-4 h-4" />
                Connect
              </Button>
            )}
          </div>
        </div>
      </nav>

      <WalletConnectModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
      />
    </>
  );
};

export default Navbar;

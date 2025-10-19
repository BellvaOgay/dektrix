import { useState } from "react";
import { Brain, Wallet, Home, Play, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WalletConnectModal from "./WalletConnectModal";
import { useBaseWallet } from "@/hooks/useBaseWallet";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const { isConnected, address, disconnect } = useBaseWallet();
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab = location.pathname === "/videos" ? "videos" : "home";

  const handleTabChange = (value: string) => {
    if (value === "home") {
      navigate("/");
    } else if (value === "videos") {
      navigate("/videos");
    }
  };

  const handleWalletClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      setIsWalletModalOpen(true);
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
            <Button variant="cyber" size="sm" onClick={handleWalletClick}>
              <Wallet className="w-4 h-4" />
              {isConnected && address ? formatAddress(address) : "Connect"}
            </Button>
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

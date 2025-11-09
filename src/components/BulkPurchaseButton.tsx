import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap, Loader2 } from "lucide-react";
import { paymasterService } from "@/lib/paymaster";
import { useBaseWallet } from "@/hooks/useBaseWallet";
import { toast } from "@/hooks/use-toast";

export function BulkPurchaseButton() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { sendGaslessTransaction, isConnected, connect } = useBaseWallet();

  const handleBulkPurchase = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to make a purchase",
        variant: "destructive",
      });
      await connect();
      return;
    }

    setIsProcessing(true);
    
    try {
      // Show loading state
      toast({
        title: "Processing Bulk Purchase",
        description: "Please confirm the transaction in your wallet...",
        variant: "default",
      });
      
      // Process bulk payment (1 USDC for 12 views)
      const result = await paymasterService.processVideoPayment(
        sendGaslessTransaction,
        1, // 1 USDC
        'bulk'
      );
      
      if (result.success && result.transactionHash) {
        // Payment successful
        toast({
          title: "Bulk Purchase Successful!",
          description: "You've purchased 12 video views for 1 USDC!",
          variant: "default",
        });
        
        // Refresh user data to show updated credits
        window.location.reload();
      } else {
        // Payment failed
        toast({
          title: "Purchase Failed",
          description: result.error || "Payment could not be processed",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Bulk purchase error:', error);
      toast({
        title: "Purchase Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handleBulkPurchase}
      disabled={isProcessing}
      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
      size="lg"
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <Zap className="mr-2 h-5 w-5" />
          Get 12 Views for 1 USDC
        </>
      )}
    </Button>
  );
}
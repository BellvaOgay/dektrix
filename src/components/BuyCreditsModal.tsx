import { useState } from "react";
import { X, Zap, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBaseWallet } from "@/hooks/useBaseWallet";
import { paymasterService } from "@/lib/paymaster";
import { addViewCredits } from "@/api/users";
import { toast } from "@/hooks/use-toast";

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreditsPurchased?: (creditsAdded: number, newBalance: number) => void;
}

const creditPackages = [
  { credits: 10, price: 1, priceDisplay: "1 USDC", value: "10 credits for 1 USDC" },
  { credits: 21, price: 2, priceDisplay: "2 USDC", value: "21 credits for 2 USDC" },
  { credits: 43, price: 4, priceDisplay: "4 USDC", value: "43 credits for 4 USDC" }
];

export function BuyCreditsModal({ isOpen, onClose, onCreditsPurchased }: BuyCreditsModalProps) {
  const [selectedPackage, setSelectedPackage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user: walletUser, sendGaslessTransaction } = useBaseWallet();

  const handlePurchase = async () => {
    if (!walletUser?.walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to purchase credits.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    const packageInfo = creditPackages[selectedPackage];

    try {
      // Show loading state
      toast({
        title: "Processing Payment",
        description: `Purchasing ${packageInfo.credits} credits for ${packageInfo.priceDisplay}...`,
        variant: "default",
      });

      // Process payment via Paymaster - use 'bulk' type for credit purchases
      const paymentResult = await paymasterService.processVideoPayment(
        sendGaslessTransaction,
        packageInfo.price,
        'bulk'
      );

      if (paymentResult.success && paymentResult.transactionHash) {
        // Payment successful - add credits to user account
        const creditResult = await addViewCredits(walletUser.walletAddress, packageInfo.credits);

        if (creditResult.success) {
          toast({
            title: "Credits Purchased!",
            description: `Successfully purchased ${packageInfo.credits} credits for ${packageInfo.priceDisplay}.`,
            variant: "default",
          });

          // Notify parent component
          if (onCreditsPurchased) {
            onCreditsPurchased(packageInfo.credits, creditResult.data.viewCredits);
          }

          onClose();
        } else {
          toast({
            title: "Credit Addition Failed",
            description: creditResult.error || "Failed to add credits to your account.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Payment Failed",
          description: paymentResult.error || "Payment could not be processed.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Credit purchase error:', error);
      toast({
        title: "Purchase Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Buy Credits
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Purchase credits to unlock and watch videos. Each video view costs 1 credit.
          </p>

          <div className="space-y-3">
            {creditPackages.map((pkg, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedPackage === index
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedPackage(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedPackage === index 
                        ? "border-primary bg-primary" 
                        : "border-border"
                    }`} />
                    <div>
                      <div className="font-medium">{pkg.credits} Credits</div>
                      <div className="text-sm text-muted-foreground">{pkg.priceDisplay}</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-primary">
                    {pkg.credits / pkg.price} credits/USDC
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={isProcessing || !walletUser}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Buy {creditPackages[selectedPackage].credits} Credits
                </div>
              )}
            </Button>
          </div>

          {!walletUser && (
            <div className="text-xs text-muted-foreground text-center">
              Connect your wallet to purchase credits
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
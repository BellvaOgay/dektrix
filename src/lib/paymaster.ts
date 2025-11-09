import { encodeFunctionData, parseUnits } from 'viem';

// ERC20 ABI for transfer function
const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function'
  }
] as const;

export class PaymasterService {
  // Get USDC contract address based on network
  private getUSDCAddress(): string {
    // Default to testnet for development
    return import.meta.env.VITE_USDC_TESTNET_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
  }

  // Get receiver address for payments
  private getReceiverAddress(): string {
    return import.meta.env.VITE_CREDITS_RECEIVER_ADDRESS || '0x50d2C99358c9d3671869b75ceEE269f2F393E179';
  }

  // Process video payment (unlock or bulk purchase)
  async processVideoPayment(
    sendGaslessTransaction: (to: string, data: string, value?: string) => Promise<string>,
    amount: number,
    paymentType: 'single' | 'bulk'
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      // Convert amount to wei (USDC has 6 decimals)
      const amountInWei = parseUnits(amount.toString(), 6);
      
      // Encode the ERC20 transfer call
      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [this.getReceiverAddress(), amountInWei]
      });

      // Send gasless transaction
      const transactionHash = await sendGaslessTransaction(this.getUSDCAddress(), data, '0x0');

      return {
        success: true,
        transactionHash
      };
    } catch (error) {
      console.error('PaymasterService - Payment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Process tip payment
  async processTipPayment(
    sendGaslessTransaction: (to: string, data: string, value?: string) => Promise<string>,
    amount: number
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      // Convert amount to wei (USDC has 6 decimals)
      const amountInWei = parseUnits(amount.toString(), 6);
      
      // Encode the ERC20 transfer call
      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [this.getReceiverAddress(), amountInWei]
      });

      // Send gasless transaction
      const transactionHash = await sendGaslessTransaction(this.getUSDCAddress(), data, '0x0');

      return {
        success: true,
        transactionHash
      };
    } catch (error) {
      console.error('PaymasterService - Tip failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Export a singleton instance
export const paymasterService = new PaymasterService();
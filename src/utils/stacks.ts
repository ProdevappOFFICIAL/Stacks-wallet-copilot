export function abbreviateAddress(address: string) {
    return `${address.substring(0, 5)}...${address.substring(36)}`;
  }
  
  export function abbreviateTxnId(txnId: string) {
    return `${txnId.substring(0, 5)}...${txnId.substring(62)}`;
  }

  // Function to get STX balance from Stacks API
  export async function getSTXBalance(address: string, network: 'mainnet' | 'testnet' = 'testnet'): Promise<number> {
    try {
      const baseUrl = network === 'mainnet' 
        ? 'https://api.hiro.so' 
        : 'https://api.testnet.hiro.so';
      
      const response = await fetch(`${baseUrl}/extended/v1/address/${address}/balances`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Convert microSTX to STX (divide by 1,000,000)
      const balanceInSTX = parseInt(data.stx.balance) / 1000000;
      
      return balanceInSTX;
    } catch (error) {
      console.error('Error fetching STX balance:', error);
      throw error;
    }
  }
  
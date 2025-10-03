# Network Mismatch Troubleshooting Guide

## Problem: "There's a mismatch between your active network and the network you're logged in with on the app"

This error occurs when your wallet is connected to a different network than what your app expects.

## Quick Fix

### Step 1: Check Your App's Network Configuration
1. Open `src/utils/network.ts`
2. Check the `CURRENT_NETWORK` setting:
   ```typescript
   export const NETWORK_CONFIG = {
     CURRENT_NETWORK: 'testnet' as 'testnet' | 'mainnet', // This line determines your app's network
   };
   ```

### Step 2: Check Your Wallet's Network
1. Open your Stacks wallet (Xverse, Hiro, Leather, etc.)
2. Look for network settings (usually in settings or top of the interface)
3. Note whether you're on "Testnet" or "Mainnet"

### Step 3: Make Them Match
**Option A: Change App to Match Wallet**
- If wallet is on Mainnet, change `CURRENT_NETWORK: 'mainnet'`
- If wallet is on Testnet, change `CURRENT_NETWORK: 'testnet'`

**Option B: Change Wallet to Match App**
- Switch your wallet to the network your app is configured for

### Step 4: Restart and Reconnect
1. Restart your development server (`npm run dev`)
2. Disconnect and reconnect your wallet
3. Try your transaction again

## Common Scenarios

### Scenario 1: Development/Testing
- **App**: Set to `'testnet'`
- **Wallet**: Switch to Testnet
- **Why**: Testnet is safer for development and testing

### Scenario 2: Production
- **App**: Set to `'mainnet'`
- **Wallet**: Switch to Mainnet
- **Why**: Real transactions with real STX

## Verification Steps

After making changes:

1. **Check the connection message**: When you connect your wallet, the app should show:
   ```
   Network: TESTNET (or MAINNET)
   Your address: ST... (testnet) or SP... (mainnet)
   ```

2. **Check address format**:
   - Testnet addresses start with `ST`
   - Mainnet addresses start with `SP`

3. **Test a small transaction**: Try sending a very small amount (0.000001 STX) to verify everything works

## API Endpoint Issues

If you're experiencing issues with mainnet balance fetching or transactions:

1. **Check API endpoints**: Ensure you're using the correct Hiro API endpoints:
   - Testnet: `https://api.testnet.hiro.so`
   - Mainnet: `https://api.hiro.so` (NOT `api.stacks.co`)

2. **Network connectivity**: Test API connectivity:
   ```bash
   # Test mainnet API
   curl "https://api.hiro.so/extended/v1/info"
   
   # Test testnet API  
   curl "https://api.testnet.hiro.so/extended/v1/info"
   ```

## Still Having Issues?

1. **Clear browser cache and localStorage**
2. **Try a different wallet** (if you have multiple installed)
3. **Check wallet extension updates**
4. **Restart your browser**
5. **Verify API endpoints are correct** (see API Endpoint Issues above)

## Network-Specific Test Addresses

### Testnet
- Test recipient: `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM`
- Faucet: Get free testnet STX from the Stacks faucet

### Mainnet
- Use real addresses only
- Double-check addresses before sending
- Start with small amounts

## Prevention

- Always verify network settings before connecting
- Use testnet for development and testing
- Only use mainnet for production applications
- Keep wallet and app network settings synchronized
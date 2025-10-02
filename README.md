# Stacks Chat Assistant

An AI-powered blockchain assistant for seamless Stacks (STX) transactions through a ChatGPT-like interface.

## Features

- 🔗 **Wallet Integration**: Connect with Stacks wallets via @stacks/connect
- 💬 **Chat Interface**: Natural language commands for blockchain operations
- 📚 **Chat History**: Persistent chat sessions stored in localStorage
- 🆕 **Multiple Chats**: Create and manage multiple chat sessions
- 🔍 **Transaction Preview**: Review all transaction details before signing
- 📊 **Transaction History**: Complete transaction logging with status tracking
- ✨ **Smooth Animations**: Beautiful UI with Framer Motion
- 🛡️ **Type Safety**: Full TypeScript support
- 🎨 **Modern Design**: Tailwind CSS with gradient themes

## Supported Commands

- **Send STX**: "Send 0.01 STX to [address]"
- **Check Balance**: "What's my balance?"
- **Get Address**: "What's my address?"
- **Transaction History**: "Show my transaction history"
- **Help**: "Help" or "What can you do?"

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Blockchain**: Stacks SDK (@stacks/connect, @stacks/transactions, @stacks/network)

## Getting Started

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start development server**:

   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to `http://localhost:5173`

4. **Connect your Stacks wallet** and start chatting!

## Usage

1. Click "Connect Wallet" to connect your Stacks wallet
2. Type natural language commands in the chat
3. Review transaction details in the preview modal
4. Confirm in your wallet to execute transactions

### Chat History

- **New Chat**: Click the "New Chat" button in the sidebar to start a fresh conversation
- **Switch Chats**: Click on any chat in the sidebar to switch between conversations
- **Delete Chats**: Hover over a chat and click the trash icon to delete it
- **Collapse Sidebar**: Use the arrow button to collapse/expand the chat history sidebar
- **Auto-Save**: All chats are automatically saved to your browser's localStorage

### Transaction History

- **View History**: Click the "History" button in the header or ask "Show my transaction history"
- **Filter Transactions**: Filter by status (pending, confirmed, failed, cancelled), type, or network
- **Search**: Search transactions by address, hash, or memo
- **Transaction Details**: View complete transaction information including timestamps and fees
- **Status Tracking**: Real-time status updates from pending to confirmed/failed
- **Explorer Links**: Direct links to view transactions on Stacks Explorer
- **Copy Functions**: Easy copying of transaction hashes and addresses
- **Statistics**: Overview of total transactions, confirmed count, and STX amounts

## Example Commands

```
Send 0.01 STX to ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
What's my balance?
What's my address?
Show my transaction history
Help
```

## Network Configuration

The app uses a centralized network configuration system. To switch between testnet and mainnet:

1. Open `src/utils/network.ts`
2. Change `CURRENT_NETWORK` from `'testnet'` to `'mainnet'` (or vice versa)
3. Restart your development server

```typescript
// In src/utils/network.ts
export const NETWORK_CONFIG = {
  CURRENT_NETWORK: "mainnet" as "testnet" | "mainnet", // Change this line
  // ... rest of config
};
```

**Important**: Make sure your wallet is connected to the same network as your app configuration to avoid transaction failures.

## Security

- No private keys are stored or handled by the application
- All transactions require wallet confirmation
- Transaction details are previewed before execution
- Uses official Stacks SDK methods only

## Build

```bash
npm run build
```

## License

MIT

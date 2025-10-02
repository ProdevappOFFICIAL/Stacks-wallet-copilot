# Technology Stack

## Build System & Framework
- **Build Tool**: Vite 7.1.7 (fast development server and build tool)
- **Framework**: React 19.1.1 with TypeScript 5.8.3
- **Package Manager**: npm (uses package-lock.json)

## Core Dependencies
- **Stacks SDK**: 
  - `@stacks/connect` - Wallet connection and authentication
  - `@stacks/network` - Network configuration (testnet/mainnet)
  - `@stacks/transactions` - Transaction building and signing
  - `@stacks/stacking` - Stacking operations
- **UI Libraries**:
  - `framer-motion` - Smooth animations and transitions
  - `lucide-react` - Modern icon library
  - `react-router-dom` - Client-side routing
- **Styling**: Tailwind CSS 3.4.0 with PostCSS and Autoprefixer

## Development Tools
- **Linting**: ESLint 9.36.0 with TypeScript ESLint
- **Type Checking**: Strict TypeScript configuration
- **Code Quality**: React Hooks and React Refresh plugins

## Common Commands

### Development
```bash
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Build for production (TypeScript check + Vite build)
npm run preview      # Preview production build
npm run lint         # Run ESLint checks
```

### Installation
```bash
npm install          # Install all dependencies
```

## Network Configuration
- Centralized network management via `src/utils/network.ts`
- Dynamic switching between testnet and mainnet
- API endpoints: Hiro API for both networks
- Default: Testnet for development safety

## TypeScript Configuration
- Strict mode enabled with comprehensive linting rules
- Modern ES2022 target with DOM libraries
- React JSX transform
- Bundler module resolution for Vite compatibility
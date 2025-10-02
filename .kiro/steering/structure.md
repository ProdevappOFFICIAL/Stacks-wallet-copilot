# Project Structure

## Root Directory
```
├── src/                    # Source code
├── public/                 # Static assets
├── .kiro/                  # Kiro configuration and steering
├── .vscode/                # VS Code settings
├── node_modules/           # Dependencies
├── index.html              # Entry HTML file
├── package.json            # Project dependencies and scripts
├── vite.config.ts          # Vite build configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
├── tsconfig.json           # TypeScript project references
├── tsconfig.app.json       # Main TypeScript configuration
├── tsconfig.node.json      # Node.js TypeScript configuration
├── eslint.config.js        # ESLint configuration
└── README.md               # Project documentation
```

## Source Code Organization (`src/`)

### Main Application Files
- `main.tsx` - Application entry point and React DOM rendering
- `App.tsx` - Main application component with chat interface
- `App.css` - Application-specific styles
- `index.css` - Global styles and Tailwind imports

### Feature-Based Folders

#### `components/`
Reusable UI components
- `NetworkSwitcher.tsx` - Network selection dropdown component

#### `hooks/`
Custom React hooks for shared logic
- `useStacks.ts` - Stacks wallet connection and authentication

#### `utils/`
Utility functions and helpers
- `network.ts` - Centralized network configuration and switching
- `stacks.ts` - Stacks-specific utilities (address formatting, balance fetching)

#### `types/`
TypeScript type definitions
- `global.d.ts` - Global type declarations

#### `assets/`
Static assets like images and icons
- `react.svg` - React logo

## Architectural Patterns

### Component Structure
- **Main App Component**: Handles chat interface, message state, and transaction flow
- **Feature Components**: Focused components like NetworkSwitcher for specific functionality
- **Custom Hooks**: Encapsulate complex logic (wallet connection, network management)

### State Management
- React useState for local component state
- Custom hooks for shared state (wallet connection)
- Centralized network configuration with observer pattern

### File Naming Conventions
- Components: PascalCase (e.g., `NetworkSwitcher.tsx`)
- Hooks: camelCase with "use" prefix (e.g., `useStacks.ts`)
- Utils: camelCase (e.g., `network.ts`, `stacks.ts`)
- Types: camelCase with `.d.ts` extension

### Import Organization
- External libraries first
- Internal utilities and hooks
- Components last
- Relative imports for same-level files
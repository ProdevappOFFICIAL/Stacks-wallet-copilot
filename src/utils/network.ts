import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';

// Network configuration - now supports dynamic switching
class NetworkConfig {
  private _currentNetwork: 'testnet' | 'mainnet' = 'testnet';
  private _listeners: Array<(network: 'testnet' | 'mainnet') => void> = [];

  get CURRENT_NETWORK() {
    return this._currentNetwork;
  }

  set CURRENT_NETWORK(network: 'testnet' | 'mainnet') {
    this._currentNetwork = network;
    this._listeners.forEach(listener => listener(network));
  }

  get network() {
    return this._currentNetwork === 'testnet' ? STACKS_TESTNET : STACKS_MAINNET;
  }
  
  get isTestnet() {
    return this._currentNetwork === 'testnet';
  }
  
  get networkName() {
    return this._currentNetwork;
  }
  
  get apiUrl() {
    return this._currentNetwork === 'testnet' 
      ? 'https://api.testnet.hiro.so' 
      : 'https://api.stacks.co';
  }

  // Subscribe to network changes
  onNetworkChange(listener: (network: 'testnet' | 'mainnet') => void) {
    this._listeners.push(listener);
    return () => {
      const index = this._listeners.indexOf(listener);
      if (index > -1) {
        this._listeners.splice(index, 1);
      }
    };
  }

  // Switch network
  switchNetwork(network: 'testnet' | 'mainnet') {
    this.CURRENT_NETWORK = network;
  }
}

export const NETWORK_CONFIG = new NetworkConfig();

// Helper function to get the correct address based on current network
export function getCurrentAddress(userData: unknown): string | undefined {
  if (!userData?.profile?.stxAddress) return undefined;
  
  return NETWORK_CONFIG.isTestnet 
    ? userData.profile.stxAddress.testnet 
    : userData.profile.stxAddress.mainnet;
}
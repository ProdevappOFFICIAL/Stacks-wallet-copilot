import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Wifi, WifiOff } from 'lucide-react';
import { NETWORK_CONFIG } from '../utils/network';

interface NetworkSwitcherProps {
  onNetworkChange?: (network: 'testnet' | 'mainnet') => void;
}

export const NetworkSwitcher: React.FC<NetworkSwitcherProps> = ({ onNetworkChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState(NETWORK_CONFIG.networkName);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Listen for network changes
  useEffect(() => {
    const unsubscribe = NETWORK_CONFIG.onNetworkChange((network) => {
      setCurrentNetwork(network);
    });
    return unsubscribe;
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNetworkSwitch = (network: 'testnet' | 'mainnet') => {
    NETWORK_CONFIG.switchNetwork(network);
    setIsOpen(false);
    onNetworkChange?.(network);
  };

  const networks = [
    {
      id: 'testnet' as const,
      name: 'Testnet',
      description: 'For development & testing',
      color: 'orange',
      icon: WifiOff
    },
    {
      id: 'mainnet' as const,
      name: 'Mainnet',
      description: 'Live network',
      color: 'green',
      icon: Wifi
    }
  ];

  const currentNetworkData = networks.find(n => n.id === currentNetwork);
  const CurrentIcon = currentNetworkData?.icon || Wifi;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${currentNetwork === 'testnet'
            ? 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20'
            : 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'
          }`}
      >
        <CurrentIcon size={14} />
        <span>{currentNetworkData?.name}</span>
        <ChevronDown
          size={14}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-2">
            <div className="text-xs text-slate-400 px-2 py-1 mb-1">
              Select Network
            </div>
            {networks.map((network) => {
              const Icon = network.icon;
              const isSelected = network.id === currentNetwork;

              return (
                <button
                  key={network.id}
                  onClick={() => handleNetworkSwitch(network.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${isSelected
                      ? network.color === 'orange'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-green-500/20 text-green-400'
                      : 'text-slate-300 hover:bg-slate-700'
                    }`}
                >
                  <Icon size={16} />
                  <div className="flex-1">
                    <div className="font-medium">{network.name}</div>
                    <div className="text-xs text-slate-400">{network.description}</div>
                  </div>
                  {isSelected && (
                    <div className={`w-2 h-2 rounded-full ${network.color === 'orange' ? 'bg-orange-500' : 'bg-green-500'
                      }`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Warning Message */}
          <div className="border-t border-slate-700 p-3 bg-slate-900/50">
            <div className="flex items-start gap-2 text-xs text-amber-400">
              <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
              <div>
                Make sure your wallet is connected to the same network to avoid transaction failures.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
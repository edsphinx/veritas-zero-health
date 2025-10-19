'use client';

/**
 * Network Switcher Component
 *
 * Dropdown component for switching between supported blockchain networks
 * Shows current network and allows switching to other configured networks
 */

import { useAppKitNetwork } from '@reown/appkit/react';
import { useSwitchChain } from 'wagmi';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Check, Network as NetworkIcon } from 'lucide-react';
import { networks, isTestnet } from '@/config/wagmi.config';

export function NetworkSwitcher() {
  const { caipNetwork, switchNetwork } = useAppKitNetwork();
  const { chains } = useSwitchChain();

  // Get current chain ID (AppKit returns string | number, normalize to number)
  const currentChainId = typeof caipNetwork?.id === 'string'
    ? parseInt(caipNetwork.id, 10)
    : caipNetwork?.id;

  // Handle network switch
  const handleSwitchNetwork = async (chainId: number) => {
    if (chainId === currentChainId) return;

    try {
      // AppKit switchNetwork expects caipNetworkId (chainId:reference format)
      const network = networks.find((n) => n.id === chainId);
      if (network) {
        await switchNetwork(network);
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <NetworkIcon className="w-4 h-4" />
          <span className="hidden sm:inline">
            {caipNetwork?.name || 'Select Network'}
          </span>
          {currentChainId && isTestnet(currentChainId) && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              Testnet
            </Badge>
          )}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[240px]">
        <DropdownMenuLabel>Switch Network</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Testnets */}
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Testnets
        </DropdownMenuLabel>
        {networks
          .filter((network) => {
            const chainId = typeof network.id === 'string' ? parseInt(network.id, 10) : network.id;
            return isTestnet(chainId);
          })
          .map((network) => {
            const chainId = typeof network.id === 'string' ? parseInt(network.id, 10) : network.id;
            return (
              <DropdownMenuItem
                key={network.id}
                onClick={() => handleSwitchNetwork(chainId)}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-2">
                    {currentChainId === chainId && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                    <span className={currentChainId !== chainId ? 'ml-6' : ''}>
                      {network.name}
                    </span>
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {network.nativeCurrency?.symbol || 'ETH'}
                  </Badge>
                </div>
              </DropdownMenuItem>
            );
          })}

        {/* Mainnets (only show in production or if available) */}
        {networks.some((network) => {
          const chainId = typeof network.id === 'string' ? parseInt(network.id, 10) : network.id;
          return !isTestnet(chainId);
        }) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Mainnets
            </DropdownMenuLabel>
            {networks
              .filter((network) => {
                const chainId = typeof network.id === 'string' ? parseInt(network.id, 10) : network.id;
                return !isTestnet(chainId);
              })
              .map((network) => {
                const chainId = typeof network.id === 'string' ? parseInt(network.id, 10) : network.id;
                return (
                  <DropdownMenuItem
                    key={network.id}
                    onClick={() => handleSwitchNetwork(chainId)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="flex items-center gap-2">
                        {currentChainId === chainId && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                        <span className={currentChainId !== chainId ? 'ml-6' : ''}>
                          {network.name}
                        </span>
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {network.nativeCurrency?.symbol || 'ETH'}
                      </Badge>
                    </div>
                  </DropdownMenuItem>
                );
              })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

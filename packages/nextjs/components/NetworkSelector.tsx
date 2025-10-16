/**
 * NetworkSelector Component
 *
 * Displays current network and allows switching between supported chains
 */

'use client';

import { useState } from 'react';
import { useAccount, useSwitchChain, useChainId } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';
import { chains, getChainName } from '@/config/wagmi.config';
import { cn } from '@/shared/lib/utils';

export function NetworkSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { isConnected } = useAccount();
  const currentChainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) return null;

  const currentChain = chains.find(chain => chain.id === currentChainId);
  const isUnsupportedChain = !currentChain;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          isUnsupportedChain
            ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
            : "bg-accent/50 hover:bg-accent"
        )}
      >
        <div className={cn(
          "w-2 h-2 rounded-full",
          isUnsupportedChain ? "bg-destructive" : "bg-green-500"
        )} />
        <span className="hidden sm:inline">
          {isUnsupportedChain ? 'Unsupported' : currentChain.name}
        </span>
        <ChevronDown className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-card shadow-lg overflow-hidden z-50"
            >
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                  Select Network
                </div>

                {chains.map((chain) => {
                  const isActive = chain.id === currentChainId;
                  const isTestnet = chain.testnet;

                  return (
                    <button
                      key={chain.id}
                      onClick={() => {
                        if (!isActive && switchChain) {
                          switchChain({ chainId: chain.id });
                        }
                        setIsOpen(false);
                      }}
                      disabled={isPending}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-accent text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          isActive ? "bg-primary" : "bg-muted-foreground/50"
                        )} />
                        <div className="text-left">
                          <div className="font-medium">{chain.name}</div>
                          {isTestnet && (
                            <div className="text-xs text-muted-foreground">Testnet</div>
                          )}
                        </div>
                      </div>

                      {isActive && <Check className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>

              {isUnsupportedChain && (
                <div className="border-t border-border p-3 bg-destructive/5">
                  <div className="flex gap-2 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Unsupported Network</p>
                      <p className="text-muted-foreground mt-0.5">
                        Please switch to a supported network
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

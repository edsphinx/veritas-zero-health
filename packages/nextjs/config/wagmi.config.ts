/**
 * Wagmi Configuration
 *
 * Configures Web3 wallet connection for Veritas Zero Health
 * Supports multiple chains and wallet connectors via Reown AppKit
 */

import { http, createConfig, cookieStorage, createStorage } from 'wagmi';
import { mainnet, sepolia, polygon, polygonAmoy, celo, celoAlfajores } from 'wagmi/chains';

// Get environment variables
const reownProjectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '';
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '';

// Validate required environment variables
if (!reownProjectId) {
  console.error('⚠️ NEXT_PUBLIC_REOWN_PROJECT_ID is not set in environment variables');
}

// Define supported chains
// Default to testnets for development, can be overridden with env vars
export const chains = [
  sepolia,        // Ethereum Sepolia testnet
  polygonAmoy,    // Polygon Amoy testnet
  celoAlfajores,  // Celo Alfajores testnet
  ...(process.env.NODE_ENV === 'production'
    ? [mainnet, polygon, celo]  // Add mainnets in production
    : []),
] as const;

// App metadata for Reown AppKit
export const projectId = reownProjectId;
export const metadata = {
  name: 'Veritas Zero Health',
  description: 'Private, Verifiable Patient Data for Clinical Trials',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://veritas.health',
  icons: ['https://veritas.health/icon.png'],
};

// Configure transports (RPC providers)
const transports = {
  [sepolia.id]: http(
    alchemyApiKey
      ? `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`
      : 'https://rpc.sepolia.org'
  ),
  [polygonAmoy.id]: http(
    alchemyApiKey
      ? `https://polygon-amoy.g.alchemy.com/v2/${alchemyApiKey}`
      : 'https://rpc-amoy.polygon.technology'
  ),
  [celoAlfajores.id]: http('https://alfajores-forno.celo-testnet.org'),
  ...(process.env.NODE_ENV === 'production'
    ? {
        [mainnet.id]: http(
          alchemyApiKey
            ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
            : 'https://eth.llamarpc.com'
        ),
        [polygon.id]: http(
          alchemyApiKey
            ? `https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
            : 'https://polygon.llamarpc.com'
        ),
        [celo.id]: http('https://forno.celo.org'),
      }
    : {}),
};

// Create Wagmi config
// Note: Connectors are managed by Reown AppKit, not defined here
export const wagmiConfig = createConfig({
  chains,
  transports: transports as any, // Type assertion for conditional transports
  ssr: true, // Enable server-side rendering support
  storage: createStorage({
    storage: cookieStorage,
  }),
});

// Export individual chains for convenience
export { mainnet, sepolia, polygon, polygonAmoy, celo, celoAlfajores };

// Helper: Get chain by ID
export function getChainById(chainId: number) {
  return chains.find((chain) => chain.id === chainId);
}

// Helper: Get chain name
export function getChainName(chainId: number) {
  const chain = getChainById(chainId);
  return chain?.name || 'Unknown Network';
}

// Helper: Check if chain is testnet
export function isTestnet(chainId: number) {
  return [sepolia.id as number, polygonAmoy.id as number, celoAlfajores.id as number].includes(chainId);
}

// Helper: Get block explorer URL
export function getBlockExplorerUrl(chainId: number, hash: string, type: 'tx' | 'address' = 'tx') {
  const chain = getChainById(chainId);
  if (!chain?.blockExplorers?.default) return '#';

  const baseUrl = chain.blockExplorers.default.url;
  return `${baseUrl}/${type}/${hash}`;
}

// Default chain for the app (can be overridden with env var)
export const defaultChain = sepolia;

// Export config as default
export default wagmiConfig;

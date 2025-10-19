/**
 * BlockchainInfoCard Component
 *
 * Displays blockchain-related information for a study including:
 * - Study IDs (escrow, registry)
 * - Contract addresses
 * - Creation transactions
 */

'use client';

import { Shield, FileCode, ExternalLink } from 'lucide-react';
import type { Study } from '@veritas/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { truncateAddress } from '@/lib/helpers';

interface BlockchainInfoCardProps {
  study: Study;
}

export function BlockchainInfoCard({ study }: BlockchainInfoCardProps) {
  // Don't render if no blockchain data
  if (!study.escrowTxHash && !study.registryTxHash && !study.criteriaTxHash) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <FileCode className="h-6 w-6 text-primary" />
          Blockchain Contracts & Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Study IDs */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Study Identifiers
            </h3>
            <div className="space-y-2 text-sm">
              {study.escrowId !== undefined && (
                <div>
                  <span className="text-blue-700 font-medium">Escrow ID:</span>
                  <span className="ml-2 text-blue-900 font-mono">
                    #{study.escrowId}
                  </span>
                </div>
              )}
              {study.registryId !== undefined && (
                <div>
                  <span className="text-blue-700 font-medium">Registry ID:</span>
                  <span className="ml-2 text-blue-900 font-mono">
                    #{study.registryId}
                  </span>
                </div>
              )}
              {study.chainId && (
                <div>
                  <span className="text-blue-700 font-medium">Chain:</span>
                  <span className="ml-2 text-blue-900 font-mono">
                    {study.chainId === 11155420
                      ? 'Optimism Sepolia'
                      : `Chain ${study.chainId}`}
                  </span>
                </div>
              )}
              {study.researcherAddress && (
                <div>
                  <span className="text-blue-700 font-medium">Researcher:</span>
                  <span className="ml-2 text-blue-900 font-mono text-xs">
                    {truncateAddress(study.researcherAddress)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Contract Addresses */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              Smart Contracts
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-purple-700 font-medium">
                  ResearchFundingEscrow
                </span>
                <a
                  href="https://sepolia-optimism.etherscan.io/address/0x..."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-purple-600 hover:text-purple-800 text-xs flex items-center gap-1 mt-1"
                >
                  <span className="font-mono">View Contract</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div>
                <span className="text-purple-700 font-medium">StudyRegistry</span>
                <a
                  href="https://sepolia-optimism.etherscan.io/address/0x..."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-purple-600 hover:text-purple-800 text-xs flex items-center gap-1 mt-1"
                >
                  <span className="font-mono">View Contract</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div>
                <span className="text-purple-700 font-medium">
                  EligibilityCodeVerifier
                </span>
                <a
                  href="https://sepolia-optimism.etherscan.io/address/0x1BBc9BD3b5b5a2ECB7d99b8b933F866A16bb7B29"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-purple-600 hover:text-purple-800 text-xs flex items-center gap-1 mt-1"
                >
                  <span className="font-mono">View Contract</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            Creation Transactions
          </h3>
          <div className="space-y-3">
            {study.escrowTxHash && (
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    1. Create Escrow
                  </p>
                  <p className="text-xs text-gray-600 mt-1 font-mono">
                    {truncateAddress(study.escrowTxHash, 10, 8)}
                  </p>
                </div>
                <Button asChild size="sm" variant="default">
                  <a
                    href={`https://sepolia-optimism.etherscan.io/tx/${study.escrowTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Etherscan
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </a>
                </Button>
              </div>
            )}

            {study.registryTxHash && (
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    2. Publish to Registry
                  </p>
                  <p className="text-xs text-gray-600 mt-1 font-mono">
                    {truncateAddress(study.registryTxHash, 10, 8)}
                  </p>
                </div>
                <Button asChild size="sm" variant="default">
                  <a
                    href={`https://sepolia-optimism.etherscan.io/tx/${study.registryTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Etherscan
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </a>
                </Button>
              </div>
            )}

            {study.criteriaTxHash && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    3. Set Eligibility Criteria
                  </p>
                  <p className="text-xs text-gray-600 mt-1 font-mono">
                    {truncateAddress(study.criteriaTxHash, 10, 8)}
                  </p>
                </div>
                <Button asChild size="sm" variant="default">
                  <a
                    href={`https://sepolia-optimism.etherscan.io/tx/${study.criteriaTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Etherscan
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

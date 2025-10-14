import { ethers } from 'ethers';
import HealthIdentitySBTABI from '../contracts/HealthIdentitySBT.json';

export interface ClaimSBTParams {
  sbtContractAddress: string;
  patientAddress: string;
  nillionDID: string;
  expiresAt: number;
  voucherNonce: number;
  signature: string;
}

export class SBTService {
  /**
   * Claim Health Identity SBT using a provider-signed voucher
   */
  static async claimHealthIdentity(params: ClaimSBTParams): Promise<{ success: boolean; tokenId?: number; txHash?: string; error?: string }> {
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        return { success: false, error: 'MetaMask is not installed' };
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Verify connected address matches patient address
      const connectedAddress = await signer.getAddress();
      if (connectedAddress.toLowerCase() !== params.patientAddress.toLowerCase()) {
        return {
          success: false,
          error: `Wallet address mismatch. Connected: ${connectedAddress}, Expected: ${params.patientAddress}`,
        };
      }

      // Create contract instance
      const sbtContract = new ethers.Contract(
        params.sbtContractAddress,
        HealthIdentitySBTABI,
        signer
      );

      // Call claimHealthIdentity
      const tx = await sbtContract.claimHealthIdentity(
        params.patientAddress,
        params.nillionDID,
        params.expiresAt,
        params.voucherNonce,
        params.signature
      );

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      // Extract tokenId from event logs
      // The HealthIdentityClaimed event should contain the tokenId
      let tokenId: number | undefined;

      for (const log of receipt.logs) {
        try {
          const parsed = sbtContract.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });

          if (parsed && parsed.name === 'HealthIdentityClaimed') {
            tokenId = Number(parsed.args.tokenId);
            break;
          }
        } catch (e) {
          // Skip logs that don't match
          continue;
        }
      }

      return {
        success: true,
        tokenId,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('Error claiming SBT:', error);

      // Parse error message
      let errorMessage = 'Failed to claim SBT';

      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction was rejected';
      } else if (error.message) {
        // Try to extract revert reason
        if (error.message.includes('Voucher already used')) {
          errorMessage = 'This voucher has already been used';
        } else if (error.message.includes('Voucher expired')) {
          errorMessage = 'This voucher has expired';
        } else if (error.message.includes('Signature not from certified provider')) {
          errorMessage = 'Invalid provider signature';
        } else if (error.message.includes('Patient already has health identity')) {
          errorMessage = 'You already have a Health Identity SBT';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if an address has a Health Identity SBT
   */
  static async hasHealthIdentity(sbtContractAddress: string, patientAddress: string): Promise<boolean> {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const sbtContract = new ethers.Contract(
        sbtContractAddress,
        HealthIdentitySBTABI,
        provider
      );

      return await sbtContract.hasHealthIdentity(patientAddress);
    } catch (error) {
      console.error('Error checking health identity:', error);
      return false;
    }
  }

  /**
   * Get Health Identity details for an address
   */
  static async getHealthIdentity(sbtContractAddress: string, patientAddress: string): Promise<any | null> {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const sbtContract = new ethers.Contract(
        sbtContractAddress,
        HealthIdentitySBTABI,
        provider
      );

      const identity = await sbtContract.getHealthIdentity(patientAddress);
      return identity;
    } catch (error) {
      console.error('Error getting health identity:', error);
      return null;
    }
  }
}

/**
 * API Route: Generate SBT Voucher
 *
 * Generates a signed voucher for patients to claim Health Identity SBT
 * The voucher is encoded in a QR code that the patient scans with the extension
 */

import { NextRequest, NextResponse } from 'next/server';
import { type Address, type Hex, keccak256, encodePacked } from 'viem';
import QRCode from 'qrcode';
import { z } from 'zod';
import { getHealthIdentitySBTContract } from '@/shared/services/health-identity-sbt.service';
import {
  getAccountFromPrivateKey,
  signMessageWithPrivateKey,
} from '@/shared/services/blockchain-client.service';

// --- Type Definitions ---

interface SBTVoucher {
  type: 'VERITAS_HEALTH_IDENTITY_SBT';
  version: '1.0';
  data: {
    patientAddress: Address;
    nillionDID: string;
    expiresAt: number;
    voucherNonce: number;
    signature: Hex;
    providerAddress: Address;
    sbtContractAddress: Address;
    chainId: number;
  };
}

// --- Validation Schema ---

const GenerateVoucherSchema = z.object({
  patientAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  nillionDID: z.string().min(1, 'Nillion DID is required'),
  expiresIn: z.number().min(60).max(172800).optional(), // 1 min to 48 hours
});

// --- Environment Variables ---

const getEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

// Provider wallet (clinic/medical provider)
const PROVIDER_PRIVATE_KEY = getEnvVar('PROVIDER_PRIVATE_KEY') as Hex;
const CHAIN_ID = parseInt(getEnvVar('CHAIN_ID') || '11155420'); // Optimism Sepolia default

// Get contract configuration from service layer
const SBT_CONTRACT = getHealthIdentitySBTContract(CHAIN_ID);

if (!SBT_CONTRACT) {
  throw new Error(`HealthIdentitySBT contract not deployed on chain ${CHAIN_ID}`);
}

const SBT_CONTRACT_ADDRESS = SBT_CONTRACT.address;

// --- Helper Functions ---

/**
 * Generate a random nonce for the voucher
 */
function generateNonce(): number {
  return Math.floor(Math.random() * 1000000000);
}

/**
 * Sign the voucher message
 * Message structure matches the contract's claimHealthIdentity function
 * Uses blockchain client service layer for clean architecture
 */
async function signVoucherMessage(
  patientAddress: Address,
  nillionDID: string,
  expiresAt: number,
  nonce: number,
  sbtContractAddress: Address
): Promise<{ signature: Hex; providerAddress: Address }> {
  // Get account from provider private key (via service layer)
  const account = getAccountFromPrivateKey(PROVIDER_PRIVATE_KEY);

  // Build message hash exactly as in the smart contract
  const messageHash = keccak256(
    encodePacked(
      ['address', 'string', 'uint256', 'uint256', 'address'],
      [patientAddress, nillionDID, BigInt(expiresAt), BigInt(nonce), sbtContractAddress]
    )
  );

  // Sign the message hash (via service layer)
  const signature = await signMessageWithPrivateKey(PROVIDER_PRIVATE_KEY, { raw: messageHash });

  return {
    signature,
    providerAddress: account.address,
  };
}

/**
 * Generate QR code from voucher data
 */
async function generateQRCode(voucher: SBTVoucher): Promise<string> {
  const voucherJSON = JSON.stringify(voucher);
  const qrCodeDataURL = await QRCode.toDataURL(voucherJSON, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    margin: 2,
    width: 400,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  return qrCodeDataURL;
}

// --- API Handler ---

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = GenerateVoucherSchema.parse(body);

    const { patientAddress, nillionDID, expiresIn = 86400 } = validatedData; // Default 24h

    // Generate voucher details
    const nonce = generateNonce();
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    // Sign the voucher
    const { signature, providerAddress } = await signVoucherMessage(
      patientAddress as Address,
      nillionDID,
      expiresAt,
      nonce,
      SBT_CONTRACT_ADDRESS
    );

    // Create voucher object
    const voucher: SBTVoucher = {
      type: 'VERITAS_HEALTH_IDENTITY_SBT',
      version: '1.0',
      data: {
        patientAddress: patientAddress as Address,
        nillionDID,
        expiresAt,
        voucherNonce: nonce,
        signature,
        providerAddress,
        sbtContractAddress: SBT_CONTRACT_ADDRESS,
        chainId: CHAIN_ID,
      },
    };

    // Generate QR code
    const qrCode = await generateQRCode(voucher);

    // Log voucher generation (for debugging)
    console.log('✅ Voucher generated:', {
      patient: patientAddress,
      provider: providerAddress,
      nonce,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
    });

    // Return response
    return NextResponse.json({
      success: true,
      voucher: voucher.data,
      qrCode,
      expiresAtISO: new Date(expiresAt * 1000).toISOString(),
    });
  } catch (error) {
    console.error('❌ Error generating voucher:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// --- OPTIONS for CORS ---

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

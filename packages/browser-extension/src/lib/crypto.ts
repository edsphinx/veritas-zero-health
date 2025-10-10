/**
 * Cryptographic utilities for secure key management
 * Uses TweetNaCl for key generation and encryption
 */

import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';
import { v4 as uuidv4 } from 'uuid';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface DIDDocument {
  id: string; // did:veritas:...
  publicKey: string;
  created: number;
  updated: number;
}

/**
 * Generate a new Ed25519 keypair for signing
 */
export function generateKeyPair(): KeyPair {
  const keyPair = nacl.sign.keyPair();

  return {
    publicKey: encodeBase64(keyPair.publicKey),
    privateKey: encodeBase64(keyPair.secretKey),
  };
}

/**
 * Generate a DID (Decentralized Identifier) from public key
 * Format: did:veritas:<base64-encoded-public-key>
 */
export function generateDID(publicKey: string): string {
  // Clean base64 string (remove padding, make URL-safe)
  const cleanKey = publicKey.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `did:veritas:${cleanKey}`;
}

/**
 * Create a complete DID document
 */
export function createDIDDocument(publicKey: string): DIDDocument {
  const now = Date.now();

  return {
    id: generateDID(publicKey),
    publicKey,
    created: now,
    updated: now,
  };
}

/**
 * Sign data with private key
 */
export function signData(data: string, privateKey: string): string {
  const dataBytes = new TextEncoder().encode(data);
  const keyBytes = decodeBase64(privateKey);

  const signature = nacl.sign.detached(dataBytes, keyBytes);
  return encodeBase64(signature);
}

/**
 * Verify signature with public key
 */
export function verifySignature(
  data: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const dataBytes = new TextEncoder().encode(data);
    const signatureBytes = decodeBase64(signature);
    const publicKeyBytes = decodeBase64(publicKey);

    return nacl.sign.detached.verify(dataBytes, signatureBytes, publicKeyBytes);
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Encrypt data using secret key encryption (symmetric)
 */
export function encryptData(data: string, secretKey: Uint8Array): string {
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const dataBytes = new TextEncoder().encode(data);

  const encrypted = nacl.secretbox(dataBytes, nonce, secretKey);

  // Combine nonce + encrypted data
  const combined = new Uint8Array(nonce.length + encrypted.length);
  combined.set(nonce);
  combined.set(encrypted, nonce.length);

  return encodeBase64(combined);
}

/**
 * Decrypt data using secret key
 */
export function decryptData(encryptedData: string, secretKey: Uint8Array): string | null {
  try {
    const combined = decodeBase64(encryptedData);

    const nonce = combined.slice(0, nacl.secretbox.nonceLength);
    const ciphertext = combined.slice(nacl.secretbox.nonceLength);

    const decrypted = nacl.secretbox.open(ciphertext, nonce, secretKey);

    if (!decrypted) {
      return null;
    }

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

/**
 * Derive a secret key from password using a simple hash
 * NOTE: In production, use PBKDF2 or Argon2
 */
export function deriveSecretKey(password: string): Uint8Array {
  // Simple hash for demo - USE PBKDF2 IN PRODUCTION
  const hash = nacl.hash(new TextEncoder().encode(password));
  return hash.slice(0, nacl.secretbox.keyLength);
}

/**
 * Generate a secure random nonce/salt
 */
export function generateNonce(): string {
  return uuidv4();
}

/**
 * Store keypair securely in chrome.storage.local
 */
export async function storeKeypair(keyPair: KeyPair, password: string): Promise<void> {
  const secretKey = deriveSecretKey(password);

  // Encrypt private key before storage
  const encryptedPrivateKey = encryptData(keyPair.privateKey, secretKey);

  await chrome.storage.local.set({
    publicKey: keyPair.publicKey,
    encryptedPrivateKey,
  });
}

/**
 * Retrieve keypair from chrome.storage.local
 */
export async function retrieveKeypair(password: string): Promise<KeyPair | null> {
  const data = await chrome.storage.local.get(['publicKey', 'encryptedPrivateKey']);

  if (!data.publicKey || !data.encryptedPrivateKey) {
    return null;
  }

  const secretKey = deriveSecretKey(password);
  const privateKey = decryptData(data.encryptedPrivateKey, secretKey);

  if (!privateKey) {
    return null;
  }

  return {
    publicKey: data.publicKey,
    privateKey,
  };
}

/**
 * Check if keypair exists in storage
 */
export async function hasKeypair(): Promise<boolean> {
  const data = await chrome.storage.local.get(['publicKey']);
  return !!data.publicKey;
}

/**
 * Delete keypair from storage
 */
export async function deleteKeypair(): Promise<void> {
  await chrome.storage.local.remove(['publicKey', 'encryptedPrivateKey', 'did']);
}

/**
 * Store DID document
 */
export async function storeDID(didDocument: DIDDocument): Promise<void> {
  await chrome.storage.local.set({ did: didDocument });
}

/**
 * Retrieve DID document
 */
export async function retrieveDID(): Promise<DIDDocument | null> {
  const data = await chrome.storage.local.get(['did']);
  return data.did || null;
}

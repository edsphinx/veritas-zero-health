/**
 * SIWE Client Helper
 *
 * Helper functions for Sign-In With Ethereum on client-side
 */

import { SiweMessage } from "siwe";
import { signIn } from "next-auth/react";
import type { Address } from "viem";

export interface SIWESignInParams {
  address: Address;
  chainId: number;
  signMessageAsync: (args: { message: string }) => Promise<string>;
}

/**
 * Sign in with Ethereum using SIWE
 */
export async function signInWithEthereum({
  address,
  chainId,
  signMessageAsync,
}: SIWESignInParams): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[SIWE] Starting sign-in process for:", address);

    // 1. Create SIWE message
    console.log("[SIWE] Fetching CSRF token...");
    const csrfResponse = await fetch("/api/auth/csrf");
    const csrfData = await csrfResponse.json();
    console.log("[SIWE] CSRF token received:", csrfData.csrfToken ? "✓" : "✗");

    const message = new SiweMessage({
      domain: window.location.host,
      address,
      statement: "Sign in to Veritas Zero Health",
      uri: window.location.origin,
      version: "1",
      chainId,
      nonce: csrfData.csrfToken,
    });

    const preparedMessage = message.prepareMessage();
    console.log("[SIWE] Message prepared, requesting signature from wallet...");

    // 2. Request signature from wallet
    const signature = await signMessageAsync({ message: preparedMessage });
    console.log("[SIWE] Signature received:", signature ? "✓" : "✗");

    // 3. Sign in with NextAuth
    console.log("[SIWE] Calling NextAuth signIn...");
    const result = await signIn("credentials", {
      message: JSON.stringify(message),
      signature,
      redirect: false,
    });

    console.log("[SIWE] NextAuth result:", result);

    if (result?.error) {
      console.error("[SIWE] Sign in error:", result.error);
      return { success: false, error: result.error };
    }

    console.log("[SIWE] Sign-in successful!");
    return { success: true };
  } catch (error: any) {
    console.error("[SIWE] Sign in failed:", error);
    return { success: false, error: error.message || "Failed to sign in" };
  }
}

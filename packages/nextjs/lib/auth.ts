/**
 * NextAuth Configuration with SIWE (Sign-In With Ethereum)
 *
 * This uses Reown AppKit's built-in SIWE support for Web3 authentication
 * Documentation: https://docs.reown.com/appkit/next/core/siwe
 *
 * Note: NextAuth v5 is currently in beta and has breaking changes from v4
 * This configuration will be updated once v5 is stable
 */

import type { UserRole } from "@veritas/types";
import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { SiweMessage } from "siwe";
import { createPublicClient, http } from "viem";
import { prisma } from "./prisma";
import { getRoleForAddress, getTestUserDisplayName, isDevMode } from "./test-users";

// Map Prisma UserRole enum to @veritas/types UserRole
function mapPrismaRoleToUserRole(
  prismaRole: string
): UserRole {
  // Prisma enum values are lowercase strings like "patient"
  // @veritas/types enum values are lowercase like "patient"
  return prismaRole.toLowerCase() as UserRole;
}

export const authConfig = {
  providers: [
    CredentialsProvider({
      name: "Ethereum",
      credentials: {
        message: {
          label: "Message",
          type: "text",
          placeholder: "0x0",
        },
        signature: {
          label: "Signature",
          type: "text",
          placeholder: "0x0",
        },
      },
      async authorize(credentials) {
        try {
          console.log('[Auth] Authorize called with credentials');

          if (!credentials?.message || !credentials?.signature) {
            console.log('[Auth] Missing message or signature');
            return null;
          }

          const messageJson = credentials.message as string;
          const signature = credentials.signature as string;

          // Parse SIWE message from JSON and recreate SiweMessage instance
          const parsedMessage = JSON.parse(messageJson);
          const siweMessage = new SiweMessage(parsedMessage);
          const address = siweMessage.address;
          const chainId = siweMessage.chainId;

          console.log(`[Auth] Verifying SIWE for address: ${address}, chain: ${chainId}`);

          // Get project ID
          const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;
          if (!projectId) {
            console.error('[Auth] NEXT_PUBLIC_REOWN_PROJECT_ID is not set');
            return null;
          }

          // Prepare the message for verification (this is the string that was signed)
          const preparedMessage = siweMessage.prepareMessage();

          // Verify signature using viem
          const publicClient = createPublicClient({
            transport: http(
              `https://rpc.walletconnect.org/v1/?chainId=eip155:${chainId}&projectId=${projectId}`
            ),
          });

          const isValid = await publicClient.verifyMessage({
            message: preparedMessage,
            address: address as `0x${string}`,
            signature: signature as `0x${string}`,
          });

          if (!isValid) {
            console.error('[Auth] ❌ Invalid signature');
            return null;
          }

          console.log(`[Auth] ✅ Signature valid`);

          // Get or create user
          const normalizedAddress = address.toLowerCase();

          let user = await prisma.user.findUnique({
            where: { address: normalizedAddress },
          });

          if (!user) {
            // Determine role: test user in dev, or default guest
            const userRole = getRoleForAddress(address);
            const displayName = isDevMode() ? getTestUserDisplayName(address) : null;

            console.log(`[Auth] Creating new user with role: ${userRole}`);
            user = await prisma.user.create({
              data: {
                address: normalizedAddress,
                role: userRole,
                displayName,
                lastActiveAt: new Date(),
              },
            });
          } else {
            console.log(`[Auth] User found with role: ${user.role}`);
            await prisma.user.update({
              where: { id: user.id },
              data: { lastActiveAt: new Date() },
            });
          }

          // Return in CAIP-10 format (eip155:chainId:address) for token.sub
          return {
            id: `eip155:${chainId}:${user.address}`,
            address: user.address,
            role: mapPrismaRoleToUserRole(user.role),
            isVerified: user.isVerified,
            humanityScore: user.humanityScore ?? undefined,
            displayName: user.displayName ?? undefined,
            avatar: user.avatar ?? undefined,
            email: '', // Required by NextAuth but not used in Web3
            emailVerified: null, // Required by NextAuth but not used in Web3
          };
        } catch (error) {
          console.error("[Auth] Verification error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async session({ session, token }) {
      if (!token.sub) {
        return session;
      }

      // Parse eip155:chainId:address from token.sub (CAIP-10 format)
      const parts = token.sub.split(':');
      if (parts.length === 3) {
        const [, chainId, address] = parts; // Ignore 'eip155' prefix
        session.address = address;
        session.chainId = parseInt(chainId, 10);

        // ⚠️ CRITICAL FIX: Only populate user if token has role data
        // This prevents returning empty/undefined role in session
        if (token.role && token.address) {
          session.user = {
            id: token.sub,
            address: token.address as string,
            role: mapPrismaRoleToUserRole(token.role as string),
            isVerified: token.isVerified as boolean,
            humanityScore: token.humanityScore as number | undefined,
            displayName: token.displayName as string | undefined,
            avatar: token.avatar as string | undefined,
            email: '', // Required by NextAuth but not used in Web3
            emailVerified: null, // Required by NextAuth but not used in Web3
          };

          console.log(`[Auth] ✅ Session populated for ${address} with role: ${token.role}`);
        } else {
          console.warn(`[Auth] ⚠️ Token missing role/address data - session.user will be empty`);
        }
      }

      return session;
    },
    async jwt({ token, user }) {
      // Initial sign in - store user data in token
      if (user) {
        console.log(`[Auth] JWT callback - Setting token for user role: ${user.role}`);
        token.address = user.address;
        token.role = user.role;
        token.isVerified = user.isVerified;
        token.humanityScore = user.humanityScore;
        token.displayName = user.displayName;
        token.avatar = user.avatar;
      }

      return token;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Trust localhost in development
} satisfies NextAuthConfig;

// Export NextAuth instance with configuration
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

/**
 * NextAuth Configuration with SIWE (Sign-In With Ethereum)
 *
 * Based on Reown AppKit official example:
 * https://github.com/reown-com/appkit-web-examples/tree/main/nextjs/next-siwe-next-auth
 */

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import {
  type SIWESession,
  getChainIdFromMessage,
  getAddressFromMessage,
} from '@reown/appkit-siwe';
import { createPublicClient, http } from 'viem';

// Extend NextAuth Session type
declare module 'next-auth' {
  interface Session extends SIWESession {
    address: string;
    chainId: number;
    user: {
      id: string;
      address: string;
      role: string;
      isVerified: boolean;
      humanityScore?: number;
      displayName?: string;
      avatar?: string;
    };
  }
}

const prisma = new PrismaClient();

const nextAuthSecret = process.env.NEXTAUTH_SECRET;
if (!nextAuthSecret) {
  throw new Error('NEXTAUTH_SECRET is not set');
}

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;
if (!projectId) {
  throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID is not set');
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: nextAuthSecret,

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  providers: [
    CredentialsProvider({
      name: 'Ethereum',
      credentials: {
        message: {
          label: 'Message',
          type: 'text',
          placeholder: '0x0',
        },
        signature: {
          label: 'Signature',
          type: 'text',
          placeholder: '0x0',
        },
      },
      async authorize(credentials, _req) {
        try {
          if (!credentials?.message) {
            throw new Error('Message is undefined');
          }

          const { message, signature } = credentials;

          // Extract address and chainId from SIWE message
          const address = getAddressFromMessage(message as string);
          const chainId = getChainIdFromMessage(message as string);

          console.log(`[NextAuth] Verifying SIWE for address: ${address}, chain: ${chainId}`);

          // Verify signature using viem
          const publicClient = createPublicClient({
            transport: http(
              `https://rpc.walletconnect.org/v1/?chainId=eip155:${chainId}&projectId=${projectId}`
            ),
          });

          const isValid = await publicClient.verifyMessage({
            message: message as string,
            address: address as `0x${string}`,
            signature: signature as `0x${string}`,
          });

          if (!isValid) {
            console.error('[NextAuth] ❌ Invalid signature');
            return null;
          }

          console.log(`[NextAuth] ✅ Signature valid`);

          const normalizedAddress = address.toLowerCase();

          // Find or create user in database
          let user = await prisma.user.findUnique({
            where: { address: normalizedAddress },
          });

          if (!user) {
            console.log(`[NextAuth] Creating new user with default role: patient`);
            user = await prisma.user.create({
              data: {
                address: normalizedAddress,
                role: 'patient', // Default role
                lastActiveAt: new Date(),
              },
            });
          } else {
            console.log(`[NextAuth] User found with role: ${user.role}`);
            await prisma.user.update({
              where: { id: user.id },
              data: { lastActiveAt: new Date() },
            });
          }

          // Return in format eip155:chainId:address for token.sub (CAIP-10 format)
          return {
            id: `eip155:${chainId}:${user.address}`,
            address: user.address,
            role: user.role,
            isVerified: user.isVerified,
            humanityScore: user.humanityScore ?? undefined,
            displayName: user.displayName ?? undefined,
            avatar: user.avatar ?? undefined,
          };
        } catch (error) {
          console.error('[NextAuth] ❌ Authorization error:', error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        console.log(`[NextAuth] JWT callback - Setting token for user role: ${user.role}`);
        token.address = user.address;
        token.role = user.role;
        token.isVerified = user.isVerified;
        token.humanityScore = user.humanityScore;
        token.displayName = user.displayName;
        token.avatar = user.avatar;
      }

      return token;
    },

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

        // Add user data to session
        session.user = {
          id: token.sub,
          address: token.address as string,
          role: token.role as string,
          isVerified: token.isVerified as boolean,
          humanityScore: token.humanityScore as number | undefined,
          displayName: token.displayName as string | undefined,
          avatar: token.avatar as string | undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;

        console.log(`[NextAuth] Session for ${address} with role: ${token.role}`);
      }

      return session;
    },
  },

  pages: {
    signIn: '/',
    error: '/auth/error',
  },

  events: {
    async signIn({ user }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.log(`[NextAuth] ✅ User signed in: ${(user as any).address}`);
    },
    async signOut(message) {
      if ('token' in message && message.token) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.log(`[NextAuth] 👋 User signed out: ${(message.token as any)?.address}`);
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
});

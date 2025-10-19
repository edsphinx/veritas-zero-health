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
import CredentialsProvider from "next-auth/providers/credentials";
import { SiweMessage } from "siwe";
import { prisma } from "./prisma";

// Map Prisma UserRole enum to @veritas/types UserRole
function mapPrismaRoleToUserRole(
  prismaRole: string
): UserRole {
  // Prisma enum values are uppercase strings like "PATIENT"
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
          if (!credentials?.message || !credentials?.signature) {
            return null;
          }

          const siwe = new SiweMessage(JSON.parse(credentials.message as string));

          const result = await siwe.verify({
            signature: credentials.signature as string,
          });

          if (!result.success) {
            return null;
          }

          // Get or create user
          const address = siwe.address.toLowerCase();

          let user = await prisma.user.findUnique({
            where: { address },
          });

          if (!user) {
            // Create new user with default PATIENT role
            user = await prisma.user.create({
              data: {
                address,
                role: "PATIENT", // Default role for new users
              },
            });
          }

          // Update last active
          await prisma.user.update({
            where: { id: user.id },
            data: { lastActiveAt: new Date() },
          });

          return {
            id: user.id,
            address: user.address,
            role: mapPrismaRoleToUserRole(user.role),
            isVerified: user.isVerified,
            humanityScore: user.humanityScore,
            displayName: user.displayName,
            avatar: user.avatar,
          };
        } catch (error) {
          console.error("SIWE verification error:", error);
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
      if (token.sub) {
        const user = await prisma.user.findUnique({
          where: { id: token.sub as string },
          select: {
            id: true,
            address: true,
            role: true,
            isVerified: true,
            humanityScore: true,
            displayName: true,
            avatar: true,
          },
        });

        if (user) {
          session.user = {
            ...session.user,
            id: user.id,
            address: user.address,
            role: mapPrismaRoleToUserRole(user.role),
            isVerified: user.isVerified,
            humanityScore: user.humanityScore,
            displayName: user.displayName,
            avatar: user.avatar,
          };
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.user = user;
      }
      return token;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;

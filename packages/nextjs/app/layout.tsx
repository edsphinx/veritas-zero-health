import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import { Toaster } from 'sonner';
import './globals.css';
import { Providers } from './providers';
import { auth } from '@/lib/auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DASHI - Decentralized Anonymous Sovereign Health Identity',
  description:
    'Privacy-preserving health identity powered by Zero-Knowledge Proofs. Own your health data, prove without revealing.',
  keywords: [
    'health identity',
    'zero-knowledge proofs',
    'clinical trials',
    'privacy',
    'blockchain',
    'DeSci',
    'anonymous health data',
    'sovereign identity',
    'Web3 health',
  ],
  authors: [{ name: 'DASHI Team' }],
  creator: 'DASHI',
  publisher: 'DASHI',
  applicationName: 'DASHI',
  category: 'Healthcare Technology',
  icons: {
    icon: '/app/icon.svg',
    apple: '/app/apple-icon.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://dashi.health',
    title: 'DASHI - Zero-Knowledge Health Identity',
    description:
      'Privacy-preserving health identity powered by Zero-Knowledge Proofs. Own your health data, prove without revealing.',
    siteName: 'DASHI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DASHI - Zero-Knowledge Health Identity',
    description:
      'Privacy-preserving health identity powered by Zero-Knowledge Proofs. Own your health data, prove without revealing.',
    creator: '@dashi_health',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get cookies from server headers for SSR hydration
  const headersData = await headers();
  const cookies = headersData.get('cookie');

  // Get session from server for NextAuth SessionProvider
  // This ensures session is available immediately on client
  const session = await auth();

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers cookies={cookies} session={session}>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}

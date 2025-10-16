import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import ContextProvider from './context';

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
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get cookies from server headers for SSR hydration
  const headersData = await headers();
  const cookies = headersData.get('cookie');

  return (
    <html lang="en">
      <body className={inter.className}>
        <ContextProvider cookies={cookies}>{children}</ContextProvider>
      </body>
    </html>
  );
}

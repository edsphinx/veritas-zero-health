import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DASHI - Decentralized Anonymous Sovereign Health Identity',
  description: 'Privacy-preserving health identity powered by Zero-Knowledge Proofs. Own your health data, prove without revealing.',
  keywords: ['health identity', 'zero-knowledge proofs', 'clinical trials', 'privacy', 'blockchain', 'DeSci'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

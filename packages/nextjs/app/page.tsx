'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Veritas Zero Health
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Privacy-preserving clinical trial matching with zero-knowledge proofs
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/patient"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Patient Portal
          </Link>
          <Link
            href="/researcher"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Researcher Portal
          </Link>
          <Link
            href="/clinic"
            className="px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Clinic Portal
          </Link>
        </div>
      </motion.div>
    </main>
  );
}

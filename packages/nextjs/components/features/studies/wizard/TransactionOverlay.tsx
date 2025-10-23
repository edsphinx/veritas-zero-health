/**
 * Transaction Overlay Component
 *
 * Full-screen overlay that blocks UI interaction during blockchain transactions
 * Used across all wizard steps to prevent accidental form interactions
 * while transactions are being processed
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface TransactionOverlayProps {
  isVisible: boolean;
  isSuccess?: boolean;
  title: string;
  message: string;
}

export function TransactionOverlay({
  isVisible,
  isSuccess = false,
  title,
  message,
}: TransactionOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
          >
            <div className="text-center space-y-6">
              {/* Progress Icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    {isSuccess ? (
                      <CheckCircle2 className="h-10 w-10 text-success animate-bounce" />
                    ) : (
                      <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    )}
                  </div>
                </div>
              </div>

              {/* Status Message */}
              <div>
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-muted-foreground">{message}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

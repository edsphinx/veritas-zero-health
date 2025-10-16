'use client'

import { useEffect, useState } from 'react';

/**
 * Hook to check if component has mounted on client side
 * Prevents hydration mismatches by ensuring wallet state
 * is only accessed after client-side mount
 */
export function useClientMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []); // Runs only on mount

  return mounted;
}
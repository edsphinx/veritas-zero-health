/**
 * Nillion Demo Page
 *
 * Demonstrates the Nillion integration with browser extension.
 * Shows extension detection, connection, permissions, and health data access.
 */

import { NillionDemo } from '@/components/NillionDemo';

export const metadata = {
  title: 'Nillion Demo | Veritas',
  description: 'Test the Nillion integration with browser extension',
};

export default function NillionDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <NillionDemo />
    </div>
  );
}

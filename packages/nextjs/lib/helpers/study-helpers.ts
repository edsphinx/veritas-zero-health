/**
 * Study Helper Functions
 *
 * Pure utility functions for study-related operations
 */

/**
 * Get Tailwind color classes for study status badge
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 border-gray-200',
    created: 'bg-gray-100 text-gray-800 border-gray-200',
    funding: 'bg-blue-100 text-blue-800 border-blue-200',
    active: 'bg-green-100 text-green-800 border-green-200',
    recruiting: 'bg-blue-100 text-blue-800 border-blue-200',
    paused: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    completed: 'bg-purple-100 text-purple-800 border-purple-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Truncate Ethereum address for display
 *
 * @param address - Full Ethereum address
 * @param startChars - Number of characters to show at start (default: 6)
 * @param endChars - Number of characters to show at end (default: 4)
 * @returns Truncated address like "0x1234...5678"
 */
export function truncateAddress(
  address: string,
  startChars = 6,
  endChars = 4
): string {
  if (!address) return 'Unknown';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format USDC amount for display
 *
 * @param amount - Amount as string or number
 * @returns Formatted amount with $ and USDC suffix
 */
export function formatUSDC(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0 USDC';
  return `$${num.toLocaleString()} USDC`;
}

/**
 * Get status configuration for study card badges
 */
export function getStatusConfig(status: string): {
  label: string;
  color: string;
} {
  const configs: Record<
    string,
    { label: string; color: string }
  > = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
    created: { label: 'Created', color: 'bg-blue-100 text-blue-700' },
    funding: { label: 'Seeking Funding', color: 'bg-yellow-100 text-yellow-700' },
    active: { label: 'Active', color: 'bg-green-100 text-green-700' },
    recruiting: { label: 'Recruiting', color: 'bg-blue-100 text-blue-700' },
    paused: { label: 'Paused', color: 'bg-orange-100 text-orange-700' },
    completed: { label: 'Completed', color: 'bg-purple-100 text-purple-700' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
  };

  return (
    configs[status.toLowerCase()] || {
      label: status,
      color: 'bg-gray-100 text-gray-700',
    }
  );
}

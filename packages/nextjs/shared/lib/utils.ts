import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * Used throughout the application for dynamic class composition
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

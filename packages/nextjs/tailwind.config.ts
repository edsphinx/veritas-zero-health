/**
 * Tailwind CSS v4 Configuration
 *
 * In v4, most configuration is done via CSS using @theme directive.
 * This file is minimal and only used for content paths.
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './presentation/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
};

export default config;

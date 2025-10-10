/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NILLION_PRIVATE_API_KEY: string;
  readonly VITE_NILLION_PUBLIC_API_KEY: string;
  readonly VITE_NILLION_TESTNET: string;
  readonly VITE_NILLION_NODE_URL_1: string;
  readonly VITE_NILLION_NODE_URL_2: string;
  readonly VITE_NILLION_NODE_URL_3: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

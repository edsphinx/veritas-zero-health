/**
 * Extension Infrastructure
 *
 * Communication layer with Veritas browser extension
 */

export {
  ExtensionBridge,
  getExtensionBridge,
  resetExtensionBridge,
  isExtensionAvailable,
  ExtensionNotInstalledError,
  ExtensionTimeoutError,
  PermissionDeniedError,
  type ExtensionBridgeConfig,
} from './ExtensionBridge';

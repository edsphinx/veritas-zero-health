/**
 * Extension Debug Script
 *
 * Paste this in browser console to diagnose why extension is not detected
 */

console.log('🔍 Veritas Extension Diagnostics');
console.log('================================\n');

// 1. Check if window.Veritas exists
console.log('1. window.Veritas exists:', typeof window.Veritas !== 'undefined');

if (typeof window.Veritas !== 'undefined') {
  console.log('   ✅ API found!');
  console.log('   - isInstalled:', window.Veritas.isInstalled());
  console.log('   - version:', window.Veritas.version);
  console.log('   - requestDID:', typeof window.Veritas.requestDID);
  console.log('   - requestPermission:', typeof window.Veritas.requestPermission);
  console.log('   - requestData:', typeof window.Veritas.requestData);
} else {
  console.log('   ❌ API not found');
  console.log('   This means the content script is NOT injecting the API');
}

// 2. Check for veritas-ready event
console.log('\n2. Listening for veritas-ready event...');
let eventFired = false;
window.addEventListener('veritas-ready', () => {
  eventFired = true;
  console.log('   ✅ veritas-ready event fired!');
  console.log('   window.Veritas:', window.Veritas);
});

setTimeout(() => {
  if (!eventFired) {
    console.log('   ❌ veritas-ready event NOT fired after 2s');
  }
}, 2000);

// 3. Check Chrome extension APIs
console.log('\n3. Chrome extension context:');
console.log('   - chrome.runtime:', typeof chrome !== 'undefined' && chrome.runtime ? 'Available' : 'Not available');

// 4. Reload instructions
console.log('\n================================');
console.log('🔧 Troubleshooting Steps:\n');
console.log('If API not found:');
console.log('1. Check extension is LOADED in chrome://extensions');
console.log('2. Extension should be loaded from: packages/browser-extension/dist/');
console.log('3. Check "Service worker" status (should be active)');
console.log('4. Click "Reload" on the extension');
console.log('5. Refresh this page (localhost:3000)');
console.log('6. Open DevTools → Console tab');
console.log('7. Look for these logs:');
console.log('   - "🔌 Veritas Zero Health - Content Script loaded"');
console.log('   - "✅ Veritas API injected"');
console.log('   - "✅ Veritas content script initialized"');
console.log('\nIf you don\'t see those logs:');
console.log('- Content script is NOT running');
console.log('- Check chrome://extensions → Details → Errors');
console.log('- Verify manifest.json has content_scripts configured');
console.log('================================');

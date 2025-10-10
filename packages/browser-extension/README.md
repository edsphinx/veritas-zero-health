# Veritas Zero Health - Browser Extension

A privacy-preserving browser extension for managing decentralized health data.

## Features

- **Decentralized Identity (DID):** Generate and manage your self-sovereign identity
- **Secure Storage:** Encrypted keypair storage using TweetNaCl
- **Data Management:** Control access to your health records
- **Permission System:** Grant/revoke app permissions
- **Activity Logging:** Complete audit trail of all activities
- **postMessage API:** Secure communication with web apps

## Tech Stack

- **TypeScript** - Type-safe development
- **React** - UI framework
- **Vite** - Fast build tool
- **TweetNaCl** - Cryptographic library
- **Chrome Extension Manifest V3** - Latest extension standard

## Installation

### For Development

1. Install dependencies:
```bash
cd packages/browser-extension
yarn install
```

2. Build the extension:
```bash
yarn build
```

3. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `packages/browser-extension/dist` folder

### For Firefox

```bash
yarn build:firefox
```

Then load in Firefox:
- Open `about:debugging#/runtime/this-firefox`
- Click "Load Temporary Add-on"
- Select any file in `dist` folder

## Development

Run in watch mode:
```bash
yarn dev
```

## Architecture

```
browser-extension/
├── src/
│   ├── background/
│   │   └── service-worker.ts    # Background script (DID management, messaging)
│   ├── content/
│   │   └── content-script.ts    # Content script (page communication)
│   ├── popup/
│   │   ├── App.tsx              # Main popup UI
│   │   ├── index.html           # Popup HTML
│   │   └── styles.css           # Popup styles
│   └── lib/
│       └── crypto.ts            # Cryptographic utilities
├── manifest.json                # Extension manifest
├── vite.config.ts               # Vite configuration
└── package.json                 # Dependencies
```

## API for Web Apps

### Check if Extension is Installed

```javascript
if (window.Veritas && window.Veritas.isInstalled()) {
  console.log('Veritas extension installed!');
}
```

### Request User's DID

```javascript
const did = await window.Veritas.requestDID();
console.log('User DID:', did);
```

### Request Permission

```javascript
const result = await window.Veritas.requestPermission([
  'read:diagnoses',
  'read:biomarkers'
]);

if (result.status === 'granted') {
  console.log('Permission granted!');
}
```

### Request Data (if permission granted)

```javascript
const biomarkers = await window.Veritas.requestData('biomarkers');
console.log('Biomarkers:', biomarkers);
```

## Security

### Key Storage

- Private keys are encrypted using password-derived keys
- Keys stored in `chrome.storage.local` (encrypted)
- Password is never stored (only used for decryption)

### Communication

- Content script uses `postMessage` for secure cross-origin communication
- Background script validates all requests
- Activity logging for audit trail

## Permission Types

- `read:diagnoses` - Read medical diagnoses
- `read:biomarkers` - Read lab results and biomarkers
- `read:vitals` - Read vital signs
- `read:profile` - Read patient profile
- `write:*` - Write permissions (future)

## Activity Log

All activities are logged:
- DID creation
- Permission requests
- Permission grants/revokes
- Data access
- Page visits (for connected apps)

## Nillion Integration

The extension integrates with Nillion for encrypted data storage:

- User Owned Collections (future)
- SecretVaults for health records
- Access control via Nillion permissions

## Roadmap

### Phase 1 (Current)
- [x] DID generation
- [x] Secure keypair storage
- [x] Permission system
- [x] Activity logging
- [x] postMessage API

### Phase 2 (Next)
- [ ] Nillion SecretVaults integration
- [ ] Health record CRUD
- [ ] Permission approval UI
- [ ] Data export/import

### Phase 3 (Future)
- [ ] Human Passport integration
- [ ] ZK proof generation in extension
- [ ] Multi-device sync
- [ ] Hardware wallet support

## Testing

```bash
# Type check
yarn type-check

# Lint
yarn lint

# Build
yarn build
```

## Browser Compatibility

- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Firefox 109+ (with polyfill)
- ⚠️ Safari (partial support)

## License

MIT

## Contributing

See main project README for contribution guidelines.

---

**Part of Veritas Zero Health** - Ethical infrastructure for global health sovereignty

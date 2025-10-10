# Testing the Veritas Browser Extension

## Prerequisites

- Chrome or Chromium-based browser (Chrome, Edge, Brave, etc.)
- Extension built (run `yarn build` in this directory)

## Loading the Extension in Chrome

### Step 1: Build the extension

```bash
yarn build
```

This creates the `dist/` folder with the compiled extension.

### Step 2: Open Chrome Extensions page

1. Open Chrome
2. Navigate to `chrome://extensions/`
3. OR: Menu (⋮) → Extensions → Manage Extensions

### Step 3: Enable Developer Mode

1. Toggle "Developer mode" in the top-right corner
2. You should see new buttons appear: "Load unpacked", "Pack extension", "Update"

### Step 4: Load the extension

1. Click "Load unpacked"
2. Navigate to: `packages/browser-extension/dist/`
3. Select the `dist` folder and click "Select"

### Step 5: Verify installation

You should see:
- Extension card with name: "Veritas Zero Health - Private Data Manager"
- Version: 0.1.0
- Extension icon in Chrome toolbar (click puzzle piece icon to pin it)

## Using the Extension

### First Time Setup

1. Click the extension icon in the toolbar
2. You should see the welcome screen
3. Enter a password (min 8 characters) to encrypt your private key
4. Click "Create DID"
5. Your Decentralized Identifier (DID) will be generated and displayed

### Main Features

**My Health Data:**
- View stored health records
- Currently shows empty state (integration pending)

**Permissions:**
- Manage which apps can access your data
- Shows empty state initially

**Activity Log:**
- View history of all actions
- First entry should be "DID_CREATED"

## Testing Nillion Integration

The extension is configured with Nillion API keys from `.env`:
- Private API Key: Loaded automatically
- Public API Key: Available for verification
- Node URLs: Testnet configuration

Current status: Mock implementation (placeholder)
- Records are not actually stored in Nillion yet
- API keys are loaded and logged to console
- Check browser console (F12) for Nillion configuration logs

## Troubleshooting

### Extension doesn't load

**Error: "manifest.json not found"**
- Make sure you selected the `dist/` folder, not the root folder
- Verify `yarn build` completed successfully

**Error: "Icons not found"**
- Normal - icon files are referenced but not yet created
- Extension will work without icons

### Console errors

Open DevTools for the extension:
1. Go to `chrome://extensions/`
2. Find "Veritas Zero Health"
3. Click "Inspect views: service worker" (for background script)
4. Click "Inspect views: popup.html" (for popup)

### Common issues

**Popup doesn't open:**
- Check if service worker is running (should show green dot)
- Look for errors in service worker console

**DID generation fails:**
- Check password length (min 8 characters)
- Look for errors in console

## Development Workflow

### Making changes

1. Edit source files in `src/`
2. Run `yarn build`
3. Go to `chrome://extensions/`
4. Click the refresh icon on the extension card
5. Test changes

### Hot reload (for development)

```bash
yarn dev
```

This watches for changes and rebuilds automatically.
After build, you still need to click refresh in `chrome://extensions/`.

## Uninstalling

1. Go to `chrome://extensions/`
2. Find "Veritas Zero Health - Private Data Manager"
3. Click "Remove"
4. Confirm removal

## Next Steps for Testing

Once the real Nillion integration is implemented:
1. Create a DID
2. Initialize Nillion client (automatic on first use)
3. Try storing a health record
4. Verify record retrieval
5. Test permission granting to external apps

## Firefox Testing

For Firefox:
1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `dist/manifest.json`
4. Extension loads temporarily (removed on browser restart)

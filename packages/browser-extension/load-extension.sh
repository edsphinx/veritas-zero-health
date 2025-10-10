#!/bin/bash

# Script to build and prepare extension for loading in Chrome

echo "Building Veritas Browser Extension..."
echo ""

# Build the extension
yarn build

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "Build successful!"
    echo "========================================="
    echo ""
    echo "To load the extension in Chrome:"
    echo ""
    echo "1. Open Chrome and go to: chrome://extensions/"
    echo "2. Enable 'Developer mode' (toggle in top-right)"
    echo "3. Click 'Load unpacked'"
    echo "4. Navigate to and select this folder:"
    echo ""
    echo "   $(pwd)/dist"
    echo ""
    echo "========================================="
    echo ""
    echo "Extension files are in: dist/"
    ls -lh dist/
else
    echo ""
    echo "Build failed! Check errors above."
    exit 1
fi

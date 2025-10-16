#!/bin/bash

# Sync ZK Files to Browser Extension
# This script copies WASM binaries and cryptographic keys from the ZK package
# to the browser extension's public directory for deployment

set -e  # Exit on error

# Colors for output
GREEN='\033[0.32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Syncing ZK files to browser extension...${NC}"

# Define paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ZK_ROOT="$SCRIPT_DIR/../zk"
EXTENSION_ZK_DIR="$SCRIPT_DIR/public/zk"

# Create target directory if it doesn't exist
mkdir -p "$EXTENSION_ZK_DIR"

echo -e "${YELLOW}📦 Source: $ZK_ROOT${NC}"
echo -e "${YELLOW}🎯 Target: $EXTENSION_ZK_DIR${NC}"
echo ""

# Function to copy file with size display
copy_file() {
  local src=$1
  local dest=$2
  local desc=$3

  if [ -f "$src" ]; then
    cp "$src" "$dest"
    local size=$(du -h "$src" | cut -f1)
    echo -e "${GREEN}✅${NC} Copied $desc ($size)"
  else
    echo -e "${YELLOW}⚠️${NC}  $desc not found at $src"
  fi
}

# Copy WASM module
echo "📦 WASM Module:"
copy_file \
  "$ZK_ROOT/mopro/mopro-wasm/pkg/mopro_wasm_bg.wasm" \
  "$EXTENSION_ZK_DIR/mopro_wasm_bg.wasm" \
  "WASM binary"

copy_file \
  "$ZK_ROOT/mopro/mopro-wasm/pkg/mopro_wasm.js" \
  "$EXTENSION_ZK_DIR/mopro_wasm.js" \
  "WASM JS bindings"

# Copy snippets directory (required for WASM imports)
echo ""
echo "📦 WASM Dependencies:"
if [ -d "$ZK_ROOT/mopro/mopro-wasm/pkg/snippets" ]; then
  cp -r "$ZK_ROOT/mopro/mopro-wasm/pkg/snippets" "$EXTENSION_ZK_DIR/"
  echo -e "${GREEN}✅${NC} Copied WASM snippets directory"
else
  echo -e "${YELLOW}⚠️${NC}  WASM snippets not found"
fi

echo ""

# Copy cryptographic keys
echo "🔑 Cryptographic Keys:"
copy_file \
  "$ZK_ROOT/circuits/plonk-wrappers/plonk-composite/out/plonk_eligibility_pk.bin" \
  "$EXTENSION_ZK_DIR/plonk_eligibility_pk.bin" \
  "Proving Key (PK)"

copy_file \
  "$ZK_ROOT/circuits/plonk-wrappers/plonk-composite/out/plonk_eligibility_vk.bin" \
  "$EXTENSION_ZK_DIR/plonk_eligibility_vk.bin" \
  "Verifying Key (VK)"

copy_file \
  "$ZK_ROOT/mopro/cli/src/template/init/test-vectors/halo2/plonk_fibonacci_srs.bin" \
  "$EXTENSION_ZK_DIR/plonk_clinical_trials_srs.bin" \
  "SRS (Structured Reference String)"

echo ""

# Copy Circom circuit files
echo "🔐 Circom Eligibility Circuit:"
copy_file \
  "$ZK_ROOT/archived/circom/build/eligibility_code_js/eligibility_code.wasm" \
  "$EXTENSION_ZK_DIR/eligibility_code.wasm" \
  "Eligibility Circuit WASM"

copy_file \
  "$ZK_ROOT/archived/circom/setup/eligibility_0000.zkey" \
  "$EXTENSION_ZK_DIR/eligibility_0000.zkey" \
  "Eligibility Proving Key (zkey)"

echo ""
echo -e "${GREEN}✅ ZK files synced successfully!${NC}"
echo ""
echo "📊 Extension ZK directory contents:"
ls -lh "$EXTENSION_ZK_DIR"

#!/usr/bin/env bash
set -e

# Based on Aztec's working script:
# noir_aztec/compiler/integration-tests/scripts/generate-solidity-verifiers.sh

echo "==================================================================="
echo "Eligibility Code Verifier Generation (Aztec Method)"
echo "==================================================================="

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/eligibility_code"

# Use the same paths as Aztec
NARGO=$HOME/.nargo/bin/nargo
BB=$HOME/.bb/bb
OUTPUT_CONTRACT="$SCRIPT_DIR/../foundry/contracts/EligibilityVerifier.sol"

KEYS=$(mktemp -d)

echo ""
echo "📁 Working directory: $(pwd)"
echo "📁 Temp keys directory: $KEYS"
echo ""

echo "🔧 Step 1: Compiling circuit with nargo..."
$NARGO compile --pedantic-solving
echo "   ✅ Circuit compiled"
echo ""

echo "🔑 Step 2: Generating verification key with keccak (Aztec method)..."
# EXACTLY as Aztec does it - write vk file to temp directory
$BB write_vk -b ./target/eligibility_code.json -o $KEYS/vk --oracle_hash keccak
echo "   ✅ Verification key generated at $KEYS/vk"
echo ""

echo "📜 Step 3: Generating Solidity verifier (Aztec method)..."
# Try the newer command first
if $BB write_solidity_verifier -k $KEYS/vk -o "$OUTPUT_CONTRACT" 2>/dev/null; then
    echo "   ✅ Used write_solidity_verifier command"
else
    echo "   ℹ️  write_solidity_verifier not available, trying contract command..."
    $BB contract -k $KEYS/vk -o "$OUTPUT_CONTRACT"
    echo "   ✅ Used contract command"
fi

echo "   ✅ Solidity verifier generated at:"
echo "      $OUTPUT_CONTRACT"
echo ""

# Clean up temp keys
rm -rf $KEYS
echo "🧹 Cleaned up temporary keys"
echo ""

# Get file size
if [ -f "$OUTPUT_CONTRACT" ]; then
    SIZE=$(du -h "$OUTPUT_CONTRACT" | cut -f1)
    LINES=$(wc -l < "$OUTPUT_CONTRACT")
    echo "📊 Verifier contract stats:"
    echo "   Size: $SIZE"
    echo "   Lines: $LINES"
else
    echo "❌ Error: Verifier contract not found"
    exit 1
fi

echo ""
echo "==================================================================="
echo "✅ SUCCESS! Verifier generated with Aztec's method"
echo "==================================================================="
echo ""
echo "Next steps:"
echo "  1. Try to compile: cd ../../ && forge build"
echo "  2. If it compiles, we can deploy!"
echo "  3. If not, we know it's a fundamental issue with UltraHonk"
echo ""

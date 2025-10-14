#!/bin/bash
set -e

echo "==================================================================="
echo "Eligibility Code Verifier Generation"
echo "==================================================================="

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/eligibility_code"

BB=$HOME/.bb/bb
NARGO=$HOME/.nargo/bin/nargo
OUTPUT_CONTRACT="$SCRIPT_DIR/../foundry/contracts/EligibilityVerifierGenerated.sol"

echo ""
echo "📁 Working directory: $(pwd)"
echo ""

echo "🔧 Step 1: Compiling circuit..."
$NARGO compile
echo "   ✅ Circuit compiled"
echo ""

echo "🔑 Step 2: Generating verification key with keccak..."
$BB write_vk -b ./target/eligibility_code.json -o ./target/vk --oracle_hash keccak
echo "   ✅ Verification key generated"
echo ""

echo "📜 Step 3: Generating Solidity verifier contract..."
$BB write_solidity_verifier -k ./target/vk -o "$OUTPUT_CONTRACT"
echo "   ✅ Solidity verifier generated at:"
echo "      $OUTPUT_CONTRACT"
echo ""

# Get file size
if [ -f "$OUTPUT_CONTRACT" ]; then
    SIZE=$(du -h "$OUTPUT_CONTRACT" | cut -f1)
    echo "📊 Verifier contract size: $SIZE"
else
    echo "❌ Error: Verifier contract not found"
    exit 1
fi

echo ""
echo "==================================================================="
echo "✅ SUCCESS!"
echo "==================================================================="
echo ""
echo "Next steps:"
echo "  1. Check contract size (should be MUCH smaller than 137KB)"
echo "  2. Compile contracts: cd ../../ && yarn compile"
echo "  3. Update StudyRegistryImpl.sol to use EligibilityVerifier"
echo ""
echo "Eligibility Code System:"
echo "  - Investigators publish code hashes on-chain"
echo "  - Patients prove they know a matching code"
echo "  - Much simpler than range proofs!"
echo ""

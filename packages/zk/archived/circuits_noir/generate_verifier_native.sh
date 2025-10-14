#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/age_verification"

BB=$HOME/.bb/bb
OUTPUT_CONTRACT="$SCRIPT_DIR/../foundry/contracts/AgeVerifierGenerated.sol"

echo "🔧 Compiling circuit..."
$HOME/.nargo/bin/nargo compile

echo "📝 Generating witness..."
$HOME/.nargo/bin/nargo execute witness

echo "🔑 Generating verification key..."
$BB write_vk -b ./target/age_verification.json -o ./target/vk

echo "📜 Generating Solidity verifier..."
$BB contract -k ./target/vk -o "$OUTPUT_CONTRACT"

echo "✅ Generating proof..."
$BB prove -b ./target/age_verification.json -w ./target/witness.gz -o ./target/proof

echo "✓ Verifying proof..."
$BB verify -k ./target/vk -p ./target/proof

echo ""
echo "🎉 Success! Verifier generated at:"
echo "   $OUTPUT_CONTRACT"

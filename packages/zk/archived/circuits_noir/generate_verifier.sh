#!/bin/bash
set -e

cd "$(dirname "$0")/age_verification"

echo "🔧 Compiling circuit..."
$HOME/.nargo/bin/nargo compile

echo "📝 Generating witness..."
$HOME/.nargo/bin/nargo execute witness

echo "🔑 Generating verification key..."
yarn bb.js write_vk -b ./target/age_verification.json -o ./target

echo "📜 Generating Solidity verifier..."
yarn bb.js contract -k ./target/vk -o ../foundry/contracts/AgeVerifierGenerated.sol

echo "✅ Generating proof..."
yarn bb.js prove -b ./target/age_verification.json -w ./target/witness.gz -o ./target

echo "✓ Verifying proof..."
yarn bb.js verify -k ./target/vk -p ./target/proof

echo ""
echo "🎉 Success! Verifier generated at:"
echo "   packages/foundry/contracts/AgeVerifierGenerated.sol"

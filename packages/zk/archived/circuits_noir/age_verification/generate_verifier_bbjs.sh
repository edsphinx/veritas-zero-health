#!/bin/bash
# Veritas Zero Health - Generate Solidity Verifier using bb.js
# This script uses @aztec/bb.js instead of the native bb binary

set -eu

echo "================================================"
echo "Veritas Zero Health - Verifier Generation (bb.js)"
echo "================================================"
echo ""

CIRCUIT_NAME="age_verification"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Compile the circuit
echo -e "${BLUE}[1/5]${NC} Compiling Noir circuit..."
~/.nargo/bin/nargo compile
echo -e "${GREEN}✓${NC} Circuit compiled successfully"
echo ""

# 2. Generate witness from example inputs
echo -e "${BLUE}[2/5]${NC} Generating witness from Prover.toml..."
~/.nargo/bin/nargo execute witness
echo -e "${GREEN}✓${NC} Witness generated: target/witness.gz"
echo ""

# Check if bb.js is available
if ! command -v bb.js &> /dev/null; then
    echo -e "${YELLOW}Warning:${NC} bb.js not found in PATH."
    echo "Installing @aztec/bb.js locally..."
    cd ../../..
    npm install @aztec/bb.js
    cd packages/circuits/age_verification
    echo -e "${GREEN}✓${NC} bb.js installed"
    echo ""
fi

# 3. Generate verification key
echo -e "${BLUE}[3/5]${NC} Generating verification key..."
npx bb.js write_vk -b ./target/$CIRCUIT_NAME.json -o ./target
echo -e "${GREEN}✓${NC} Verification key generated: target/vk"
echo ""

# 4. Generate Solidity verifier
echo -e "${BLUE}[4/5]${NC} Generating Solidity verifier contract..."
npx bb.js contract -k ./target/vk -o ../../foundry/contracts/AgeVerifierGenerated.sol
echo -e "${GREEN}✓${NC} Solidity verifier generated: ../../foundry/contracts/AgeVerifierGenerated.sol"
echo ""

# 5. Generate proof as validation
echo -e "${BLUE}[5/5]${NC} Generating proof for validation..."
npx bb.js prove -b ./target/$CIRCUIT_NAME.json -w ./target/witness.gz -o ./target
echo -e "${GREEN}✓${NC} Proof generated: target/proof"
echo ""

# 6. Verify proof
echo -e "${BLUE}[Validation]${NC} Verifying proof..."
npx bb.js verify -k ./target/vk -p ./target/proof
echo -e "${GREEN}✓${NC} Proof verified successfully!"
echo ""

echo "================================================"
echo "✓ Verifier generation complete!"
echo "================================================"
echo ""
echo "Generated files:"
echo "  - target/vk (verification key)"
echo "  - target/proof (example proof)"
echo "  - ../../foundry/contracts/AgeVerifierGenerated.sol"
echo ""
echo "Next steps:"
echo "1. Deploy AgeVerifierGenerated.sol using Foundry"
echo "2. Update StudyRegistryImpl.sol to use the new verifier"
echo "3. Test end-to-end flow from frontend"

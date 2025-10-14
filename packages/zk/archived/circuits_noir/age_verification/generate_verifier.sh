#!/bin/bash
# Veritas Zero Health - Generate Solidity Verifier Script
# This script generates a Solidity verifier contract from the Noir circuit

set -eu

echo "================================================"
echo "Veritas Zero Health - Verifier Generation"
echo "================================================"
echo ""

# Set backend
BACKEND=${BACKEND:-bb}
CIRCUIT_NAME="age_verification"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
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

# Check if bb is available
if ! command -v $BACKEND &> /dev/null; then
    echo -e "${BLUE}Note:${NC} Barretenberg (bb) not found in PATH."
    echo "To complete the verification flow, install bb:"
    echo "  curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/master/barretenberg/cpp/installation/install | bash"
    echo "  bbup -v 0.66.0"
    echo ""
    echo "Alternatively, use Docker:"
    echo "  docker run --rm -v \$(pwd):/workspace aztecprotocol/bb:latest write_vk -b /workspace/target/$CIRCUIT_NAME.json"
    echo ""
    exit 0
fi

# 3. Generate verification key
echo -e "${BLUE}[3/5]${NC} Generating verification key..."
$BACKEND write_vk -b ./target/$CIRCUIT_NAME.json -o ./target
echo -e "${GREEN}✓${NC} Verification key generated: target/vk"
echo ""

# 4. Generate Solidity verifier
echo -e "${BLUE}[4/5]${NC} Generating Solidity verifier contract..."
$BACKEND write_solidity_verifier -k ./target/vk -o ../../foundry/contracts/AgeVerifierGenerated.sol
echo -e "${GREEN}✓${NC} Solidity verifier generated: ../../foundry/contracts/AgeVerifierGenerated.sol"
echo ""

# 5. Generate proof as validation
echo -e "${BLUE}[5/5]${NC} Generating proof for validation..."
mkdir -p ./proofs
$BACKEND prove -b ./target/$CIRCUIT_NAME.json -w ./target/witness.gz -o ./proofs
echo -e "${GREEN}✓${NC} Proof generated: proofs/proof"
echo ""

# 6. Verify proof
echo -e "${BLUE}[Validation]${NC} Verifying proof..."
$BACKEND verify -k ./target/vk -p ./proofs/proof
echo -e "${GREEN}✓${NC} Proof verified successfully!"
echo ""

echo "================================================"
echo "✓ Verifier generation complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Deploy AgeVerifierGenerated.sol using Foundry"
echo "2. Integrate with StudyRegistryImpl.sol"
echo "3. Test end-to-end flow from frontend"

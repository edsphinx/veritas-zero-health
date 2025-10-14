#!/bin/bash
set -e

# Temporary circuit to print the hash
cat > src/hash_helper.nr <<'EOF'
use dep::std;

fn main() -> pub Field {
    let mut code: [u8; 32] = [0; 32];
    code[0] = 65;  // 'A'
    code[1] = 71;  // 'G'
    code[2] = 49;  // '1'
    code[3] = 56;  // '8'
    code[4] = 52;  // '4'
    code[5] = 53;  // '5'

    let mut code_as_fields: [Field; 32] = [0; 32];
    for i in 0..32 {
        code_as_fields[i] = code[i] as Field;
    }

    std::hash::pedersen_hash(code_as_fields)
}
EOF

# Update Nargo.toml to use hash_helper temporarily
mv Nargo.toml Nargo.toml.bak
cat > Nargo.toml <<'EOF'
[package]
name = "hash_helper"
type = "bin"
authors = [""]
compiler_version = ">=0.31.0"

[dependencies]
EOF

# Compile and execute
$HOME/.nargo/bin/nargo compile
$HOME/.nargo/bin/nargo execute hash_output

# Restore original
mv Nargo.toml.bak Nargo.toml
rm src/hash_helper.nr

# Read the output
if [ -f target/hash_output.gz ]; then
    echo "Hash computed. Check target/hash_output.gz"
fi

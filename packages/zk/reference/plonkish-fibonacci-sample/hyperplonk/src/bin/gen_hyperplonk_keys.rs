use fibonacci_circuit::gen_keys;

use hyperplonk_fibonacci::HyperPlonkScheme;

pub fn main() {
    // This function read SRS file as argument
    gen_keys::<HyperPlonkScheme>("hyperplonk")
}

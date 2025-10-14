use fibonacci_circuit::gen_keys;

use gemini_fibonacci::GeminiScheme;

pub fn main() {
    // This function read SRS file as argument
    gen_keys::<GeminiScheme>("gemini")
}

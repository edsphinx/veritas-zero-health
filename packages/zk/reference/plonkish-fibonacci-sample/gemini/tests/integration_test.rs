use fibonacci_circuit::test_prove_verify_end_to_end;
use gemini_fibonacci::GeminiScheme;

#[test]
pub fn gemini_integration_test() {
    test_prove_verify_end_to_end::<GeminiScheme>(
        "gen-gemini-keys",
        "unihyperplonk-srs-4",
        "out/gemini_fibonacci_pk.bin",
        "out/gemini_fibonacci_vk.bin",
    )
}

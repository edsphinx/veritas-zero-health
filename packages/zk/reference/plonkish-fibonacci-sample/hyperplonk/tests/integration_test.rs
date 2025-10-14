use fibonacci_circuit::test_prove_verify_end_to_end;
use hyperplonk_fibonacci::HyperPlonkScheme;

#[test]
pub fn hyperplonk_integration_test() {
    test_prove_verify_end_to_end::<HyperPlonkScheme>(
        "gen-hyperplonk-keys",
        "hyperplonk-srs-4",
        "out/hyperplonk_fibonacci_pk.bin",
        "out/hyperplonk_fibonacci_vk.bin",
    )
}

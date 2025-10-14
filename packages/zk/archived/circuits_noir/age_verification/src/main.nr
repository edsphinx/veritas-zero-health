// Age Range Verification Circuit for Veritas Zero Health
// This circuit allows a patient to prove their age is within a valid range
// for clinical trial eligibility without revealing their exact age

fn main(
    // Private inputs (not revealed to verifier)
    age: u32,

    // Public inputs (known to verifier)
    min_age: pub u32,
    max_age: pub u32
) {
    // Verify that the age is within the valid range [min_age, max_age]
    assert(age >= min_age, "Age is below minimum requirement");
    assert(age <= max_age, "Age is above maximum requirement");
}

#[test]
fn test_valid_age() {
    // Test case: 25 years old applying for 18-65 trial
    main(25, 18, 65);
}

#[test]
fn test_minimum_age() {
    // Test case: exactly 18 years old (boundary case)
    main(18, 18, 65);
}

#[test]
fn test_maximum_age() {
    // Test case: exactly 65 years old (boundary case)
    main(65, 18, 65);
}

#[test]
fn test_age_too_young_should_fail() {
    // This test should fail when uncommented
    // main(17, 18, 65);
}

#[test]
fn test_age_too_old_should_fail() {
    // This test should fail when uncommented
    // main(66, 18, 65);
}

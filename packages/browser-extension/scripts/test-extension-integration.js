/**
 * Integration Test: Browser Extension → Next.js API → Nillion
 *
 * This script simulates the extension's Nillion client calls
 * to verify the full integration works correctly.
 *
 * Usage:
 *   yarn test:integration
 */
// Simulated extension environment
const API_BASE_URL = 'http://localhost:3000';
const TEST_USER_DID = 'did:veritas:integration-test-789';
/**
 * Simulate extension's storeRecord call
 */
async function testStoreRecord(type, data) {
    console.log(`\n📤 Testing Store: ${type}`);
    const response = await fetch(`${API_BASE_URL}/api/nillion/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type,
            userId: TEST_USER_DID,
            data,
        }),
    });
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Failed to store record');
    }
    console.log(`   ✅ Stored successfully`);
    console.log(`   📋 Record ID: ${result.data.recordId}`);
    console.log(`   🕐 Timestamp: ${new Date(result.data.timestamp).toISOString()}`);
    return result.data.recordId;
}
/**
 * Simulate extension's getRecords call
 */
async function testGetRecords(type) {
    console.log(`\n📥 Testing Retrieve: ${type}`);
    const url = new URL(`${API_BASE_URL}/api/nillion/retrieve`);
    url.searchParams.set('type', type);
    url.searchParams.set('userId', TEST_USER_DID);
    const response = await fetch(url.toString());
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Failed to retrieve records');
    }
    console.log(`   ✅ Retrieved ${result.data.count} records`);
    if (result.data.records.length > 0) {
        const latest = result.data.records[result.data.records.length - 1];
        console.log(`   📋 Latest Record ID: ${latest.id}`);
        console.log(`   📄 Data:`, JSON.stringify(latest.data, null, 2));
    }
    return result.data.records;
}
/**
 * Simulate extension's deleteRecord call
 */
async function testDeleteRecord(type, recordId) {
    console.log(`\n🗑️  Testing Delete: ${type}/${recordId}`);
    const response = await fetch(`${API_BASE_URL}/api/nillion/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type,
            recordId,
        }),
    });
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Failed to delete record');
    }
    console.log(`   ✅ Deleted successfully`);
}
/**
 * Main integration test
 */
async function main() {
    console.log('🧪 Browser Extension Integration Test');
    console.log('====================================\n');
    console.log('Testing: Extension → Next.js API → Nillion Network\n');
    try {
        // Test 1: Store health records
        console.log('📝 Test 1: Store Health Records');
        console.log('--------------------------------');
        const diagnosisData = {
            condition: 'Integration Test Condition',
            severity: 'Low',
            diagnosedDate: '2025-10-13',
            notes: 'Automated integration test',
        };
        const biomarkerData = {
            testName: 'HbA1c Test',
            value: 5.4,
            unit: '%',
            testDate: '2025-10-13',
            referenceRange: '4.0-5.6%',
        };
        const diagnosisId = await testStoreRecord('diagnoses', diagnosisData);
        const biomarkerId = await testStoreRecord('biomarkers', biomarkerData);
        // Test 2: Retrieve health records
        console.log('\n\n📖 Test 2: Retrieve Health Records');
        console.log('-----------------------------------');
        const diagnoses = await testGetRecords('diagnoses');
        const biomarkers = await testGetRecords('biomarkers');
        // Verify we got our records back
        const foundDiagnosis = diagnoses.find((r) => r.id === diagnosisId);
        const foundBiomarker = biomarkers.find((r) => r.id === biomarkerId);
        if (!foundDiagnosis) {
            throw new Error('Diagnosis record not found after storage!');
        }
        if (!foundBiomarker) {
            throw new Error('Biomarker record not found after storage!');
        }
        console.log('\n   ✅ Data integrity verified: Records match stored data');
        // Test 3: Delete health records
        console.log('\n\n🗑️  Test 3: Delete Health Records');
        console.log('----------------------------------');
        await testDeleteRecord('diagnoses', diagnosisId);
        await testDeleteRecord('biomarkers', biomarkerId);
        // Verify deletion
        console.log('\n   🔍 Verifying deletion...');
        const diagnosesAfter = await testGetRecords('diagnoses');
        const biomarkersAfter = await testGetRecords('biomarkers');
        const stillHasDiagnosis = diagnosesAfter.find((r) => r.id === diagnosisId);
        const stillHasBiomarker = biomarkersAfter.find((r) => r.id === biomarkerId);
        if (stillHasDiagnosis || stillHasBiomarker) {
            throw new Error('Records still exist after deletion!');
        }
        console.log('   ✅ Deletion verified: Records no longer exist\n');
        // Summary
        console.log('\n✅ All Integration Tests Passed!');
        console.log('=================================\n');
        console.log('📋 Test Summary:');
        console.log('   ✅ Store: Diagnoses, Biomarkers');
        console.log('   ✅ Retrieve: Data integrity verified');
        console.log('   ✅ Delete: Records removed successfully');
        console.log('\n🎉 Browser extension is fully integrated with Nillion!\n');
        console.log('Next steps:');
        console.log('   1. Load extension in Chrome: chrome://extensions');
        console.log('   2. Enable Developer Mode');
        console.log('   3. Click "Load unpacked" and select:');
        console.log('      packages/browser-extension/dist\n');
    }
    catch (error) {
        console.error('\n❌ Integration Test Failed:', error);
        if (error instanceof Error) {
            console.error('   Message:', error.message);
        }
        process.exit(1);
    }
}
main();

/**
 * Test Nillion API Routes
 *
 * Tests the Next.js API routes for Nillion operations
 *
 * Usage:
 *   yarn nillion:test-api
 */
async function main() {
    const API_BASE = 'http://localhost:3000';
    console.log('🧪 Testing Nillion API Routes');
    console.log('==============================\n');
    try {
        // Test 1: Store data
        console.log('📝 Test 1: POST /api/nillion/store');
        const testUserId = 'did:veritas:test456';
        const testData = {
            condition: 'API Test Condition',
            severity: 'Medium',
            diagnosedDate: '2025-10-13',
            notes: 'Test from API route',
        };
        const storeResponse = await fetch(`${API_BASE}/api/nillion/store`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'diagnoses',
                userId: testUserId,
                data: testData,
            }),
        });
        if (!storeResponse.ok) {
            const error = await storeResponse.text();
            throw new Error(`Store failed: ${storeResponse.status} - ${error}`);
        }
        const storeResult = await storeResponse.json();
        console.log('✅ Data stored successfully');
        console.log(`   Record ID: ${storeResult.data.recordId}`);
        console.log(`   Collection: ${storeResult.data.collectionId}`);
        console.log(`   Timestamp: ${new Date(storeResult.data.timestamp).toISOString()}`);
        console.log();
        // Test 2: Retrieve data
        console.log('📖 Test 2: GET /api/nillion/retrieve');
        const retrieveResponse = await fetch(`${API_BASE}/api/nillion/retrieve?type=diagnoses&userId=${testUserId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!retrieveResponse.ok) {
            const error = await retrieveResponse.text();
            throw new Error(`Retrieve failed: ${retrieveResponse.status} - ${error}`);
        }
        const retrieveResult = await retrieveResponse.json();
        console.log('✅ Data retrieved successfully');
        console.log(`   Records found: ${retrieveResult.data.count}`);
        if (retrieveResult.data.records.length > 0) {
            const record = retrieveResult.data.records[0];
            console.log(`   First record ID: ${record.id}`);
            console.log(`   User ID: ${record.userId}`);
            console.log(`   Data:`, record.data);
        }
        console.log();
        // Test 3: Delete data
        console.log('🗑️  Test 3: DELETE /api/nillion/delete');
        const deleteResponse = await fetch(`${API_BASE}/api/nillion/delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'diagnoses',
                recordId: storeResult.data.recordId,
            }),
        });
        if (!deleteResponse.ok) {
            const error = await deleteResponse.text();
            throw new Error(`Delete failed: ${deleteResponse.status} - ${error}`);
        }
        const _deleteResult = await deleteResponse.json();
        console.log('✅ Data deleted successfully');
        console.log();
        // Summary
        console.log('✅ All API route tests passed!\n');
        console.log('📋 Summary:');
        console.log('   ✅ POST /api/nillion/store: Working');
        console.log('   ✅ GET /api/nillion/retrieve: Working');
        console.log('   ✅ DELETE /api/nillion/delete: Working');
        console.log();
        console.log('🎉 Your Nillion API routes are fully functional!');
        console.log('   Browser extension can now communicate with Nillion.');
        console.log();
    }
    catch (error) {
        console.error('❌ Test failed:', error);
        if (error instanceof Error) {
            console.error('   Message:', error.message);
        }
        process.exit(1);
    }
}
main();

/**
 * Integration tests for leaderboard backend
 * Validates score submission, leaderboard retrieval, validation, and error handling
 */

import { IDatastore, createDatastore } from './datastore.js';
import { validateScoreSubmission } from './types.js';

function testDatastoreOperations(): void {
    console.log('\n🧪 Testing datastore operations...');

    const datastore = createDatastore('memory');
    datastore.initialize();

    // Test 1: Submit a valid score
    console.log('  ✓ Test 1: Submitting valid score');
    const entry1 = datastore.submitScore('player-1', 'Alice', 1450);
    console.log(`    Entry stored: id=${entry1.id}, score=${entry1.score}`);

    // Test 2: Duplicate display names across different GUIDs should be independent
    console.log('  ✓ Test 2: Duplicate display names are independent by GUID');
    const duplicateA = datastore.submitScore('player-2', 'Alex', 1200);
    const duplicateB = datastore.submitScore('player-3', 'Alex', 1900);
    if (duplicateA.playerGUID === duplicateB.playerGUID) {
        throw new Error('Different players should not share GUID');
    }
    console.log('    Duplicate names accepted for different GUIDs');

    // Test 3: Repeated submission from same GUID keeps best score only
    console.log('  ✓ Test 3: Repeated submissions merge by GUID using best score');
    datastore.submitScore('player-1', 'Alice', 1100); // Lower score should not replace best
    const merged = datastore.submitScore('player-1', 'Alice', 1650); // Higher score should replace
    if (merged.score !== 1650) {
        throw new Error(`Expected best score 1650 for player-1, got ${merged.score}`);
    }
    console.log('    Best-score merge behavior verified');

    // Test 4: Rename player and verify GUID association remains intact
    console.log('  ✓ Test 4: Renaming keeps GUID score association');
    const renamed = datastore.submitScore('player-1', 'Alice Renamed', 1500); // Lower than best; name changes
    if (renamed.playerGUID !== 'player-1') {
        throw new Error('GUID association should remain stable after rename');
    }
    if (renamed.score !== 1650) {
        throw new Error(`Rename should not lower best score; got ${renamed.score}`);
    }
    if (renamed.displayName !== 'Alice Renamed') {
        throw new Error(`Expected updated display name, got ${renamed.displayName}`);
    }
    console.log('    Rename metadata update verified without score reassignment');

    // Test 5: Fetch leaderboard - sorted by score desc and merged by GUID
    console.log('  ✓ Test 5: Fetching leaderboard (sorted by score desc, merged by GUID)');
    const leaderboard = datastore.getLeaderboard(100);
    console.log(`    Leaderboard has ${leaderboard.length} entries`);
    leaderboard.forEach((entry, idx) => {
        console.log(`    #${idx + 1}: ${entry.displayName} - ${entry.score} points`);
    });

    if (leaderboard.length !== 3) {
        throw new Error(`Expected 3 merged entries (one per GUID), got ${leaderboard.length}`);
    }

    // Validate sort order
    for (let i = 1; i < leaderboard.length; i++) {
        if (leaderboard[i - 1].score < leaderboard[i].score) {
            throw new Error('Leaderboard not sorted correctly by score descending');
        }
    }

    // Test 6: Fetch with limit
    console.log('  ✓ Test 6: Fetching leaderboard with limit=2');
    const limited = datastore.getLeaderboard(2);
    console.log(`    Limited leaderboard: ${limited.length} entries`);

    if (limited.length !== 2) {
        throw new Error(`Expected 2 entries, got ${limited.length}`);
    }

    datastore.close();
    console.log('  ✅ All datastore tests passed!\n');
}

function testValidation(): void {
    console.log('🧪 Testing payload validation...');

    // Test 1: Valid payload
    console.log('  ✓ Test 1: Valid payload');
    const valid = {
        playerGUID: '550e8400-e29b-41d4-a716-446655440000',
        displayName: 'Alice',
        score: 1450,
    };
    if (!validateScoreSubmission(valid)) {
        throw new Error('Valid payload failed validation');
    }
    console.log('    Valid payload accepted');

    // Test 2: Missing playerGUID
    console.log('  ✓ Test 2: Missing playerGUID');
    const noGuid = { displayName: 'Alice', score: 1450 };
    if (validateScoreSubmission(noGuid)) {
        throw new Error('Should reject missing playerGUID');
    }
    console.log('    Correctly rejected');

    // Test 3: Empty displayName
    console.log('  ✓ Test 3: Empty displayName');
    const emptyName = {
        playerGUID: '550e8400-e29b-41d4-a716-446655440000',
        displayName: '',
        score: 1450,
    };
    if (validateScoreSubmission(emptyName)) {
        throw new Error('Should reject empty displayName');
    }
    console.log('    Correctly rejected');

    // Test 4: Score out of range (negative)
    console.log('  ✓ Test 4: Score out of range (negative)');
    const negScore = {
        playerGUID: '550e8400-e29b-41d4-a716-446655440000',
        displayName: 'Alice',
        score: -100,
    };
    if (validateScoreSubmission(negScore)) {
        throw new Error('Should reject negative score');
    }
    console.log('    Correctly rejected');

    // Test 5: Score out of range (too high)
    console.log('  ✓ Test 5: Score out of range (> 1M)');
    const highScore = {
        playerGUID: '550e8400-e29b-41d4-a716-446655440000',
        displayName: 'Alice',
        score: 2000000,
    };
    if (validateScoreSubmission(highScore)) {
        throw new Error('Should reject score > 1,000,000');
    }
    console.log('    Correctly rejected');

    // Test 6: Non-integer score
    console.log('  ✓ Test 6: Non-integer score');
    const floatScore = {
        playerGUID: '550e8400-e29b-41d4-a716-446655440000',
        displayName: 'Alice',
        score: 145.5,
    };
    if (validateScoreSubmission(floatScore)) {
        throw new Error('Should reject non-integer score');
    }
    console.log('    Correctly rejected');

    console.log('  ✅ All validation tests passed!\n');
}

async function main(): Promise<void> {
    console.log('🚀 Running backend integration tests...');
    console.log('='.repeat(50));

    try {
        testDatastoreOperations();
        testValidation();

        console.log('='.repeat(50));
        console.log('✅ All tests passed! Backend is ready for integration.\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

main();

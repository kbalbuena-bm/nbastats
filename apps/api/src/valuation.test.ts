/**
 * Unit tests for Player Valuation Module
 *
 * Run with: npx tsx src/valuation.test.ts
 * Or add to package.json scripts if using a test runner
 */

import {
  calculateTrueShootingPct,
  scaleToPer36,
  calculateImpactScoreBreakdown,
  calculateWeightedImpactScore,
  calculateAgeFactor,
  calculateFairAAV,
  calculateStockIndex,
  determineTrajectory,
  computePlayerValuation,
  SeasonStats
} from './valuation';

// ===== TEST UTILITIES =====

let testsPassed = 0;
let testsFailed = 0;

function assertApproxEqual(actual: number, expected: number, tolerance: number, testName: string): void {
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    console.log(`✅ ${testName}: PASSED (${actual.toFixed(4)} ≈ ${expected.toFixed(4)})`);
    testsPassed++;
  } else {
    console.log(`❌ ${testName}: FAILED (expected ${expected.toFixed(4)}, got ${actual.toFixed(4)})`);
    testsFailed++;
  }
}

function assertEqual<T>(actual: T, expected: T, testName: string): void {
  if (actual === expected) {
    console.log(`✅ ${testName}: PASSED`);
    testsPassed++;
  } else {
    console.log(`❌ ${testName}: FAILED (expected ${expected}, got ${actual})`);
    testsFailed++;
  }
}

function assertTrue(condition: boolean, testName: string): void {
  if (condition) {
    console.log(`✅ ${testName}: PASSED`);
    testsPassed++;
  } else {
    console.log(`❌ ${testName}: FAILED (condition was false)`);
    testsFailed++;
  }
}

// ===== TEST DATA =====

const sampleSeasonStats: SeasonStats = {
  season: '2024-25',
  gamesPlayed: 50,
  minutes: 1700, // ~34 min/game
  points: 1250, // 25 ppg
  assists: 300, // 6 apg
  rebounds: 400, // 8 rpg
  steals: 75, // 1.5 spg
  blocks: 50, // 1 bpg
  turnovers: 150, // 3 topg
  fgMade: 450,
  fgAttempted: 950,
  fg3Made: 100,
  fg3Attempted: 280,
  ftMade: 250,
  ftAttempted: 300
};

const multiSeasonStats: SeasonStats[] = [
  {
    season: '2024-25',
    gamesPlayed: 50,
    minutes: 1700,
    points: 1250,
    assists: 300,
    rebounds: 400,
    steals: 75,
    blocks: 50,
    turnovers: 150,
    fgMade: 450,
    fgAttempted: 950,
    fg3Made: 100,
    fg3Attempted: 280,
    ftMade: 250,
    ftAttempted: 300
  },
  {
    season: '2023-24',
    gamesPlayed: 70,
    minutes: 2380,
    points: 1680, // 24 ppg
    assists: 350,
    rebounds: 490,
    steals: 84,
    blocks: 56,
    turnovers: 175,
    fgMade: 600,
    fgAttempted: 1300,
    fg3Made: 140,
    fg3Attempted: 400,
    ftMade: 340,
    ftAttempted: 400
  },
  {
    season: '2022-23',
    gamesPlayed: 65,
    minutes: 2080,
    points: 1430, // 22 ppg
    assists: 260,
    rebounds: 455,
    steals: 78,
    blocks: 52,
    turnovers: 143,
    fgMade: 520,
    fgAttempted: 1100,
    fg3Made: 110,
    fg3Attempted: 320,
    ftMade: 280,
    ftAttempted: 350
  }
];

// ===== TESTS =====

console.log('\n========================================');
console.log('PLAYER VALUATION MODULE - UNIT TESTS');
console.log('========================================\n');

// Test True Shooting Percentage
console.log('--- True Shooting Percentage ---');

const ts1 = calculateTrueShootingPct(1250, 950, 300);
assertApproxEqual(ts1, 0.5787, 0.01, 'TS% for sample stats');

const ts2 = calculateTrueShootingPct(0, 0, 0);
assertEqual(ts2, 0, 'TS% with zero attempts');

const ts3 = calculateTrueShootingPct(100, 80, 20);
assertApproxEqual(ts3, 0.5682, 0.01, 'TS% for 100 pts on 80 FGA, 20 FTA');

// Test Per-36 Scaling
console.log('\n--- Per-36 Scaling ---');

const per36_1 = scaleToPer36(1250, 1700);
assertApproxEqual(per36_1, 26.47, 0.1, 'Points per 36 (1250 in 1700 min)');

const per36_2 = scaleToPer36(300, 1700);
assertApproxEqual(per36_2, 6.35, 0.1, 'Assists per 36 (300 in 1700 min)');

const per36_3 = scaleToPer36(100, 0);
assertEqual(per36_3, 0, 'Per-36 with zero minutes');

// Test Impact Score Breakdown
console.log('\n--- Impact Score Breakdown ---');

const breakdown = calculateImpactScoreBreakdown(sampleSeasonStats);
assertApproxEqual(breakdown.pointsPer36, 26.47, 0.1, 'Breakdown: pointsPer36');
assertApproxEqual(breakdown.assistsPer36, 6.35, 0.1, 'Breakdown: assistsPer36');
assertApproxEqual(breakdown.reboundsPer36, 8.47, 0.1, 'Breakdown: reboundsPer36');
assertTrue(breakdown.rawImpactScore > 0, 'Breakdown: rawImpactScore is positive');
assertTrue(breakdown.rawImpactScore > 10 && breakdown.rawImpactScore < 30, 'Breakdown: rawImpactScore in expected range (10-30)');

// Test Weighted Impact Score
console.log('\n--- Weighted Impact Score ---');

const { weightedScore, seasonBreakdowns } = calculateWeightedImpactScore(multiSeasonStats);
assertTrue(weightedScore > 0, 'Weighted score is positive');
assertEqual(seasonBreakdowns.length, 3, 'Three seasons in breakdown');
assertApproxEqual(seasonBreakdowns[0].weight, 0.6, 0.01, 'First season weight is 0.6');
assertApproxEqual(seasonBreakdowns[1].weight, 0.3, 0.01, 'Second season weight is 0.3');
assertApproxEqual(seasonBreakdowns[2].weight, 0.1, 0.01, 'Third season weight is 0.1');

// Test Age Factor
console.log('\n--- Age Factor ---');

const age26 = calculateAgeFactor(26);
assertEqual(age26, 1.0, 'Age 26 (peak) factor is 1.0');

const age27 = calculateAgeFactor(27);
assertEqual(age27, 1.0, 'Age 27 (peak) factor is 1.0');

const age28 = calculateAgeFactor(28);
assertEqual(age28, 1.0, 'Age 28 (peak) factor is 1.0');

const age24 = calculateAgeFactor(24);
assertApproxEqual(age24, 1.01, 0.001, 'Age 24 has +1% bonus');

const age22 = calculateAgeFactor(22);
assertApproxEqual(age22, 1.02, 0.001, 'Age 22 has +2% bonus');

const age20 = calculateAgeFactor(20);
assertApproxEqual(age20, 1.03, 0.001, 'Age 20 has +3% bonus (within cap)');

const age30 = calculateAgeFactor(30);
assertApproxEqual(age30, 0.98, 0.001, 'Age 30 has -2% penalty');

const age35 = calculateAgeFactor(35);
assertApproxEqual(age35, 0.93, 0.001, 'Age 35 has -7% penalty');

const age40 = calculateAgeFactor(40);
assertApproxEqual(age40, 0.90, 0.001, 'Age 40 capped at -10% penalty');

// Test Fair AAV Calculation
console.log('\n--- Fair AAV Calculation ---');

const aav_median = calculateFairAAV(8.0);
assertApproxEqual(aav_median, 8500000, 100000, 'Median impact score → median salary');

const aav_top = calculateFairAAV(25.0);
assertApproxEqual(aav_top, 55000000, 100000, 'Top impact score → top salary');

const aav_low = calculateFairAAV(3.0);
assertTrue(aav_low >= 1000000, 'Low impact score has floor at min salary');

// Test Stock Index
console.log('\n--- Stock Index Calculation ---');

const surplusValues = [-10000000, -5000000, 0, 5000000, 10000000, 15000000, 20000000];

const { stockIndex: si1, percentileRank: pr1 } = calculateStockIndex(0, surplusValues, 'stable');
assertApproxEqual(pr1, 28.57, 1, 'Zero surplus is ~29th percentile');

const { stockIndex: si2 } = calculateStockIndex(20000000, surplusValues, 'stable');
assertApproxEqual(si2, 85.71, 5, 'Max surplus → high stock index');

const { stockIndex: si3, percentileRank: pr3 } = calculateStockIndex(5000000, surplusValues, 'rising');
assertTrue(si3 > pr3, 'Rising trajectory adds bonus to percentile rank');

const { stockIndex: si4 } = calculateStockIndex(5000000, surplusValues, 'declining');
assertTrue(si4 < 60, 'Declining trajectory subtracts');

// Test Trajectory Determination
console.log('\n--- Trajectory Determination ---');

const risingBreakdown = [
  { season: '2024-25', impactScore: 20 },
  { season: '2023-24', impactScore: 15 }
];
assertEqual(determineTrajectory(risingBreakdown), 'rising', 'Rising trajectory detected');

const decliningBreakdown = [
  { season: '2024-25', impactScore: 12 },
  { season: '2023-24', impactScore: 18 }
];
assertEqual(determineTrajectory(decliningBreakdown), 'declining', 'Declining trajectory detected');

const stableBreakdown = [
  { season: '2024-25', impactScore: 16 },
  { season: '2023-24', impactScore: 15 }
];
assertEqual(determineTrajectory(stableBreakdown), 'stable', 'Stable trajectory detected');

const singleSeason = [{ season: '2024-25', impactScore: 15 }];
assertEqual(determineTrajectory(singleSeason), 'unknown', 'Single season → unknown trajectory');

// Test Full Valuation Computation
console.log('\n--- Full Valuation Computation ---');

const valuation = computePlayerValuation(
  '12345',
  multiSeasonStats,
  '2024-25',
  27 // Peak age
);

assertTrue(valuation.playerId === '12345', 'Valuation has correct playerId');
assertTrue(valuation.season === '2024-25', 'Valuation has correct season');
assertTrue(valuation.playerAge === 27, 'Valuation has correct age');
assertTrue(valuation.ageFactor === 1.0, 'Peak age factor is 1.0');
assertTrue(valuation.adjustedImpactScore > 0, 'Adjusted impact score is positive');
assertTrue(valuation.fairAAV > 1000000, 'Fair AAV above minimum');
assertTrue(valuation.stockIndex >= 0 && valuation.stockIndex <= 100, 'Stock index in 0-100 range');
assertTrue(valuation.explanationBreakdown !== null, 'Explanation breakdown exists');
assertTrue(valuation.explanationBreakdown.recencyWeights.length > 0, 'Has recency weights');

// Test with young player
console.log('\n--- Young Player Bonus ---');

const youngValuation = computePlayerValuation(
  '54321',
  multiSeasonStats,
  '2024-25',
  22 // Young player
);

assertTrue(youngValuation.ageFactor > 1.0, 'Young player has positive age factor');
assertTrue(youngValuation.adjustedImpactScore > valuation.adjustedImpactScore * 1.01,
  'Young player adjusted score higher than peak age (same stats)');

// Test with veteran player
console.log('\n--- Veteran Player Penalty ---');

const veteranValuation = computePlayerValuation(
  '99999',
  multiSeasonStats,
  '2024-25',
  34 // Veteran
);

assertTrue(veteranValuation.ageFactor < 1.0, 'Veteran has negative age factor');
assertTrue(veteranValuation.adjustedImpactScore < valuation.adjustedImpactScore,
  'Veteran adjusted score lower than peak age (same stats)');

// ===== SUMMARY =====

console.log('\n========================================');
console.log('TEST SUMMARY');
console.log('========================================');
console.log(`Total: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log('========================================\n');

if (testsFailed > 0) {
  process.exit(1);
}

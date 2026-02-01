/**
 * Player Valuation Module
 *
 * Computes a hypothetical "stock value" for NBA players using:
 * - Recent NBA performance metrics
 * - Salary/contract data
 * - A transparent valuation model
 *
 * Outputs:
 * - Fair Market AAV (per year $)
 * - Actual AAV (per year $)
 * - Surplus Value (Fair - Actual)
 * - Stock Value Index (0-100) based on percentile of surplus value and trajectory
 */

import * as fs from 'fs';
import * as path from 'path';

// ===== TYPES =====

export interface SeasonStats {
  season: string;
  gamesPlayed: number;
  minutes: number;
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fgMade: number;
  fgAttempted: number;
  fg3Made: number;
  fg3Attempted: number;
  ftMade: number;
  ftAttempted: number;
  age?: number;
}

export interface ContractData {
  playerId: string;
  playerName: string;
  season: string;
  salary: number;
}

export interface ImpactScoreBreakdown {
  pointsPer36: number;
  assistsPer36: number;
  reboundsPer36: number;
  stealsPer36: number;
  blocksPer36: number;
  trueShootingPct: number;
  turnoversPer36: number;

  // Weighted components
  pointsComponent: number;
  assistsComponent: number;
  reboundsComponent: number;
  stealsComponent: number;
  blocksComponent: number;
  tsComponent: number;
  turnoverPenalty: number;

  rawImpactScore: number;
}

export interface ValuationResult {
  playerId: string;
  season: string;
  playerAge: number;

  // Impact scores
  currentSeasonImpactScore: number;
  weightedImpactScore: number;
  ageFactor: number;
  adjustedImpactScore: number;

  // Valuation
  fairAAV: number;
  actualAAV: number | null;
  surplusValue: number | null;
  stockIndex: number;
  trajectory: 'rising' | 'stable' | 'declining' | 'unknown';

  // Breakdown for transparency
  explanationBreakdown: {
    impactScoreWeights: {
      pointsPer36: number;
      assistsPer36: number;
      reboundsPer36: number;
      stealsPer36: number;
      blocksPer36: number;
      trueShootingPct: number;
      turnoverPenalty: number;
    };
    currentSeasonBreakdown: ImpactScoreBreakdown | null;
    recencyWeights: { weight: number; season: string; impactScore: number }[];
    agingAdjustment: {
      age: number;
      peakAgeRange: string;
      adjustmentPercent: number;
    };
    fairAAVCalibration: {
      method: string;
      medianSalary: number;
      topSalary: number;
      impactScoreToAAVSlope: number;
    };
    stockIndexCalculation: {
      surplusValue: number | null;
      percentileRank: number;
      trajectoryBonus: number;
    };
  };
}

// ===== CONSTANTS =====

// Impact score weights
const WEIGHTS = {
  pointsPer36: 0.35,
  assistsPer36: 0.20,
  reboundsPer36: 0.15,
  stealsPer36: 0.10,
  blocksPer36: 0.10,
  trueShootingPct: 0.10,
  turnoverPenalty: 0.05  // Penalty per turnover per 36
};

// Recency weights for 3-year weighted score (most recent first)
const RECENCY_WEIGHTS = [0.6, 0.3, 0.1];

// Aging curve parameters
const PEAK_AGE_MIN = 26;
const PEAK_AGE_MAX = 28;
const YOUNG_BONUS_PER_YEAR = 0.005; // +0.5% per year under 26
const OLD_PENALTY_PER_YEAR = 0.01;  // -1.0% per year over 28
const MAX_AGE_ADJUSTMENT = 0.10;    // Cap at +/- 10%

// Salary calibration anchors (2024-25 values)
const LEAGUE_MEDIAN_SALARY = 8500000;    // ~$8.5M median
const LEAGUE_TOP_SALARY = 55000000;      // ~$55M top salary
const MEDIAN_IMPACT_SCORE = 8.0;         // Expected median impact score
const TOP_IMPACT_SCORE = 25.0;           // Expected top impact score

// ===== CONTRACT DATA LOADER =====

let contractsCache: ContractData[] | null = null;

export function loadContracts(): ContractData[] {
  if (contractsCache) {
    return contractsCache;
  }

  const contractsPath = path.join(__dirname, '..', 'data', 'contracts.csv');

  if (!fs.existsSync(contractsPath)) {
    console.warn('⚠️ Contracts file not found at:', contractsPath);
    return [];
  }

  const content = fs.readFileSync(contractsPath, 'utf-8');
  const lines = content.trim().split('\n');

  // Skip header
  const contracts: ContractData[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const [playerId, playerName, season, salaryStr] = line.split(',');
    contracts.push({
      playerId: playerId.trim(),
      playerName: playerName.trim(),
      season: season.trim(),
      salary: parseInt(salaryStr.trim(), 10)
    });
  }

  contractsCache = contracts;
  console.log(`📋 Loaded ${contracts.length} contract records`);
  return contracts;
}

export function getPlayerContract(playerId: string, season: string): ContractData | null {
  const contracts = loadContracts();
  return contracts.find(c => c.playerId === playerId && c.season === season) || null;
}

export function getAllContractsForSeason(season: string): ContractData[] {
  const contracts = loadContracts();
  return contracts.filter(c => c.season === season);
}

export function clearContractsCache(): void {
  contractsCache = null;
}

// ===== IMPACT SCORE CALCULATION =====

/**
 * Calculate True Shooting Percentage
 * TS% = PTS / (2 * (FGA + 0.44 * FTA))
 */
export function calculateTrueShootingPct(
  points: number,
  fgAttempted: number,
  ftAttempted: number
): number {
  const denominator = 2 * (fgAttempted + 0.44 * ftAttempted);
  if (denominator === 0) return 0;
  return points / denominator;
}

/**
 * Scale a stat to per-36-minute basis
 */
export function scaleToPer36(stat: number, minutes: number): number {
  if (minutes === 0) return 0;
  return (stat / minutes) * 36;
}

/**
 * Calculate Impact Score breakdown for a single season
 */
export function calculateImpactScoreBreakdown(stats: SeasonStats): ImpactScoreBreakdown {
  const totalMinutes = stats.minutes;

  // Per-36 stats
  const pointsPer36 = scaleToPer36(stats.points, totalMinutes);
  const assistsPer36 = scaleToPer36(stats.assists, totalMinutes);
  const reboundsPer36 = scaleToPer36(stats.rebounds, totalMinutes);
  const stealsPer36 = scaleToPer36(stats.steals, totalMinutes);
  const blocksPer36 = scaleToPer36(stats.blocks, totalMinutes);
  const turnoversPer36 = scaleToPer36(stats.turnovers, totalMinutes);

  // True shooting percentage (scale to 0-100 range for weighting)
  const trueShootingPct = calculateTrueShootingPct(
    stats.points,
    stats.fgAttempted,
    stats.ftAttempted
  );
  const tsScaled = trueShootingPct * 100; // e.g., 0.58 -> 58

  // Weighted components
  const pointsComponent = pointsPer36 * WEIGHTS.pointsPer36;
  const assistsComponent = assistsPer36 * WEIGHTS.assistsPer36;
  const reboundsComponent = reboundsPer36 * WEIGHTS.reboundsPer36;
  const stealsComponent = stealsPer36 * WEIGHTS.stealsPer36;
  const blocksComponent = blocksPer36 * WEIGHTS.blocksPer36;
  const tsComponent = tsScaled * WEIGHTS.trueShootingPct;
  const turnoverPenalty = turnoversPer36 * WEIGHTS.turnoverPenalty;

  const rawImpactScore =
    pointsComponent +
    assistsComponent +
    reboundsComponent +
    stealsComponent +
    blocksComponent +
    tsComponent -
    turnoverPenalty;

  return {
    pointsPer36,
    assistsPer36,
    reboundsPer36,
    stealsPer36,
    blocksPer36,
    trueShootingPct,
    turnoversPer36,

    pointsComponent,
    assistsComponent,
    reboundsComponent,
    stealsComponent,
    blocksComponent,
    tsComponent,
    turnoverPenalty,

    rawImpactScore
  };
}

/**
 * Calculate weighted Impact Score across multiple seasons
 */
export function calculateWeightedImpactScore(
  seasonStats: SeasonStats[]
): { weightedScore: number; seasonBreakdowns: { season: string; weight: number; impactScore: number }[] } {
  if (seasonStats.length === 0) {
    return { weightedScore: 0, seasonBreakdowns: [] };
  }

  // Sort by season (most recent first)
  const sortedStats = [...seasonStats].sort((a, b) => b.season.localeCompare(a.season));

  // Take up to 3 most recent seasons
  const recentStats = sortedStats.slice(0, 3);

  let weightedSum = 0;
  let totalWeight = 0;
  const seasonBreakdowns: { season: string; weight: number; impactScore: number }[] = [];

  recentStats.forEach((stats, index) => {
    const breakdown = calculateImpactScoreBreakdown(stats);
    const weight = RECENCY_WEIGHTS[index] || 0;

    // Only include seasons with meaningful minutes
    if (stats.gamesPlayed >= 10 && stats.minutes >= 100) {
      weightedSum += breakdown.rawImpactScore * weight;
      totalWeight += weight;

      seasonBreakdowns.push({
        season: stats.season,
        weight,
        impactScore: breakdown.rawImpactScore
      });
    }
  });

  // Normalize by total weight used
  const weightedScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  return { weightedScore, seasonBreakdowns };
}

// ===== AGING ADJUSTMENT =====

/**
 * Calculate age-based adjustment factor
 * Peak age: 26-28 (factor = 1.0)
 * Under 26: +0.5% per year (potential upside)
 * Over 28: -1.0% per year (decline risk)
 * Capped at +/- 10%
 */
export function calculateAgeFactor(age: number): number {
  if (age >= PEAK_AGE_MIN && age <= PEAK_AGE_MAX) {
    return 1.0;
  }

  if (age < PEAK_AGE_MIN) {
    const yearsUnder = PEAK_AGE_MIN - age;
    const bonus = Math.min(yearsUnder * YOUNG_BONUS_PER_YEAR, MAX_AGE_ADJUSTMENT);
    return 1.0 + bonus;
  }

  // age > PEAK_AGE_MAX
  const yearsOver = age - PEAK_AGE_MAX;
  const penalty = Math.min(yearsOver * OLD_PENALTY_PER_YEAR, MAX_AGE_ADJUSTMENT);
  return 1.0 - penalty;
}

// ===== FAIR AAV CALCULATION =====

/**
 * Convert Impact Score to Fair Market AAV using linear calibration
 *
 * Linear model: AAV = m * ImpactScore + b
 * Calibrated using:
 * - Median salary ($8.5M) at median impact score (8.0)
 * - Top salary ($55M) at top impact score (25.0)
 */
export function calculateFairAAV(adjustedImpactScore: number): number {
  // Linear interpolation: solve for slope and intercept
  // AAV = slope * impactScore + intercept
  const slope = (LEAGUE_TOP_SALARY - LEAGUE_MEDIAN_SALARY) / (TOP_IMPACT_SCORE - MEDIAN_IMPACT_SCORE);
  const intercept = LEAGUE_MEDIAN_SALARY - slope * MEDIAN_IMPACT_SCORE;

  const fairAAV = slope * adjustedImpactScore + intercept;

  // Floor at minimum salary, cap at max
  const MIN_SALARY = 1000000; // $1M minimum
  return Math.max(MIN_SALARY, Math.min(fairAAV, LEAGUE_TOP_SALARY * 1.1));
}

// ===== STOCK INDEX CALCULATION =====

/**
 * Calculate Stock Index (0-100) based on surplus value percentile
 */
export function calculateStockIndex(
  surplusValue: number | null,
  allSurplusValues: number[],
  trajectory: 'rising' | 'stable' | 'declining' | 'unknown'
): { stockIndex: number; percentileRank: number; trajectoryBonus: number } {
  // If no salary data, base on impact score alone
  if (surplusValue === null) {
    return { stockIndex: 50, percentileRank: 50, trajectoryBonus: 0 };
  }

  // Calculate percentile rank
  const sortedValues = [...allSurplusValues].sort((a, b) => a - b);
  let rank = 0;
  for (const val of sortedValues) {
    if (val < surplusValue) rank++;
    else break;
  }

  const percentileRank = sortedValues.length > 0
    ? (rank / sortedValues.length) * 100
    : 50;

  // Trajectory bonus: +5 for rising, 0 for stable, -5 for declining
  let trajectoryBonus = 0;
  if (trajectory === 'rising') trajectoryBonus = 5;
  else if (trajectory === 'declining') trajectoryBonus = -5;

  const stockIndex = Math.max(0, Math.min(100, percentileRank + trajectoryBonus));

  return { stockIndex, percentileRank, trajectoryBonus };
}

/**
 * Determine trajectory based on comparing recent seasons
 */
export function determineTrajectory(
  seasonBreakdowns: { season: string; impactScore: number }[]
): 'rising' | 'stable' | 'declining' | 'unknown' {
  if (seasonBreakdowns.length < 2) {
    return 'unknown';
  }

  // Compare most recent to previous
  const recent = seasonBreakdowns[0].impactScore;
  const previous = seasonBreakdowns[1].impactScore;

  const changePercent = ((recent - previous) / previous) * 100;

  if (changePercent > 10) return 'rising';
  if (changePercent < -10) return 'declining';
  return 'stable';
}

// ===== MAIN VALUATION FUNCTION =====

/**
 * Compute full player valuation
 */
export function computePlayerValuation(
  playerId: string,
  seasonStats: SeasonStats[],
  currentSeason: string,
  playerAge: number,
  allPlayersSurplusValues?: number[]
): ValuationResult {
  // Get current season stats
  const currentSeasonStats = seasonStats.find(s => s.season === currentSeason);
  const currentBreakdown = currentSeasonStats
    ? calculateImpactScoreBreakdown(currentSeasonStats)
    : null;

  const currentSeasonImpactScore = currentBreakdown?.rawImpactScore || 0;

  // Calculate weighted impact score
  const { weightedScore, seasonBreakdowns } = calculateWeightedImpactScore(seasonStats);

  // Apply age adjustment
  const ageFactor = calculateAgeFactor(playerAge);
  const adjustedImpactScore = weightedScore * ageFactor;

  // Calculate Fair AAV
  const fairAAV = calculateFairAAV(adjustedImpactScore);

  // Get actual contract
  const contract = getPlayerContract(playerId, currentSeason);
  const actualAAV = contract?.salary || null;

  // Calculate surplus value
  const surplusValue = actualAAV !== null ? fairAAV - actualAAV : null;

  // Determine trajectory
  const trajectory = determineTrajectory(seasonBreakdowns);

  // Calculate stock index
  const surplusForIndex = allPlayersSurplusValues || (surplusValue !== null ? [surplusValue] : []);
  const { stockIndex, percentileRank, trajectoryBonus } = calculateStockIndex(
    surplusValue,
    surplusForIndex,
    trajectory
  );

  // Calculate slope for explanation
  const aavSlope = (LEAGUE_TOP_SALARY - LEAGUE_MEDIAN_SALARY) / (TOP_IMPACT_SCORE - MEDIAN_IMPACT_SCORE);

  return {
    playerId,
    season: currentSeason,
    playerAge,

    currentSeasonImpactScore,
    weightedImpactScore: weightedScore,
    ageFactor,
    adjustedImpactScore,

    fairAAV,
    actualAAV,
    surplusValue,
    stockIndex,
    trajectory,

    explanationBreakdown: {
      impactScoreWeights: {
        pointsPer36: WEIGHTS.pointsPer36,
        assistsPer36: WEIGHTS.assistsPer36,
        reboundsPer36: WEIGHTS.reboundsPer36,
        stealsPer36: WEIGHTS.stealsPer36,
        blocksPer36: WEIGHTS.blocksPer36,
        trueShootingPct: WEIGHTS.trueShootingPct,
        turnoverPenalty: WEIGHTS.turnoverPenalty
      },
      currentSeasonBreakdown: currentBreakdown,
      recencyWeights: seasonBreakdowns,
      agingAdjustment: {
        age: playerAge,
        peakAgeRange: `${PEAK_AGE_MIN}-${PEAK_AGE_MAX}`,
        adjustmentPercent: (ageFactor - 1) * 100
      },
      fairAAVCalibration: {
        method: 'linear_interpolation',
        medianSalary: LEAGUE_MEDIAN_SALARY,
        topSalary: LEAGUE_TOP_SALARY,
        impactScoreToAAVSlope: aavSlope
      },
      stockIndexCalculation: {
        surplusValue,
        percentileRank,
        trajectoryBonus
      }
    }
  };
}

// ===== UTILITY FUNCTIONS =====

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Get trajectory emoji/indicator
 */
export function getTrajectoryIndicator(trajectory: 'rising' | 'stable' | 'declining' | 'unknown'): string {
  switch (trajectory) {
    case 'rising': return '📈';
    case 'declining': return '📉';
    case 'stable': return '➡️';
    default: return '❓';
  }
}

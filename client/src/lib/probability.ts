import type { PlayerProbability, MergedPlayerStats, PlayerFormData } from "@shared/schema";

const clamp = (value: number, min: number = 0, max: number = 1): number => {
  return Math.max(min, Math.min(max, value));
};

export interface ProbabilityFactors {
  goalsPer90: number;
  assistsPer90: number;
  goalsLastN: number;
  assistsLastN: number;
  n: number;
  teamAttackFactor: number;
  opponentDefenseWeakness: number;
  isHome: boolean;
}

export const calculateScoreProbability = (factors: ProbabilityFactors): number => {
  const { goalsPer90, goalsLastN, n, teamAttackFactor, opponentDefenseWeakness, isHome } = factors;
  
  let prob = 
    0.4 * goalsPer90 + 
    0.3 * (goalsLastN / n) + 
    0.2 * teamAttackFactor + 
    0.1 * opponentDefenseWeakness;
  
  if (isHome) {
    prob += 0.03;
  }
  
  return clamp(prob);
};

export const calculateAssistProbability = (factors: ProbabilityFactors): number => {
  const { assistsPer90, assistsLastN, n, teamAttackFactor, isHome } = factors;
  
  let prob = 
    0.5 * assistsPer90 + 
    0.3 * (assistsLastN / n) + 
    0.2 * teamAttackFactor;
  
  if (isHome) {
    prob += 0.03;
  }
  
  return clamp(prob);
};

export const hassufficientData = (minutes: number, matches: number): boolean => {
  return minutes >= 270 && matches >= 3;
};

export const calculatePlayerProbability = (
  playerStats: MergedPlayerStats,
  formData: PlayerFormData | null,
  teamAttackFactor: number = 0.5,
  opponentDefenseWeakness: number = 0.5,
  isHome: boolean = false,
  n: number = 5
): PlayerProbability => {
  const dataQuality = hassufficientData(playerStats.minutes, playerStats.matches) 
    ? 'sufficient' 
    : 'insufficient';

  if (dataQuality === 'insufficient') {
    return {
      playerId: playerStats.playerId,
      playerName: playerStats.playerName,
      playerPhoto: playerStats.playerPhoto,
      teamName: playerStats.teamName,
      scoreProb: 0,
      assistProb: 0,
      dataQuality,
    };
  }

  const factors: ProbabilityFactors = {
    goalsPer90: playerStats.goalsPer90,
    assistsPer90: playerStats.assistsPer90,
    goalsLastN: formData?.goalsLastN ?? playerStats.goals / Math.max(1, playerStats.matches) * n,
    assistsLastN: formData?.assistsLastN ?? playerStats.assists / Math.max(1, playerStats.matches) * n,
    n,
    teamAttackFactor,
    opponentDefenseWeakness,
    isHome,
  };

  const scoreProb = calculateScoreProbability(factors);
  const assistProb = calculateAssistProbability(factors);

  return {
    playerId: playerStats.playerId,
    playerName: playerStats.playerName,
    playerPhoto: playerStats.playerPhoto,
    teamName: playerStats.teamName,
    scoreProb,
    assistProb,
    dataQuality,
    factors: {
      goalsPer90: factors.goalsPer90,
      assistsPer90: factors.assistsPer90,
      goalsLastN: factors.goalsLastN,
      assistsLastN: factors.assistsLastN,
      teamAttackFactor: factors.teamAttackFactor,
      opponentDefenseWeakness: factors.opponentDefenseWeakness,
      homeBoost: isHome ? 0.03 : 0,
    },
  };
};

export const formatProbability = (prob: number): string => {
  return `${Math.round(prob * 100)}%`;
};

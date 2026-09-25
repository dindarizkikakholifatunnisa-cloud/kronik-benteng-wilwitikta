import { SavedCheckpointData, PlayerStats } from '../types';

const STORAGE_KEY = 'benteng_wilwatikta_checkpoint_save';

export class CheckpointManager {
  // Save checkpoint to localStorage
  public static saveCheckpoint(data: SavedCheckpointData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  // Load checkpoint from localStorage
  public static loadCheckpoint(): SavedCheckpointData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SavedCheckpointData;
      if (parsed && parsed.checkpointId && typeof parsed.stageId === 'number') {
        return parsed;
      }
    } catch {
      // Parse error fallback
    }
    return null;
  }

  // Clear saved checkpoint
  public static clearCheckpoint(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  // Upgrade player stats using Wilwatikta gold coins
  public static calculateUpgradeCost(statType: 'maxHp' | 'attackPower' | 'maxEnergy' | 'defense', currentLevel: number): number {
    const baseCosts = {
      maxHp: 30,
      attackPower: 45,
      maxEnergy: 35,
      defense: 40,
    };
    return Math.floor(baseCosts[statType] * Math.pow(1.35, currentLevel));
  }

  // Default initial stats for Arya Sena
  public static getDefaultStats(): PlayerStats {
    return {
      maxHp: 120,
      hp: 120,
      maxStamina: 100,
      stamina: 100,
      maxLanternFuel: 100,
      lanternFuel: 100,
      maxEnergy: 80,
      energy: 80,
      attackPower: 24,
      rangedPower: 28,
      defense: 8,
      speed: 4.8,
      coins: 0,
      knowledgeCoins: 0,
    };
  }
}

export type Direction = 'left' | 'right';

export type PlayerState = 
  | 'idle' 
  | 'run' 
  | 'jump' 
  | 'fall' 
  | 'attack1' 
  | 'attack2' 
  | 'attack3' 
  | 'ranged' 
  | 'block' 
  | 'dash' 
  | 'hurt' 
  | 'dead';

export interface PlayerStats {
  maxHp: number;
  hp: number;
  maxStamina: number;
  stamina: number;
  maxLanternFuel: number; // 0 - 100%
  lanternFuel: number;
  maxEnergy: number;
  energy: number;
  attackPower: number;
  rangedPower: number;
  defense: number;
  speed: number;
  coins: number;
  knowledgeCoins: number; // 10 koin per kuis sejarah yang dipecahkan
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  direction: Direction;
  state: PlayerState;
  isGrounded: boolean;
  canDoubleJump: boolean;
  isDashing: boolean;
  dashTimer: number;
  invulnerableTimer: number;
  attackTimer: number;
  attackCombo: number;
  comboResetTimer: number;
  blockActive: boolean;
  exhaustionTimer: number; // Penalty when stamina is depleted
  stats: PlayerStats;
}

export interface Checkpoint {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  activated: boolean;
  levelId: number;
  description: string;
  resiAdvice?: string; // Wejangan Resi Vidyadhara
}

export type EnemyType = 
  | 'prajurit_pedang' 
  | 'pemanah_gelap' 
  | 'pasukan_tombak' 
  | 'senopati_boss'
  | 'prajurit_bayangan'
  | 'pemanah_bayangan'
  | 'tombak_bayangan'
  | 'avatar_angkara_dahana';

export interface Enemy {
  id: string;
  type: EnemyType;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  damage: number;
  direction: Direction;
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'hurt' | 'dead';
  patrolLeft: number;
  patrolRight: number;
  detectRadius: number;
  attackRadius: number;
  attackCooldown: number;
  attackTimer: number;
  hurtTimer: number;
  coinsValue: number;
  isBoss?: boolean;
  specialSkillTimer?: number;
}

export interface HistoryQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface HistoricalArtifact {
  id: string;
  name: string;
  floor: number;
  x: number;
  y: number;
  width: number;
  height: number;
  era: string;
  historicalLore: string;
  imageType: 'prasasti' | 'lontar' | 'keris' | 'panji' | 'arca' | 'genta' | 'surya';
  quiz: HistoryQuiz;
  solved: boolean;
}

export interface CastleBarricade {
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
}

export type DeathReason = 
  | 'health_depleted' 
  | 'stamina_exhaustion' 
  | 'lantern_blackout' 
  | 'lantern_extinguished' 
  | 'barricade_breached';

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  isPlayer: boolean;
  color: string;
  life: number;
  maxLife: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'stone' | 'brick' | 'wood' | 'altar' | 'spike';
  isHazard?: boolean;
}

export interface ItemDrop {
  id: string;
  type: 'coin' | 'health_herbs' | 'prana_dew' | 'lantern_oil' | 'stamina_potion' | 'pusaka_relic';
  x: number;
  y: number;
  vy: number;
  value: number;
  collected: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'spark' | 'smoke' | 'flower' | 'shadow';
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
  fontSize?: number;
}

export interface DecorativeProp {
  x: number;
  y: number;
  type: 'torch' | 'candi_gate' | 'majapahit_banner' | 'stone_statue' | 'tree' | 'pillar' | 'altar' | 'barricade_prop' | 'resi_sanctuary';
  width: number;
  height: number;
}

export interface StageData {
  id: number;
  floorNumber: number; // 1 to 5
  name: string;
  subtitle: string;
  lore: string;
  worldWidth: number;
  worldHeight: number;
  platforms: Platform[];
  checkpoints: Checkpoint[];
  enemies: Enemy[];
  props: DecorativeProp[];
  startPosition: { x: number; y: number };
  artifacts: HistoricalArtifact[];
  barricade?: CastleBarricade;
  requiredKnowledgeCoinsToAdvance?: number;
  boss?: Enemy;
}

export interface SavedCheckpointData {
  stageId: number;
  floorNumber?: number;
  checkpointId: string;
  checkpointName: string;
  playerStats: PlayerStats;
  solvedArtifactIds?: string[];
  timestamp: number;
  score: number;
}

import React, { useState, useEffect, useRef } from 'react';
import { Player, StageData, Checkpoint, PlayerStats, SavedCheckpointData, HistoricalArtifact, CastleBarricade, DeathReason } from './types';
import { STAGES_DATA } from './data/stages';
import { CheckpointManager } from './utils/checkpointManager';
import { sound } from './utils/audio';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { CheckpointModal } from './components/CheckpointModal';
import { ChronicleModal } from './components/ChronicleModal';
import { VirtualControls } from './components/VirtualControls';
import { ArtifactQuizModal } from './components/ArtifactQuizModal';
import { ResiAdvisorCard } from './components/ResiAdvisorCard';
import { Play, RotateCcw, MapPin, Sparkles, BookOpen, Volume2, VolumeX, Shield, Award, ChevronRight, Swords, HelpCircle, Flame, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function App() {
  // Screen views: 'menu' | 'playing' | 'gameover' | 'victory' | 'stage_select' | 'help'
  const [screen, setScreen] = useState<'menu' | 'playing' | 'gameover' | 'victory' | 'stage_select' | 'help'>('menu');
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [score, setScore] = useState<number>(0);

  // Saved Checkpoint state
  const [savedCheckpoint, setSavedCheckpoint] = useState<SavedCheckpointData | null>(null);

  // Active stage, checkpoints, and survival elements
  const [stage, setStage] = useState<StageData>(STAGES_DATA[0]);
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);
  const [inspectingCheckpoint, setInspectingCheckpoint] = useState<Checkpoint | null>(null);
  const [showChronicle, setShowChronicle] = useState<boolean>(false);

  // Barricade, Artifacts & Advisor state
  const [barricade, setBarricade] = useState<CastleBarricade | undefined>(STAGES_DATA[0].barricade);
  const [solvedArtifactIds, setSolvedArtifactIds] = useState<string[]>([]);
  const [activeArtifactQuiz, setActiveArtifactQuiz] = useState<HistoricalArtifact | null>(null);
  const [nearArtifact, setNearArtifact] = useState<HistoricalArtifact | null>(null);
  const [deathReason, setDeathReason] = useState<DeathReason>('health_depleted');
  const [isResiAdviceOpen, setIsResiAdviceOpen] = useState<boolean>(false);

  // Initial player state
  const [player, setPlayer] = useState<Player>({
    x: STAGES_DATA[0].startPosition.x,
    y: STAGES_DATA[0].startPosition.y,
    vx: 0,
    vy: 0,
    width: 38,
    height: 60,
    direction: 'right',
    state: 'idle',
    isGrounded: true,
    canDoubleJump: true,
    isDashing: false,
    dashTimer: 0,
    invulnerableTimer: 0,
    attackTimer: 0,
    attackCombo: 0,
    comboResetTimer: 0,
    blockActive: false,
    exhaustionTimer: 0,
    stats: CheckpointManager.getDefaultStats(),
  });

  // Mobile touch inputs
  const virtualInputRef = useRef({
    left: false,
    right: false,
    jump: false,
    attack: false,
    shoot: false,
    block: false,
    dash: false,
    interact: false,
  });

  // Load saved checkpoint from storage on initial mount
  useEffect(() => {
    const saved = CheckpointManager.loadCheckpoint();
    if (saved) {
      setSavedCheckpoint(saved);
    }
  }, []);

  // Sync sound settings with audio manager
  const handleToggleSound = () => {
    const newState = sound.toggleSound();
    setSoundEnabled(newState);
  };

  // Start fresh new game from stage 1
  const startNewGame = (stageIdx = 0) => {
    const targetStage = STAGES_DATA[stageIdx];
    setCurrentStageIndex(stageIdx);
    setStage(targetStage);
    setBarricade(targetStage.barricade ? { ...targetStage.barricade } : undefined);
    const initialCp = targetStage.checkpoints[0];
    setActiveCheckpoint(initialCp);

    const defaultStats = CheckpointManager.getDefaultStats();
    setPlayer({
      x: targetStage.startPosition.x,
      y: targetStage.startPosition.y,
      vx: 0,
      vy: 0,
      width: 38,
      height: 60,
      direction: 'right',
      state: 'idle',
      isGrounded: true,
      canDoubleJump: true,
      isDashing: false,
      dashTimer: 0,
      invulnerableTimer: 0,
      attackTimer: 0,
      attackCombo: 0,
      comboResetTimer: 0,
      blockActive: false,
      exhaustionTimer: 0,
      stats: defaultStats,
    });

    setIsPaused(false);
    setScreen('playing');

    // Auto-record the first checkpoint
    if (initialCp) {
      const saveState: SavedCheckpointData = {
        stageId: targetStage.id,
        floorNumber: targetStage.floorNumber,
        checkpointId: initialCp.id,
        checkpointName: initialCp.name,
        playerStats: defaultStats,
        solvedArtifactIds: [],
        timestamp: Date.now(),
        score: 0,
      };
      CheckpointManager.saveCheckpoint(saveState);
      setSavedCheckpoint(saveState);
    }
  };

  // Continue game from saved checkpoint
  const continueFromCheckpoint = () => {
    if (!savedCheckpoint) return;
    const stageIdx = Math.max(0, STAGES_DATA.findIndex((s) => s.id === savedCheckpoint.stageId));
    const targetStage = STAGES_DATA[stageIdx] || STAGES_DATA[0];
    const cp = targetStage.checkpoints.find((c) => c.id === savedCheckpoint.checkpointId) || targetStage.checkpoints[0];

    setCurrentStageIndex(stageIdx);
    setStage(targetStage);
    setBarricade(targetStage.barricade ? { ...targetStage.barricade } : undefined);
    setActiveCheckpoint(cp);
    setScore(savedCheckpoint.score || 0);

    const restoredStats: PlayerStats = {
      ...savedCheckpoint.playerStats,
      hp: savedCheckpoint.playerStats.maxHp, // fully restore HP
      energy: savedCheckpoint.playerStats.maxEnergy, // fully restore prana
      stamina: savedCheckpoint.playerStats.maxStamina,
      lanternFuel: savedCheckpoint.playerStats.maxLanternFuel,
    };

    setPlayer({
      x: cp.x + 10,
      y: cp.y,
      vx: 0,
      vy: 0,
      width: 38,
      height: 60,
      direction: 'right',
      state: 'idle',
      isGrounded: true,
      canDoubleJump: true,
      isDashing: false,
      dashTimer: 0,
      invulnerableTimer: 0.5,
      attackTimer: 0,
      attackCombo: 0,
      comboResetTimer: 0,
      blockActive: false,
      exhaustionTimer: 0,
      stats: restoredStats,
    });

    setIsPaused(false);
    setScreen('playing');
    sound.playCheckpoint();
  };

  // Respawn at last activated checkpoint
  const respawnAtCheckpoint = () => {
    const cp = activeCheckpoint || stage.checkpoints[0];
    if (stage.barricade) {
      setBarricade({ ...stage.barricade });
    }
    setPlayer((prev) => ({
      ...prev,
      x: cp.x + 10,
      y: cp.y,
      vx: 0,
      vy: 0,
      direction: 'right',
      state: 'idle',
      isGrounded: true,
      canDoubleJump: true,
      isDashing: false,
      dashTimer: 0,
      invulnerableTimer: 1.2,
      attackTimer: 0,
      blockActive: false,
      stats: {
        ...prev.stats,
        hp: prev.stats.maxHp,
        energy: prev.stats.maxEnergy,
        stamina: prev.stats.maxStamina,
        lanternFuel: prev.stats.maxLanternFuel,
      },
    }));

    setIsPaused(false);
    setScreen('playing');
    sound.playCheckpoint();
  };

  // Player death event handler with survival horror cause
  const handlePlayerDeath = (reason?: DeathReason) => {
    setDeathReason(reason || 'health_depleted');
    setScreen('gameover');
  };

  // Historical Quiz solved handler (+10 Knowledge Coins)
  const handleSolveQuiz = (artifactId: string, coinsAwarded: number) => {
    setSolvedArtifactIds((prev) => (prev.includes(artifactId) ? prev : [...prev, artifactId]));
    setScore((prev) => prev + coinsAwarded);
    setPlayer((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        coins: prev.stats.coins + coinsAwarded,
        knowledgeCoins: (prev.stats.knowledgeCoins || 0) + coinsAwarded,
      },
    }));
  };

  // When a new checkpoint is reached
  const handleActivateCheckpoint = (checkpoint: Checkpoint) => {
    setActiveCheckpoint(checkpoint);
    const saveState: SavedCheckpointData = {
      stageId: stage.id,
      floorNumber: stage.floorNumber,
      checkpointId: checkpoint.id,
      checkpointName: checkpoint.name,
      playerStats: player.stats,
      solvedArtifactIds,
      timestamp: Date.now(),
      score,
    };
    CheckpointManager.saveCheckpoint(saveState);
    setSavedCheckpoint(saveState);
  };

  // Upgrades purchased at a checkpoint sanctuary
  const handleUpgradeStat = (statType: 'maxHp' | 'attackPower' | 'maxEnergy' | 'defense', cost: number) => {
    if (player.stats.coins < cost) return;

    sound.playHeal();
    setPlayer((prev) => {
      const newStats = { ...prev.stats, coins: prev.stats.coins - cost };
      if (statType === 'maxHp') {
        newStats.maxHp += 25;
        newStats.hp = newStats.maxHp;
      } else if (statType === 'attackPower') {
        newStats.attackPower += 6;
      } else if (statType === 'maxEnergy') {
        newStats.maxEnergy += 20;
        newStats.energy = newStats.maxEnergy;
      } else if (statType === 'defense') {
        newStats.defense += 3;
      }

      // Update checkpoint storage with new upgraded stats
      if (activeCheckpoint) {
        CheckpointManager.saveCheckpoint({
          stageId: stage.id,
          floorNumber: stage.floorNumber,
          checkpointId: activeCheckpoint.id,
          checkpointName: activeCheckpoint.name,
          playerStats: newStats,
          solvedArtifactIds,
          timestamp: Date.now(),
          score,
        });
      }

      return { ...prev, stats: newStats };
    });
  };

  // Stage clear handler
  const handleStageClear = () => {
    setScreen('victory');
  };

  const handleNextStage = () => {
    const nextIdx = currentStageIndex + 1;
    if (nextIdx < STAGES_DATA.length) {
      const nextStageData = STAGES_DATA[nextIdx];
      setCurrentStageIndex(nextIdx);
      setStage(nextStageData);

      // Carry over player upgrades, coins, and knowledge coins while restoring HP and supplies
      setPlayer((prev) => ({
        ...prev,
        x: nextStageData.startPosition.x,
        y: nextStageData.startPosition.y,
        vx: 0,
        vy: 0,
        state: 'idle',
        direction: 'right',
        invulnerableTimer: 0,
        attackTimer: 0,
        stats: {
          ...prev.stats,
          hp: prev.stats.maxHp,
          stamina: prev.stats.maxStamina,
          energy: prev.stats.maxEnergy,
          lanternFuel: prev.stats.maxLanternFuel,
        },
      }));

      const firstCp = nextStageData.checkpoints[0];
      setActiveCheckpoint(firstCp);
      CheckpointManager.saveCheckpoint({
        stageId: nextStageData.id,
        floorNumber: nextStageData.floorNumber,
        checkpointId: firstCp.id,
        checkpointName: firstCp.name,
        playerStats: {
          ...player.stats,
          hp: player.stats.maxHp,
          stamina: player.stats.maxStamina,
          energy: player.stats.maxEnergy,
          lanternFuel: player.stats.maxLanternFuel,
        },
        solvedArtifactIds,
        timestamp: Date.now(),
        score,
      });

      if (nextStageData.barricade) {
        setBarricade(JSON.parse(JSON.stringify(nextStageData.barricade)));
      } else {
        setBarricade(undefined);
      }

      setScreen('playing');
    } else {
      setScreen('menu');
    }
  };

  // Determine if player is near any checkpoint
  const nearCheckpoint = stage.checkpoints.find(
    (cp) => Math.hypot(player.x - cp.x, player.y - cp.y) < 95
  ) || null;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-stone-950 font-sans select-none">
      {/* 1. MAIN MENU SCREEN */}
      {screen === 'menu' && (
        <div id="main-menu" className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-gradient-to-b from-stone-950 via-stone-900 to-amber-950/80">
          {/* Subtle background glow */}
          <div className="absolute w-[600px] h-[600px] rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

          <div className="relative w-full max-w-xl bg-stone-900/90 border-2 border-amber-700/70 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
            {/* Surya Majapahit 8-Pointed Emblem */}
            <div className="relative w-20 h-20 mb-3 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-md animate-pulse" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 flex items-center justify-center shadow-lg border border-amber-300">
                <Sparkles className="w-8 h-8 text-stone-950" />
              </div>
            </div>

            {/* Title & Tagline */}
            <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-amber-100 tracking-wider drop-shadow-md">
              Benteng Kronik Wilwatikta
            </h1>
            <p className="text-xs md:text-sm text-amber-300/90 font-medium tracking-wide mt-1 max-w-md">
              Kisah Perjuangan Ksatria Bhayangkara Mempertahankan Takhta Majapahit dengan Sistem Checkpoint Suci
            </p>

            {/* Checkpoint highlight banner if available */}
            {savedCheckpoint && (
              <div className="w-full mt-4 bg-amber-950/70 border border-amber-600/60 rounded-xl p-3 flex items-center justify-between text-left">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <MapPin className="w-5 h-5 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-300/80 font-bold uppercase tracking-wider block">
                      Checkpoint Tersimpan
                    </span>
                    <span className="text-xs md:text-sm font-semibold text-amber-100 font-serif">
                      {savedCheckpoint.checkpointName}
                    </span>
                  </div>
                </div>
                <button
                  id="btn-resume-checkpoint-direct"
                  onClick={continueFromCheckpoint}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <span>Lanjutkan</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Menu Buttons */}
            <div className="w-full mt-6 space-y-2.5">
              {savedCheckpoint && (
                <button
                  id="btn-continue-game"
                  onClick={continueFromCheckpoint}
                  className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold rounded-2xl shadow-xl border-2 border-amber-300 flex items-center justify-center gap-2 text-sm md:text-base cursor-pointer transition-all active:scale-98"
                >
                  <MapPin className="w-5 h-5 text-stone-950" />
                  <span>Lanjutkan dari Checkpoint</span>
                </button>
              )}

              <button
                id="btn-new-game"
                onClick={() => startNewGame(0)}
                className="w-full py-3 px-5 bg-stone-800/90 hover:bg-stone-700 border border-amber-700/60 text-amber-200 font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 text-sm md:text-base cursor-pointer transition-all active:scale-98"
              >
                <Play className="w-5 h-5 text-amber-400" />
                <span>Mulai Babak Baru (Bab I)</span>
              </button>

              <button
                id="btn-select-stage"
                onClick={() => setScreen('stage_select')}
                className="w-full py-2.5 px-5 bg-stone-900/80 hover:bg-stone-800 border border-stone-700 text-stone-300 font-semibold rounded-2xl shadow-sm flex items-center justify-center gap-2 text-xs md:text-sm cursor-pointer transition-all"
              >
                <Swords className="w-4 h-4 text-amber-400" />
                <span>Pilih Babak (Chapter)</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  id="btn-open-chronicle-menu"
                  onClick={() => setShowChronicle(true)}
                  className="py-2 px-3 bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-amber-300 text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Kronik Sejarah</span>
                </button>

                <button
                  id="btn-open-help"
                  onClick={() => setScreen('help')}
                  className="py-2 px-3 bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-amber-300 text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Panduan Checkpoint</span>
                </button>
              </div>
            </div>

            {/* Sound toggle at menu bottom */}
            <div className="mt-6 flex items-center justify-between w-full border-t border-stone-800/80 pt-3 text-[11px] text-stone-500">
              <span>Wilwatikta Saka 1215</span>
              <button
                id="btn-toggle-sound-menu"
                onClick={handleToggleSound}
                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{soundEnabled ? 'Suara Aktif' : 'Suara Mati'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. STAGE SELECTION SCREEN */}
      {screen === 'stage_select' && (
        <div id="stage-select-screen" className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-stone-950/95 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-stone-900 border-2 border-amber-700/80 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-4">
            <div className="text-center border-b border-stone-800 pb-3">
              <h2 className="font-serif text-2xl font-bold text-amber-100">
                Pilih Babak Benteng Wilwatikta
              </h2>
              <p className="text-xs text-stone-400">
                Tiap babak memiliki 3 hingga 4 checkpoint prasasti pertahanan
              </p>
            </div>

            <div className="space-y-3">
              {STAGES_DATA.map((stg, idx) => (
                <div
                  key={stg.id}
                  onClick={() => startNewGame(idx)}
                  className="bg-stone-950/70 hover:bg-stone-800/80 border border-stone-800 hover:border-amber-600 rounded-2xl p-4 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-serif font-bold text-amber-400">
                        {stg.name}
                      </span>
                      <span className="text-[10px] bg-stone-800 px-2 py-0.5 rounded-full text-stone-300">
                        {stg.checkpoints.length} Checkpoint
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 font-medium">
                      {stg.subtitle}
                    </p>
                    <p className="text-[11px] text-stone-400 line-clamp-1 italic">
                      "{stg.lore}"
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-stone-900 group-hover:bg-amber-600 group-hover:text-stone-950 text-stone-400 transition-colors">
                    <Play className="w-5 h-5 fill-current" />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-stone-800 flex justify-end">
              <button
                id="btn-back-to-menu-from-stages"
                onClick={() => setScreen('menu')}
                className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Kembali ke Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. HELP & CHECKPOINT GUIDE SCREEN */}
      {screen === 'help' && (
        <div id="help-screen" className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-stone-950/95 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-stone-900 border-2 border-amber-700/80 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-4 text-stone-200">
            <h2 className="font-serif text-2xl font-bold text-amber-200 text-center border-b border-stone-800 pb-3">
              Panduan Bermain & Checkpoint
            </h2>

            <div className="space-y-3 text-xs md:text-sm">
              <div className="bg-stone-950/60 p-3.5 rounded-xl border border-stone-800">
                <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  Bagaimana Checkpoint Bekerja?
                </h3>
                <p className="text-stone-300 leading-relaxed">
                  Di setiap pos prasasti candi, dekati monumen Surya Majapahit. Cahaya emas akan memancar dan status <b>"CHECKPOINT TERDAFTAR"</b> akan muncul. Bila ksatria Anda gugur dalam pertempuran, Anda tidak perlu mengulang dari awal babak, melainkan cukup menekan tombol <b>"Bangkit di Checkpoint Terakhir"</b>.
                </p>
              </div>

              <div className="bg-stone-950/60 p-3.5 rounded-xl border border-stone-800">
                <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Istirahat & Berkah Wilwatikta
                </h3>
                <p className="text-stone-300 leading-relaxed">
                  Ketika berdiri di dekat Checkpoint yang sudah aktif, tekan <b>[E]</b> atau ketuk tombol interaksi. Di sana Anda dapat memulihkan seluruh Darah & Tenaga Batin, serta menukar keping emas untuk meningkatkan Pusaka Keris, Zirah, dan Prana.
                </p>
              </div>

              <div className="bg-stone-950/60 p-3.5 rounded-xl border border-stone-800">
                <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <Swords className="w-4 h-4 text-amber-400" />
                  Kombinasi Jurus Bhayangkara
                </h3>
                <p className="text-stone-300 leading-relaxed">
                  Gunakan <b>Keris (J / Z)</b> untuk combo 3 tebasan, <b>Panah Gandewa (K / X)</b> untuk serangan jarak jauh mematikan, dan <b>Perisai Tangkis (L / C)</b> untuk menahan 80% tebasan musuh!
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-800 flex justify-end">
              <button
                id="btn-back-to-menu-from-help"
                onClick={() => setScreen('menu')}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold rounded-xl cursor-pointer"
              >
                Paham & Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. GAME OVER SCREEN (With prominent Checkpoint Respawn) */}
      {screen === 'gameover' && (
        <div id="game-over-screen" className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fade-in">
          <div className="relative w-full max-w-md bg-stone-900 border-2 border-red-700/80 rounded-3xl p-6 md:p-8 shadow-2xl text-center flex flex-col items-center">
            {/* Defeat Emblem based on death reason */}
            <div className="w-16 h-16 rounded-full bg-red-950 border border-red-600 flex items-center justify-center text-red-400 mb-3 shadow-lg">
              {deathReason === 'lantern_blackout' && <Flame className="w-8 h-8 text-amber-500 fill-amber-500 animate-pulse" />}
              {deathReason === 'stamina_exhaustion' && <ShieldAlert className="w-8 h-8 text-rose-500" />}
              {deathReason === 'barricade_breached' && <AlertTriangle className="w-8 h-8 text-red-500 animate-bounce" />}
              {deathReason === 'health_depleted' && <Shield className="w-8 h-8 text-red-500" />}
            </div>

            {/* Death Cause Tag */}
            <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-red-950/80 border border-red-600/60 text-red-300 mb-1">
              {deathReason === 'lantern_blackout' && 'Minyak Lentera Padam Total'}
              {deathReason === 'stamina_exhaustion' && 'Kehabisan Stamina Terkepung'}
              {deathReason === 'barricade_breached' && 'Barikade Benteng Runtuh'}
              {deathReason === 'health_depleted' && 'Darah (HP) Terkuras Habis'}
            </span>

            <h2 className="font-serif text-2xl md:text-3xl font-extrabold text-red-400 tracking-wider">
              {deathReason === 'lantern_blackout' ? 'Ditelan Kegelapan Abadi' : 'Ksatria Telah Gugur!'}
            </h2>

            <p className="text-xs text-stone-300 mt-2 mb-5 leading-relaxed font-medium">
              {deathReason === 'lantern_blackout' && (
                'Minyak lentera obor padam total! Dalam kegelapan pekat benteng bawah tanah, hawa kutukan dan bayangan menyergap jiwamu tanpa ampun.'
              )}
              {deathReason === 'stamina_exhaustion' && (
                'Kehabisan stamina di tengah kepungan musuh! Raga Arya Sena terlalu lelah untuk menangkis maupun mengayunkan keris pusaka.'
              )}
              {deathReason === 'barricade_breached' && (
                'Barikade pertahanan balairung benteng hancur lebur! Gerombolan prajurit zirah bayangan menerobos masuk dan menguasai benteng.'
              )}
              {deathReason === 'health_depleted' && (
                'Poin darah Ksatria Arya Sena terkuras habis akibat tebasan prajurit bayangan musuh, namun semangat Satya Haprabu tetap membara.'
              )}
            </p>

            {/* Checkpoint Respawn Button (Prominent Feature) */}
            <div className="w-full space-y-2.5">
              <button
                id="btn-respawn-at-checkpoint"
                onClick={respawnAtCheckpoint}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold rounded-2xl shadow-xl border-2 border-amber-300 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all text-sm"
              >
                <Sparkles className="w-5 h-5 text-stone-950 animate-spin" />
                <span>
                  Bangkit di Checkpoint: {activeCheckpoint ? activeCheckpoint.name : 'Awal Bab'}
                </span>
              </button>

              <button
                id="btn-restart-stage"
                onClick={() => startNewGame(currentStageIndex)}
                className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold rounded-xl border border-stone-700 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ulangi Babak Ini dari Awal</span>
              </button>

              <button
                id="btn-quit-to-menu-from-gameover"
                onClick={() => setScreen('menu')}
                className="w-full py-2 px-4 text-stone-400 hover:text-stone-200 text-xs font-medium cursor-pointer"
              >
                Kembali ke Menu Utama
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. STAGE CLEAR / VICTORY SCREEN */}
      {screen === 'victory' && (
        <div id="victory-screen" className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-lg animate-fade-in">
          <div className="relative w-full max-w-lg bg-stone-900 border-2 border-amber-500 rounded-3xl p-6 md:p-8 shadow-2xl text-center flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-stone-950 mb-3 shadow-lg ${
              currentStageIndex === 4
                ? 'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 animate-bounce'
                : 'bg-gradient-to-br from-amber-400 to-amber-600'
            }`}>
              <Award className="w-9 h-9" />
            </div>

            <span className="text-xs text-amber-400 font-bold uppercase tracking-widest">
              {currentStageIndex === 4 ? 'Kemenangan Pamungkas Majapahit' : `Kemenangan Lantai ${currentStageIndex + 1}`}
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-extrabold text-amber-100 tracking-wide mt-0.5">
              {currentStageIndex === 4
                ? 'AVATAR ANGKARA DAHANA Ditumpas!'
                : `${stage.name} Berhasil Ditembus!`}
            </h2>
            <p className="text-xs text-stone-300 mt-1 mb-4">
              {currentStageIndex === 4
                ? 'Raja Kejahatan dan antek kegelapannya telah musnah di puncak menara suci. Arya Sena berhasil membebaskan tanah leluhur Wilwatikta!'
                : 'Gerbang candi telah ditembus dan seluruh pos suaka resi berhasil dikuasai.'}
            </p>

            {/* Next Level Attack Scaling Warning (Floors 1-4) */}
            {currentStageIndex < STAGES_DATA.length - 1 && (
              <div className="w-full bg-amber-950/50 border border-amber-600/50 rounded-2xl p-3 mb-4 text-left">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-1">
                  <span>⚠️</span>
                  <span>Persiapan Lantai Berikutnya: {STAGES_DATA[currentStageIndex + 1].name}</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  {currentStageIndex === 0 && 'Serangan musuh bertambah (+60% Damage)! Barikade Balairung membutuhkan perlindungan ekstra Anda.'}
                  {currentStageIndex === 1 && 'Serangan musuh bertambah tajam (+120% Damage)! Kegelapan pekat memerlukan penghematan minyak lentera obor.'}
                  {currentStageIndex === 2 && 'Serangan musuh mematikan (+220% Damage)! Pasukan elit zirah hitam menyerang lebih agresif.'}
                  {currentStageIndex === 3 && '🔥 PERINGATAN RAJA KEJAHATAN: Anda akan berhadapan langsung dengan AVATAR ANGKARA DAHANA di puncak menara suci!'}
                </p>
              </div>
            )}

            <div className="w-full bg-stone-950/80 border border-stone-800 rounded-2xl p-4 mb-5 space-y-2 text-left text-xs">
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Total Skor Diperoleh:</span>
                <span className="text-amber-400 font-bold font-mono text-sm">{score}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Keping Emas Dikumpulkan:</span>
                <span className="text-amber-400 font-bold font-mono text-sm">{player.stats.coins}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Koin Ilmu Dituntaskan:</span>
                <span className="text-amber-300 font-bold font-mono text-sm">{player.stats.knowledgeCoins} 📜</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Status Checkpoint:</span>
                <span className="text-emerald-400 font-bold">Semua Pos Telah Dikuasai</span>
              </div>
            </div>

            <div className="w-full space-y-2.5">
              {currentStageIndex < STAGES_DATA.length - 1 ? (
                <button
                  id="btn-next-stage"
                  onClick={handleNextStage}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-2xl shadow-xl border-2 border-amber-300 flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-sm"
                >
                  <span>Lanjutkan ke Lantai {currentStageIndex + 2}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="p-3.5 bg-gradient-to-r from-amber-950/90 to-stone-900 border border-amber-500/60 rounded-2xl text-amber-200 text-xs mb-2 leading-relaxed">
                  🏆 <strong className="text-amber-300">Selamat!</strong> Anda telah menamatkan seluruh 5 Lantai Kronik Benteng Wilwatikta dan menumpas <strong className="text-red-300">AVATAR ANGKARA DAHANA</strong>! Mahkota kemaharajaan Majapahit kini berdiri kokoh dan abadi.
                </div>
              )}

              <button
                id="btn-return-menu-from-victory"
                onClick={() => setScreen('menu')}
                className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Kembali ke Menu Utama
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. PAUSE OVERLAY */}
      {isPaused && (
        <div id="pause-modal" className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <h2 className="font-serif text-xl font-bold text-amber-200">
              Permainan Dijeda
            </h2>

            <div className="space-y-2">
              <button
                id="btn-resume-game"
                onClick={() => setIsPaused(false)}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-xl text-xs cursor-pointer"
              >
                Lanjutkan Pertempuran
              </button>
              <button
                id="btn-restart-from-pause"
                onClick={() => {
                  respawnAtCheckpoint();
                }}
                className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Kembali ke Checkpoint Aktif
              </button>
              <button
                id="btn-quit-to-menu-from-pause"
                onClick={() => {
                  setIsPaused(false);
                  setScreen('menu');
                }}
                className="w-full py-2 bg-transparent text-stone-400 hover:text-stone-200 text-xs cursor-pointer"
              >
                Keluar ke Menu Utama
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. ACTIVE GAMEPLAY CANVAS & HUD */}
      {screen === 'playing' && (
        <>
          <GameCanvas
            stage={stage}
            player={player}
            onUpdatePlayer={setPlayer}
            onActivateCheckpoint={handleActivateCheckpoint}
            onOpenCheckpointMenu={(cp) => setInspectingCheckpoint(cp)}
            onPlayerDeath={handlePlayerDeath}
            onStageClear={handleStageClear}
            onAddScore={(pts) => setScore((prev) => prev + pts)}
            onNearArtifact={(art) => setNearArtifact(art)}
            onOpenArtifactModal={(art) => setActiveArtifactQuiz(art)}
            onUpdateBarricade={(updater) => setBarricade((prev) => prev ? updater(prev) : prev)}
            solvedArtifactIds={solvedArtifactIds}
            isPaused={isPaused}
            onPause={() => setIsPaused((prev) => !prev)}
            virtualInputRef={virtualInputRef}
          />

          <GameHUD
            stats={player.stats}
            currentStageName={stage.name}
            stageSubtitle={stage.subtitle}
            floorNumber={stage.floorNumber || (currentStageIndex + 1)}
            activeCheckpoint={activeCheckpoint}
            checkpoints={stage.checkpoints}
            playerX={player.x}
            worldWidth={stage.worldWidth}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onPause={() => setIsPaused(true)}
            onOpenChronicle={() => setShowChronicle(true)}
            onOpenResiAdvice={() => setIsResiAdviceOpen((prev) => !prev)}
            nearCheckpoint={nearCheckpoint}
            onInteractCheckpoint={() => {
              if (nearCheckpoint) setInspectingCheckpoint(nearCheckpoint);
            }}
            nearArtifact={nearArtifact}
            onInteractArtifact={() => {
              if (nearArtifact) setActiveArtifactQuiz(nearArtifact);
            }}
            barricade={barricade}
            hasSavedCheckpoint={!!savedCheckpoint}
            score={score}
          />

          {/* Virtual Mobile Controls */}
          <VirtualControls
            onStartMoveLeft={() => { virtualInputRef.current.left = true; }}
            onStopMoveLeft={() => { virtualInputRef.current.left = false; }}
            onStartMoveRight={() => { virtualInputRef.current.right = true; }}
            onStopMoveRight={() => { virtualInputRef.current.right = false; }}
            onJump={() => { virtualInputRef.current.jump = true; }}
            onAttack={() => { virtualInputRef.current.attack = true; }}
            onShoot={() => { virtualInputRef.current.shoot = true; }}
            onBlockStart={() => { virtualInputRef.current.block = true; }}
            onBlockEnd={() => { virtualInputRef.current.block = false; }}
            onDash={() => { virtualInputRef.current.dash = true; }}
            nearCheckpoint={nearCheckpoint}
            onInteractCheckpoint={() => {
              if (nearCheckpoint) setInspectingCheckpoint(nearCheckpoint);
            }}
            nearArtifact={nearArtifact}
            onInteractArtifact={() => {
              if (nearArtifact) setActiveArtifactQuiz(nearArtifact);
            }}
          />

          {/* Resi Vidyadhara (Penasehat, Karakter Pendukung) Advisor Card */}
          <ResiAdvisorCard
            stats={player.stats}
            nearCheckpoint={nearCheckpoint}
            nearArtifact={nearArtifact}
            barricade={barricade}
            currentFloor={stage.floorNumber || (currentStageIndex + 1)}
            isBossFight={stage.enemies.some((e) => e.isBoss && Math.abs(player.x - e.x) < 750)}
            bossName={stage.enemies.find((e) => e.isBoss)?.name}
            isManualOpen={isResiAdviceOpen}
            onCloseManual={() => setIsResiAdviceOpen(false)}
          />
        </>
      )}

      {/* 8. CHECKPOINT REST & UPGRADE MODAL */}
      {inspectingCheckpoint && (
        <CheckpointModal
          checkpoint={inspectingCheckpoint}
          stats={player.stats}
          onUpgradeStat={handleUpgradeStat}
          onClose={() => setInspectingCheckpoint(null)}
        />
      )}

      {/* 9. ARTIFACT HISTORICAL QUIZ MODAL */}
      {activeArtifactQuiz && (
        <ArtifactQuizModal
          artifact={activeArtifactQuiz}
          onSolveQuiz={handleSolveQuiz}
          onClose={() => setActiveArtifactQuiz(null)}
        />
      )}

      {/* 10. CHRONICLE LORE MODAL */}
      {showChronicle && (
        <ChronicleModal onClose={() => setShowChronicle(false)} />
      )}
    </main>
  );
}

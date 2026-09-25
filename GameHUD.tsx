import React, { useState } from 'react';
import { PlayerStats, Checkpoint, HistoricalArtifact, CastleBarricade } from '../types';
import { Shield, Swords, Sparkles, Volume2, VolumeX, Pause, BookOpen, MapPin, Heart, Flame, AlertTriangle, ShieldAlert, Keyboard, HelpCircle, X, PlusCircle } from 'lucide-react';

interface GameHUDProps {
  stats: PlayerStats;
  currentStageName: string;
  stageSubtitle: string;
  floorNumber: number;
  activeCheckpoint: Checkpoint | null;
  checkpoints: Checkpoint[];
  playerX: number;
  worldWidth: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onPause: () => void;
  onOpenChronicle: () => void;
  onOpenResiAdvice?: () => void;
  nearCheckpoint: Checkpoint | null;
  onInteractCheckpoint: () => void;
  nearArtifact: HistoricalArtifact | null;
  onInteractArtifact: () => void;
  barricade?: CastleBarricade;
  hasSavedCheckpoint: boolean;
  score: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  currentStageName,
  stageSubtitle,
  floorNumber,
  activeCheckpoint,
  checkpoints,
  playerX,
  worldWidth,
  soundEnabled,
  onToggleSound,
  onPause,
  onOpenChronicle,
  onOpenResiAdvice,
  nearCheckpoint,
  onInteractCheckpoint,
  nearArtifact,
  onInteractArtifact,
  barricade,
  score,
}) => {
  const [showControlsModal, setShowControlsModal] = useState(false);
  const hpPercent = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
  const staminaPercent = Math.max(0, Math.min(100, (stats.stamina / stats.maxStamina) * 100));
  const lanternPercent = Math.max(0, Math.min(100, (stats.lanternFuel / stats.maxLanternFuel) * 100));
  const progressPercent = Math.max(0, Math.min(100, (playerX / worldWidth) * 100));

  const isLanternCritical = stats.lanternFuel <= 25;
  const isStaminaExhausted = stats.stamina <= 5;

  return (
    <div id="game-hud" className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 md:p-5">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Left: Player Status (HP, Stamina, Lantern Fuel, Knowledge Coins) */}
        <div className="bg-stone-900/95 border border-amber-800/70 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex flex-col gap-2 min-w-[260px] md:min-w-[310px]">
          {/* Header Title with Arya Sena */}
          <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <div>
                <span className="font-serif tracking-wider text-xs md:text-sm text-amber-200 font-bold block">
                  Arya Sena
                </span>
                <span className="text-[9px] text-stone-400">Ksatria Pembawa Lentera</span>
              </div>
            </div>

            {/* Knowledge Coins Counter */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-950/70 border border-amber-600/40 text-amber-300 font-bold text-xs">
              <span>📜</span>
              <span>{stats.knowledgeCoins}</span>
              <span className="text-[9px] font-normal text-amber-200/80">Koin Ilmu</span>
            </div>
          </div>

          {/* Health Bar */}
          <div>
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span className="flex items-center gap-1 text-red-400 font-semibold">
                <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                Darah (HP)
              </span>
              <span className="text-stone-300 font-mono text-[10px]">
                {Math.ceil(stats.hp)} / {stats.maxHp}
              </span>
            </div>
            <div className="h-2.5 bg-stone-950 rounded-full overflow-hidden p-0.5 border border-stone-800">
              <div 
                className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-full transition-all duration-200"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Stamina Bar */}
          <div>
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span className={`flex items-center gap-1 font-semibold ${isStaminaExhausted ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                <Shield className="w-3 h-3 text-emerald-400" />
                Stamina Raga
                {isStaminaExhausted && <span className="text-[9px] text-rose-300 font-bold">(LELAH EKSTREM!)</span>}
              </span>
              <span className="text-stone-300 font-mono text-[10px]">
                {Math.ceil(stats.stamina)} / {stats.maxStamina}
              </span>
            </div>
            <div className="h-2.5 bg-stone-950 rounded-full overflow-hidden p-0.5 border border-stone-800">
              <div 
                className={`h-full rounded-full transition-all duration-150 ${
                  isStaminaExhausted
                    ? 'bg-gradient-to-r from-red-500 to-rose-600'
                    : 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400'
                }`}
                style={{ width: `${staminaPercent}%` }}
              />
            </div>
          </div>

          {/* Lantern Fuel Bar (Survival Horror) */}
          <div>
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span className={`flex items-center gap-1 font-semibold ${isLanternCritical ? 'text-amber-300 animate-pulse' : 'text-amber-400'}`}>
                <Flame className={`w-3 h-3 ${isLanternCritical ? 'text-red-400 fill-red-400' : 'text-amber-400 fill-amber-400'}`} />
                Minyak Lentera Obor
                {isLanternCritical && <span className="text-[9px] text-red-400 font-bold">(REDUP!)</span>}
              </span>
              <span className="text-stone-300 font-mono text-[10px]">
                {Math.ceil(stats.lanternFuel)}%
              </span>
            </div>
            <div className="h-2.5 bg-stone-950 rounded-full overflow-hidden p-0.5 border border-stone-800">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  isLanternCritical
                    ? 'bg-gradient-to-r from-red-600 via-amber-600 to-amber-400 animate-pulse'
                    : 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-300'
                }`}
                style={{ width: `${lanternPercent}%` }}
              />
            </div>
          </div>

          {/* Warning banner if oil is almost out */}
          {isLanternCritical && (
            <div className="flex items-center gap-1.5 p-1 px-2 rounded bg-red-950/80 border border-red-700/60 text-[10px] text-red-300 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
              <span>Awas! Lentera hampir padam, bayangan kutukan bersiap menyergap!</span>
            </div>
          )}
        </div>

        {/* Center: Stage Name & Checkpoint Status + Barricade if present */}
        <div className="flex flex-col items-center gap-2">
          <div className="bg-stone-900/90 border border-amber-700/60 rounded-xl px-4 py-2 shadow-xl backdrop-blur-md text-center max-w-sm">
            <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase font-bold text-amber-400">
              <span>Lantai {floorNumber} dari 5 Babak</span>
              <span className="text-stone-500">•</span>
              {floorNumber === 1 && (
                <span className="text-emerald-400">⚔️ Serangan Musuh: Normal</span>
              )}
              {floorNumber === 2 && (
                <span className="text-amber-400">⚔️ Serangan Musuh: +60%</span>
              )}
              {floorNumber === 3 && (
                <span className="text-orange-400">⚔️ Serangan Musuh: +120%</span>
              )}
              {floorNumber === 4 && (
                <span className="text-rose-400">⚔️ Serangan Musuh: +220% (Mematikan)</span>
              )}
              {floorNumber === 5 && (
                <span className="text-red-400 font-extrabold animate-pulse">🔥 RAJA KEJAHATAN DAHANA 🔥</span>
              )}
            </div>
            <h1 className="font-serif font-bold text-sm md:text-base text-amber-200 tracking-wide drop-shadow">
              {currentStageName}
            </h1>
            <p className="text-[11px] text-stone-400 hidden sm:block">
              {stageSubtitle}
            </p>

            {/* Checkpoint Status Banner */}
            <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[11px] text-amber-300 bg-amber-950/70 border border-amber-600/40 rounded-lg px-2.5 py-0.5">
              <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate max-w-[200px]">
                {activeCheckpoint ? activeCheckpoint.name : 'Mencari Suaka Resi...'}
              </span>
              <span className="text-[9px] bg-amber-600/80 text-amber-100 px-1 rounded font-bold">
                AKTIF
              </span>
            </div>
          </div>

          {/* Barricade HP Bar (Floor 2 Fortress Defense) */}
          {barricade && (
            <div className="bg-stone-900/90 border border-amber-600/60 rounded-xl p-2.5 shadow-lg backdrop-blur-md w-full max-w-xs text-center">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 mb-1">
                <span className="flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  Pertahanan Barikade Balairung
                </span>
                <span className="font-mono text-stone-300">{Math.ceil(barricade.hp)} / {barricade.maxHp}</span>
              </div>
              <div className="h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                <div
                  className={`h-full transition-all duration-200 ${
                    barricade.hp > 60
                      ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                      : 'bg-gradient-to-r from-red-600 to-rose-500 animate-pulse'
                  }`}
                  style={{ width: `${Math.max(0, (barricade.hp / barricade.maxHp) * 100)}%` }}
                />
              </div>
              <span className="text-[9px] text-stone-400 block mt-0.5">
                Lindungi dari serbuan formasi prajurit zirah bayangan!
              </span>
            </div>
          )}
        </div>

        {/* Right: Quick Controls, Coins & Settings */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-stone-900/90 border border-stone-800 rounded-xl px-3 py-1.5 shadow-md flex items-center gap-2 text-xs">
            <span className="text-stone-400 font-mono">Skor:</span>
            <span className="text-amber-400 font-bold font-mono">{score}</span>
          </div>

          {onOpenResiAdvice && (
            <button
              id="btn-open-resi-advice-hud"
              onClick={onOpenResiAdvice}
              title="Konsultasi Nasihat Resi Vidyadhara"
              className="px-2.5 py-1.5 bg-amber-950/80 hover:bg-amber-900/90 border border-amber-500/70 text-amber-200 rounded-xl shadow-md transition-colors active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-serif font-bold"
            >
              <span>🧙‍♂️</span>
              <span className="hidden sm:inline">Nasihat Resi</span>
            </button>
          )}

          <button
            id="btn-open-keyboard-guide"
            onClick={() => setShowControlsModal(true)}
            title="Panduan Kontrol Keyboard"
            className="p-2.5 bg-stone-900/90 hover:bg-stone-800 border border-amber-800/60 text-amber-300 rounded-xl shadow-md transition-colors active:scale-95 cursor-pointer flex items-center gap-1 text-xs"
          >
            <Keyboard className="w-4 h-4" />
            <span className="hidden md:inline font-mono font-semibold">Keyboard</span>
          </button>

          <button
            id="btn-open-chronicle"
            onClick={onOpenChronicle}
            title="Buka Kronik Wilwatikta"
            className="p-2.5 bg-stone-900/90 hover:bg-stone-800 border border-amber-800/60 text-amber-300 rounded-xl shadow-md transition-colors active:scale-95 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button
            id="btn-toggle-sound"
            onClick={onToggleSound}
            title={soundEnabled ? "Matikan Suara" : "Nyalakan Suara"}
            className="p-2.5 bg-stone-900/90 hover:bg-stone-800 border border-amber-800/60 text-amber-300 rounded-xl shadow-md transition-colors active:scale-95 cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
          </button>

          <button
            id="btn-pause-game"
            onClick={onPause}
            title="Jeda Permainan (Esc / P)"
            className="p-2.5 bg-stone-900/90 hover:bg-stone-800 border border-amber-800/60 text-amber-300 rounded-xl shadow-md transition-colors active:scale-95 cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Near Checkpoint Prompt Notification */}
      {nearCheckpoint && (
        <div className="self-center pointer-events-auto animate-bounce mb-2">
          <button
            id="btn-interact-checkpoint"
            onClick={onInteractCheckpoint}
            className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-stone-950 font-bold px-4 py-2 rounded-full shadow-xl border-2 border-amber-300 flex items-center gap-2 cursor-pointer hover:brightness-110 active:scale-95 text-xs md:text-sm"
          >
            <Sparkles className="w-4 h-4 animate-spin text-amber-950" />
            <span>[E / Enter] Suaka Resi • Pulihkan Raga & Minyak Lentera</span>
          </button>
        </div>
      )}

      {/* Near Artifact Prompt Notification */}
      {nearArtifact && !nearCheckpoint && (
        <div className="self-center pointer-events-auto animate-bounce mb-2">
          <button
            id="btn-interact-artifact"
            onClick={onInteractArtifact}
            className="bg-gradient-to-r from-yellow-500 via-amber-400 to-amber-600 text-stone-950 font-extrabold px-4 py-2 rounded-full shadow-2xl border-2 border-yellow-200 flex items-center gap-2 cursor-pointer hover:brightness-110 active:scale-95 text-xs md:text-sm"
          >
            <span className="text-base">📜</span>
            <span>[E / Enter] Periksa {nearArtifact.name} • Pecahkan Kuis (+10 Koin)</span>
          </button>
        </div>
      )}

      {/* Bottom Area: Progress to next Checkpoint / Boss + Easy Keyboard Reference */}
      <div className="flex flex-col gap-2 pointer-events-auto">
        {/* Progress Bar of the World with Checkpoint Dots */}
        <div className="bg-stone-900/80 border border-stone-800/80 rounded-xl p-2 max-w-lg mx-auto w-full backdrop-blur-sm">
          <div className="flex justify-between items-center text-[10px] text-stone-400 mb-1 px-1">
            <span className="font-serif">Awal Lantai</span>
            <span className="text-amber-300 font-semibold">Jelajah Kastil: {Math.round(progressPercent)}%</span>
            <span className="font-serif text-red-400">Pintu Menuju Lantai Berikutnya</span>
          </div>
          <div className="relative h-2 bg-stone-950 rounded-full overflow-visible border border-stone-800">
            {/* Filled bar */}
            <div 
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />

            {/* Checkpoint markers */}
            {checkpoints.map((cp) => {
              const cpPercent = (cp.x / worldWidth) * 100;
              const isCurrent = activeCheckpoint?.id === cp.id;
              return (
                <div
                  key={cp.id}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                    cp.activated 
                      ? 'bg-amber-400 border-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.8)]' 
                      : 'bg-stone-700 border-stone-500'
                  } ${isCurrent ? 'ring-2 ring-amber-300 scale-125' : ''}`}
                  style={{ left: `${cpPercent}%` }}
                  title={`${cp.name} (${cp.activated ? 'Sudah Aktif' : 'Belum Dijangkau'})`}
                />
              );
            })}
          </div>
        </div>

        {/* Keyboard Legend Hint for Desktop/Keyboard Players */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 text-[10px] sm:text-[11px] text-stone-300 bg-stone-950/85 border border-stone-800/80 rounded-xl py-1.5 px-3 max-w-4xl mx-auto shadow-lg backdrop-blur-sm">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 rounded text-amber-300 font-mono font-bold">A / D</kbd>
            <span className="text-stone-400">atau</span>
            <kbd className="px-1 py-0.5 bg-stone-800 border border-stone-700 rounded text-amber-300 font-mono">←→</kbd>
            <span className="text-stone-300 ml-0.5">Jalan</span>
          </span>
          <span className="text-stone-600">•</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 rounded text-amber-300 font-mono font-bold">W / Spasi</kbd>
            <span className="text-stone-300 ml-0.5">Lompat</span>
          </span>
          <span className="text-stone-600">•</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 rounded text-amber-300 font-mono font-bold">S / ↓</kbd>
            <span className="text-stone-300 ml-0.5">Turun Platform</span>
          </span>
          <span className="text-stone-600">•</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 rounded text-amber-300 font-mono font-bold">J / Z / F</kbd>
            <span className="text-stone-300 ml-0.5">Keris</span>
          </span>
          <span className="text-stone-600">•</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 rounded text-amber-300 font-mono font-bold">K / X</kbd>
            <span className="text-stone-300 ml-0.5">Panah</span>
          </span>
          <span className="text-stone-600">•</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 rounded text-amber-300 font-mono font-bold">L / C</kbd>
            <span className="text-stone-300 ml-0.5">Tangkis</span>
          </span>
          <span className="text-stone-600">•</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 rounded text-amber-300 font-mono font-bold">Shift / Q</kbd>
            <span className="text-stone-300 ml-0.5">Dash</span>
          </span>
          <span className="text-stone-600">•</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-600/70 rounded text-emerald-300 font-mono font-bold">H / 1</kbd>
            <span className="text-emerald-300 font-medium ml-0.5">Jamu (+35HP)</span>
          </span>
          <span className="text-stone-600">•</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 rounded text-amber-300 font-mono font-bold">E</kbd>
            <span className="text-stone-300 ml-0.5">Interaksi</span>
          </span>
        </div>
      </div>

      {/* Keyboard Controls Full Help Modal */}
      {showControlsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto">
          <div className="bg-stone-900 border-2 border-amber-600/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-stone-200 animate-in fade-in zoom-in duration-200">
            <button
              id="btn-close-keyboard-modal"
              onClick={() => setShowControlsModal(false)}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-stone-800">
              <div className="p-2.5 bg-amber-950 border border-amber-700/60 rounded-xl text-amber-300">
                <Keyboard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-serif text-amber-300">Panduan Kontrol Keyboard</h3>
                <p className="text-xs text-stone-400">Dirancang responsif dan nyaman dimainkan dengan keyboard</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-5">
              <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800">
                <div className="text-amber-400 font-bold font-serif mb-2 flex items-center gap-1.5">
                  <span>🏃</span> Pergerakan & Lompat
                </div>
                <ul className="space-y-1.5 text-stone-300">
                  <li className="flex justify-between">
                    <span className="text-stone-400">Jalan Kiri/Kanan:</span>
                    <span className="font-mono font-bold text-amber-300">[A] / [D] atau [←] [→]</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-stone-400">Lompat (Pas):</span>
                    <span className="font-mono font-bold text-amber-300">[W] atau [Spasi]</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-stone-400">Lompat Ganda:</span>
                    <span className="font-mono font-bold text-amber-300">Tekan [Spasi] 2x</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-stone-400">Turun Platform:</span>
                    <span className="font-mono font-bold text-amber-300">[S] atau [↓]</span>
                  </li>
                </ul>
              </div>

              <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800">
                <div className="text-amber-400 font-bold font-serif mb-2 flex items-center gap-1.5">
                  <span>⚔️</span> Pertarungan & Bertahan
                </div>
                <ul className="space-y-1.5 text-stone-300">
                  <li className="flex justify-between">
                    <span className="text-stone-400">Tebasan Keris:</span>
                    <span className="font-mono font-bold text-amber-300">[J] atau [Z] atau [F]</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-stone-400">Panah Gandewa:</span>
                    <span className="font-mono font-bold text-amber-300">[K] atau [X]</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-stone-400">Tangkis Perisai:</span>
                    <span className="font-mono font-bold text-amber-300">[L] atau [C]</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-stone-400">Dash Gesit:</span>
                    <span className="font-mono font-bold text-amber-300">[Shift] atau [Q]</span>
                  </li>
                </ul>
              </div>

              <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800">
                <div className="text-emerald-400 font-bold font-serif mb-2 flex items-center gap-1.5">
                  <span>🌿</span> Pemulihan & Interaksi
                </div>
                <ul className="space-y-1.5 text-stone-300">
                  <li className="flex justify-between">
                    <span className="text-stone-400">Minum Jamu (+35 HP):</span>
                    <span className="font-mono font-bold text-emerald-300">[H] atau [1]</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-stone-400">Interaksi Checkpoint:</span>
                    <span className="font-mono font-bold text-amber-300">[E] atau [Enter]</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-stone-400">Periksa Artefak:</span>
                    <span className="font-mono font-bold text-amber-300">[E] atau [Enter]</span>
                  </li>
                </ul>
              </div>

              <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800">
                <div className="text-amber-400 font-bold font-serif mb-2 flex items-center gap-1.5">
                  <span>💡</span> Tips Bermain Nyaman
                </div>
                <ul className="space-y-1.5 text-stone-300">
                  <li>• Lompatan disesuaikan tidak terlalu tinggi agar mudah mendarat tepat di batu benteng.</li>
                  <li>• Berdiri dekat lentera checkpoint akan memulihkan darah & lentera secara penuh!</li>
                  <li>• Tekan <b className="text-amber-300 font-mono">[Esc]</b> atau <b className="text-amber-300 font-mono">[P]</b> untuk jeda.</li>
                </ul>
              </div>
            </div>

            <button
              id="btn-close-controls-modal-confirm"
              onClick={() => setShowControlsModal(false)}
              className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold rounded-xl shadow-lg transition-all cursor-pointer text-sm"
            >
              Mengerti, Lanjutkan Permainan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


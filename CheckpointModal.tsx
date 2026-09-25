import React from 'react';
import { Checkpoint, PlayerStats } from '../types';
import { Sparkles, Heart, Swords, Flame, Shield, X, MapPin, CheckCircle2 } from 'lucide-react';
import { CheckpointManager } from '../utils/checkpointManager';

interface CheckpointModalProps {
  checkpoint: Checkpoint;
  stats: PlayerStats;
  onUpgradeStat: (statType: 'maxHp' | 'attackPower' | 'maxEnergy' | 'defense', cost: number) => void;
  onClose: () => void;
}

export const CheckpointModal: React.FC<CheckpointModalProps> = ({
  checkpoint,
  stats,
  onUpgradeStat,
  onClose,
}) => {
  // Stat upgrade levels based on standard base
  const hpLevel = Math.max(0, Math.floor((stats.maxHp - 120) / 25));
  const atkLevel = Math.max(0, Math.floor((stats.attackPower - 24) / 6));
  const energyLevel = Math.max(0, Math.floor((stats.maxEnergy - 80) / 20));
  const defLevel = Math.max(0, Math.floor((stats.defense - 8) / 3));

  const hpCost = CheckpointManager.calculateUpgradeCost('maxHp', hpLevel);
  const atkCost = CheckpointManager.calculateUpgradeCost('attackPower', atkLevel);
  const energyCost = CheckpointManager.calculateUpgradeCost('maxEnergy', energyLevel);
  const defCost = CheckpointManager.calculateUpgradeCost('defense', defLevel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-stone-900 border-2 border-amber-600/70 rounded-2xl p-5 md:p-7 shadow-2xl overflow-hidden flex flex-col gap-4">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-400" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-400" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-400" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-400" />

        {/* Close Button */}
        <button
          id="btn-close-checkpoint-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-amber-200 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Resi Vidyadhara & Sanctuary */}
        <div className="text-center border-b border-amber-800/40 pb-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 via-amber-600 to-stone-900 text-stone-950 shadow-xl mb-2 border-2 border-amber-300">
            <Sparkles className="w-7 h-7 text-amber-100 animate-pulse" />
          </div>
          <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5" />
            <span>Suaka Resi Vidyadhara • Checkpoint Suci</span>
          </div>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-amber-100 tracking-wide mt-1">
            {checkpoint.name}
          </h2>
          
          {checkpoint.resiAdvice && (
            <div className="mt-2.5 p-3 bg-amber-950/40 border border-amber-700/40 rounded-xl text-left">
              <span className="text-[11px] font-bold text-amber-300 block uppercase tracking-wider mb-0.5">
                Wejangan Resi Vidyadhara:
              </span>
              <p className="text-xs text-stone-200 italic leading-relaxed">
                "{checkpoint.resiAdvice}"
              </p>
            </div>
          )}

          <div className="mt-3 inline-flex items-center gap-2 text-emerald-400 text-xs bg-emerald-950/60 border border-emerald-700/50 px-3.5 py-1.5 rounded-full font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Darah, Stamina, dan Minyak Lentera (100%) dipulihkan sepenuhnya!</span>
          </div>
        </div>

        {/* Currency & Knowledge Coins */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-stone-950/80 border border-stone-800 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
            <span className="text-xs text-stone-400">Keping Emas:</span>
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{stats.coins}</span>
            </div>
          </div>

          <div className="bg-stone-950/80 border border-amber-700/50 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
            <span className="text-xs text-amber-300">Koin Pengetahuan:</span>
            <div className="flex items-center gap-1.5 text-amber-300 font-bold text-sm">
              <span className="text-base">📜</span>
              <span>{stats.knowledgeCoins}</span>
            </div>
          </div>
        </div>

        {/* Upgrade / Berkah Wilwatikta Options */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-serif font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5" />
            <span>Berkah Wilwatikta (Tingkatkan Pusaka & Raga)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Max HP Upgrade */}
            <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-950/70 border border-red-800/50 rounded-lg text-red-400">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-200">Darah Maksimum</h4>
                    <p className="text-[10px] text-stone-400">Kapasitas HP: {stats.maxHp} (+25)</p>
                  </div>
                </div>
                <span className="text-[10px] bg-stone-800 px-1.5 py-0.5 rounded text-stone-300">
                  Lv.{hpLevel}
                </span>
              </div>
              <button
                id="btn-upgrade-hp"
                disabled={stats.coins < hpCost}
                onClick={() => onUpgradeStat('maxHp', hpCost)}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  stats.coins >= hpCost
                    ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 active:scale-95'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                }`}
              >
                <span>Tingkatkan</span>
                <span className="text-[11px] font-mono">({hpCost} Keping)</span>
              </button>
            </div>

            {/* Attack Power Upgrade */}
            <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-950/70 border border-amber-800/50 rounded-lg text-amber-400">
                    <Swords className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-200">Ketajaman Keris</h4>
                    <p className="text-[10px] text-stone-400">Serangan: {stats.attackPower} (+6)</p>
                  </div>
                </div>
                <span className="text-[10px] bg-stone-800 px-1.5 py-0.5 rounded text-stone-300">
                  Lv.{atkLevel}
                </span>
              </div>
              <button
                id="btn-upgrade-attack"
                disabled={stats.coins < atkCost}
                onClick={() => onUpgradeStat('attackPower', atkCost)}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  stats.coins >= atkCost
                    ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 active:scale-95'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                }`}
              >
                <span>Tingkatkan</span>
                <span className="text-[11px] font-mono">({atkCost} Keping)</span>
              </button>
            </div>

            {/* Max Energy / Prana Upgrade */}
            <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-cyan-950/70 border border-cyan-800/50 rounded-lg text-cyan-400">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-200">Tenaga Batin (Prana)</h4>
                    <p className="text-[10px] text-stone-400">Prana Maks: {stats.maxEnergy} (+20)</p>
                  </div>
                </div>
                <span className="text-[10px] bg-stone-800 px-1.5 py-0.5 rounded text-stone-300">
                  Lv.{energyLevel}
                </span>
              </div>
              <button
                id="btn-upgrade-prana"
                disabled={stats.coins < energyCost}
                onClick={() => onUpgradeStat('maxEnergy', energyCost)}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  stats.coins >= energyCost
                    ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 active:scale-95'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                }`}
              >
                <span>Tingkatkan</span>
                <span className="text-[11px] font-mono">({energyCost} Keping)</span>
              </button>
            </div>

            {/* Defense Upgrade */}
            <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-950/70 border border-emerald-800/50 rounded-lg text-emerald-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-200">Zirah Pelindung</h4>
                    <p className="text-[10px] text-stone-400">Ketahanan: {stats.defense} (+3)</p>
                  </div>
                </div>
                <span className="text-[10px] bg-stone-800 px-1.5 py-0.5 rounded text-stone-300">
                  Lv.{defLevel}
                </span>
              </div>
              <button
                id="btn-upgrade-defense"
                disabled={stats.coins < defCost}
                onClick={() => onUpgradeStat('defense', defCost)}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  stats.coins >= defCost
                    ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 active:scale-95'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                }`}
              >
                <span>Tingkatkan</span>
                <span className="text-[11px] font-mono">({defCost} Keping)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Button: Lanjutkan Perjalanan */}
        <div className="pt-2 border-t border-stone-800 flex justify-end">
          <button
            id="btn-resume-from-checkpoint"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold rounded-xl shadow-lg border border-amber-400 active:scale-95 transition-all cursor-pointer text-sm"
          >
            Lanjutkan Perjalanan Benteng
          </button>
        </div>
      </div>
    </div>
  );
};

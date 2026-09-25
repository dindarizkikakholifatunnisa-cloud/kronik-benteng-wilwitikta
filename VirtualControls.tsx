import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Swords, Shield, Zap, Sparkles, Target, BookOpen } from 'lucide-react';
import { Checkpoint, HistoricalArtifact } from '../types';

interface VirtualControlsProps {
  onStartMoveLeft: () => void;
  onStopMoveLeft: () => void;
  onStartMoveRight: () => void;
  onStopMoveRight: () => void;
  onJump: () => void;
  onAttack: () => void;
  onShoot: () => void;
  onBlockStart: () => void;
  onBlockEnd: () => void;
  onDash: () => void;
  nearCheckpoint: Checkpoint | null;
  onInteractCheckpoint: () => void;
  nearArtifact?: HistoricalArtifact | null;
  onInteractArtifact?: () => void;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({
  onStartMoveLeft,
  onStopMoveLeft,
  onStartMoveRight,
  onStopMoveRight,
  onJump,
  onAttack,
  onShoot,
  onBlockStart,
  onBlockEnd,
  onDash,
  nearCheckpoint,
  onInteractCheckpoint,
  nearArtifact,
  onInteractArtifact,
}) => {
  return (
    <div id="virtual-controls" className="lg:hidden absolute bottom-3 inset-x-3 pointer-events-none z-30 flex justify-between items-end pb-1 select-none">
      {/* Left Pad: Directional buttons */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          id="btn-touch-left"
          onTouchStart={(e) => { e.preventDefault(); onStartMoveLeft(); }}
          onTouchEnd={(e) => { e.preventDefault(); onStopMoveLeft(); }}
          onMouseDown={onStartMoveLeft}
          onMouseUp={onStopMoveLeft}
          className="w-14 h-14 bg-stone-900/80 active:bg-amber-600/60 border-2 border-stone-700 active:border-amber-400 rounded-2xl flex items-center justify-center text-amber-200 shadow-xl backdrop-blur-sm touch-none"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <button
          id="btn-touch-right"
          onTouchStart={(e) => { e.preventDefault(); onStartMoveRight(); }}
          onTouchEnd={(e) => { e.preventDefault(); onStopMoveRight(); }}
          onMouseDown={onStartMoveRight}
          onMouseUp={onStopMoveRight}
          className="w-14 h-14 bg-stone-900/80 active:bg-amber-600/60 border-2 border-stone-700 active:border-amber-400 rounded-2xl flex items-center justify-center text-amber-200 shadow-xl backdrop-blur-sm touch-none"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      {/* Center: Checkpoint Quick Button if near */}
      {nearCheckpoint && (
        <button
          id="btn-touch-checkpoint"
          onTouchStart={(e) => { e.preventDefault(); onInteractCheckpoint(); }}
          onClick={onInteractCheckpoint}
          className="pointer-events-auto mb-2 px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-700 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg border border-amber-300 animate-bounce active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>Istirahat Checkpoint</span>
        </button>
      )}

      {/* Center: Artifact Quick Button if near */}
      {nearArtifact && !nearCheckpoint && onInteractArtifact && (
        <button
          id="btn-touch-artifact"
          onTouchStart={(e) => { e.preventDefault(); onInteractArtifact(); }}
          onClick={onInteractArtifact}
          className="pointer-events-auto mb-2 px-3 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg border border-yellow-200 animate-bounce active:scale-95"
        >
          <BookOpen className="w-4 h-4" />
          <span>Buka Artefak & Kuis</span>
        </button>
      )}

      {/* Right Pad: Actions (Jump, Attack, Shoot, Block, Dash) */}
      <div className="flex flex-col items-end gap-2 pointer-events-auto">
        {/* Top action row */}
        <div className="flex items-center gap-2">
          {/* Dash */}
          <button
            id="btn-touch-dash"
            onTouchStart={(e) => { e.preventDefault(); onDash(); }}
            onClick={onDash}
            className="w-11 h-11 bg-stone-900/80 active:bg-amber-600/60 border border-stone-700 active:border-amber-400 rounded-xl flex items-center justify-center text-amber-300 shadow-md backdrop-blur-sm touch-none"
            title="Dash"
          >
            <Zap className="w-5 h-5" />
          </button>

          {/* Block / Shield */}
          <button
            id="btn-touch-block"
            onTouchStart={(e) => { e.preventDefault(); onBlockStart(); }}
            onTouchEnd={(e) => { e.preventDefault(); onBlockEnd(); }}
            onMouseDown={onBlockStart}
            onMouseUp={onBlockEnd}
            className="w-11 h-11 bg-stone-900/80 active:bg-blue-600/60 border border-stone-700 active:border-blue-400 rounded-xl flex items-center justify-center text-blue-300 shadow-md backdrop-blur-sm touch-none"
            title="Tangkis"
          >
            <Shield className="w-5 h-5" />
          </button>

          {/* Shoot Panah Gandewa */}
          <button
            id="btn-touch-shoot"
            onTouchStart={(e) => { e.preventDefault(); onShoot(); }}
            onClick={onShoot}
            className="w-11 h-11 bg-stone-900/80 active:bg-cyan-600/60 border border-stone-700 active:border-cyan-400 rounded-xl flex items-center justify-center text-cyan-300 shadow-md backdrop-blur-sm touch-none"
            title="Panah Gandewa"
          >
            <Target className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom major action row */}
        <div className="flex items-center gap-2">
          {/* Attack Keris */}
          <button
            id="btn-touch-attack"
            onTouchStart={(e) => { e.preventDefault(); onAttack(); }}
            onClick={onAttack}
            className="w-14 h-14 bg-gradient-to-br from-amber-600 to-amber-800 active:brightness-125 border-2 border-amber-400 rounded-2xl flex items-center justify-center text-amber-100 shadow-xl touch-none active:scale-95"
            title="Serang Keris"
          >
            <Swords className="w-7 h-7" />
          </button>

          {/* Jump */}
          <button
            id="btn-touch-jump"
            onTouchStart={(e) => { e.preventDefault(); onJump(); }}
            onClick={onJump}
            className="w-14 h-14 bg-stone-800/90 active:bg-amber-600/70 border-2 border-stone-600 active:border-amber-400 rounded-2xl flex items-center justify-center text-amber-200 shadow-xl touch-none active:scale-95"
            title="Lompat"
          >
            <ArrowUp className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};

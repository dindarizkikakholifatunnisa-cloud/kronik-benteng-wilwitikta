import React, { useState } from 'react';
import { HistoricalArtifact } from '../types';
import { sound } from '../utils/audio';
import { BookOpen, Sparkles, Award, CheckCircle2, XCircle, ChevronRight, Flame, ShieldAlert, X } from 'lucide-react';

interface ArtifactQuizModalProps {
  artifact: HistoricalArtifact;
  onSolveQuiz: (artifactId: string, coinsAwarded: number) => void;
  onClose: () => void;
}

export const ArtifactQuizModal: React.FC<ArtifactQuizModalProps> = ({
  artifact,
  onSolveQuiz,
  onClose,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswered) return;
    const correct = selectedOption === artifact.quiz.correctIndex;
    setIsAnswered(true);
    setIsCorrect(correct);

    if (correct) {
      sound.playSuccess();
      onSolveQuiz(artifact.id, 10);
    } else {
      sound.playHurt();
    }
  };

  const handleRetry = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
  };

  const getArtifactIcon = () => {
    switch (artifact.imageType) {
      case 'lontar':
        return '📜';
      case 'keris':
        return '🗡️';
      case 'panji':
        return '🚩';
      case 'arca':
        return '🗿';
      case 'genta':
        return '🔔';
      default:
        return '🏛️';
    }
  };

  return (
    <div
      id="artifact-quiz-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-2xl bg-stone-900/95 border-2 border-amber-600/80 rounded-3xl p-5 md:p-7 shadow-2xl text-stone-100 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          id="btn-close-artifact-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Artifact Badge */}
        <div className="flex items-start gap-4 pb-4 border-b border-stone-800">
          <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-amber-600/30 via-amber-800/40 to-stone-950 border border-amber-500/50 flex items-center justify-center text-3xl shadow-inner">
            {getArtifactIcon()}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Artefak Masa Lalu • Lantai {artifact.floor}
              </span>
              <span className="text-[10px] text-stone-400 bg-stone-800/80 px-2 py-0.5 rounded-md">
                {artifact.era}
              </span>
              {artifact.solved && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Kuis Telah Dipecahkan
                </span>
              )}
            </div>
            <h2 className="font-serif text-xl md:text-2xl font-bold text-amber-100">
              {artifact.name}
            </h2>
          </div>
        </div>

        {/* Historical Education Section */}
        <div className="my-4 p-3.5 bg-stone-950/70 border border-amber-900/40 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Kronik Edukasi Sejarah Nusantara</span>
          </div>
          <p className="text-xs md:text-sm text-stone-300 leading-relaxed font-sans">
            {artifact.historicalLore}
          </p>
        </div>

        {/* Quiz Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm md:text-base font-bold text-amber-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Teka-Teki Kuis Sejarah
            </h3>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              Hadiah: +10 Koin Pengetahuan
            </span>
          </div>

          <p className="text-xs md:text-sm font-semibold text-stone-100 bg-stone-800/60 p-3 rounded-xl border border-stone-700">
            {artifact.quiz.question}
          </p>

          {/* Options */}
          <div className="space-y-2">
            {artifact.quiz.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              let btnClass = 'bg-stone-800/70 hover:bg-stone-750 border-stone-700 text-stone-200';

              if (isAnswered) {
                if (idx === artifact.quiz.correctIndex) {
                  btnClass = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                } else if (isSelected && !isCorrect) {
                  btnClass = 'bg-red-950/80 border-red-500 text-red-200 line-through';
                }
              } else if (isSelected) {
                btnClass = 'bg-amber-600/30 border-amber-500 text-amber-100 font-semibold ring-1 ring-amber-500';
              }

              const letters = ['A', 'B', 'C', 'D'];

              return (
                <button
                  key={idx}
                  id={`quiz-option-${idx}`}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered && isCorrect}
                  className={`w-full p-3 rounded-xl border text-left text-xs md:text-sm transition-all flex items-center gap-3 cursor-pointer ${btnClass}`}
                >
                  <span className="w-6 h-6 shrink-0 rounded-lg bg-stone-900/90 border border-stone-700 flex items-center justify-center font-bold text-xs text-amber-300">
                    {letters[idx]}
                  </span>
                  <span className="flex-1">{option}</span>
                  {isAnswered && idx === artifact.quiz.correctIndex && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Answer Feedback & Explanation */}
          {isAnswered && (
            <div
              className={`p-3.5 rounded-2xl border ${
                isCorrect
                  ? 'bg-emerald-950/60 border-emerald-600/70 text-emerald-100'
                  : 'bg-red-950/60 border-red-700/70 text-red-100'
              } space-y-1.5 animate-fade-in`}
            >
              <div className="flex items-center gap-2 font-bold text-xs md:text-sm">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Jawaban Tepat! Memperoleh +10 Koin Pengetahuan!</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span>Jawaban Belum Tepat. Resi Vidyadhara mengajak merenung kembali:</span>
                  </>
                )}
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                {artifact.quiz.explanation}
              </p>
              {isCorrect && (
                <div className="text-[11px] text-amber-300 flex items-center gap-1.5 pt-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Berkas cahaya suci artefak juga memulihkan +15% Minyak Lentera Obor!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="mt-5 pt-3 border-t border-stone-800 flex items-center justify-between gap-3">
          <div className="text-[11px] text-stone-400">
            Resi Vidyadhara: <span className="italic">"Pengetahuan adalah perisai paling kokoh menembus tirai kegelapan."</span>
          </div>

          <div className="flex items-center gap-2">
            {isAnswered && !isCorrect && (
              <button
                id="btn-retry-quiz"
                onClick={handleRetry}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
              >
                Coba Lagi
              </button>
            )}

            {!isAnswered ? (
              <button
                id="btn-submit-quiz"
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null}
                className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all ${
                  selectedOption !== null
                    ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md active:scale-95'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                }`}
              >
                <span>Periksa Jawaban</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                id="btn-finish-quiz"
                onClick={onClose}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl cursor-pointer transition-all shadow-md active:scale-95"
              >
                Lanjutkan Petualangan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

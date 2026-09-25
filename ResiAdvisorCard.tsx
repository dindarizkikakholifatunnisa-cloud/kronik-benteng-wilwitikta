import React, { useState, useEffect } from 'react';
import { PlayerStats, Checkpoint, HistoricalArtifact, CastleBarricade } from '../types';
import { Sparkles, MessageCircle, X, Flame, ShieldAlert, BookOpen, AlertTriangle } from 'lucide-react';

interface ResiAdvisorCardProps {
  stats: PlayerStats;
  nearCheckpoint: Checkpoint | null;
  nearArtifact: HistoricalArtifact | null;
  barricade?: CastleBarricade;
  currentFloor: number;
  isBossFight: boolean;
  bossName?: string;
  isManualOpen: boolean;
  onCloseManual: () => void;
}

export const ResiAdvisorCard: React.FC<ResiAdvisorCardProps> = ({
  stats,
  nearCheckpoint,
  nearArtifact,
  barricade,
  currentFloor,
  isBossFight,
  bossName,
  isManualOpen,
  onCloseManual,
}) => {
  const [autoMessage, setAutoMessage] = useState<{ text: string; urgent: boolean; tag: string } | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [lastTriggerTag, setLastTriggerTag] = useState<string>('');

  // Determine current contextual advice
  useEffect(() => {
    let msg: { text: string; urgent: boolean; tag: string } | null = null;

    if (stats.lanternFuel <= 20) {
      msg = {
        tag: 'low_lantern',
        urgent: true,
        text: 'Arya Sena muridku! Minyak lenteramu hampir padam! Di Benteng Wilwatikta, kegelapan adalah kutukan maut. Kalahkan prajurit zirah bayangan untuk merebut pasokan minyak!',
      };
    } else if (stats.stamina <= 10) {
      msg = {
        tag: 'low_stamina',
        urgent: true,
        text: 'Napas ragamu tersengal, stamina terkuras! Mundur sejenak agar staminamu pulih. Jangan memaksakan tebasan saat terkepung!',
      };
    } else if (barricade && barricade.hp <= 35) {
      msg = {
        tag: 'low_barricade',
        urgent: true,
        text: 'Gawat! Barikade benteng di belakangmu sedang dihantam prajurit musuh! Segera kembali dan pertahankan gerbang sebelum pertahanan runtuh!',
      };
    } else if (isBossFight) {
      msg = {
        tag: 'boss_fight',
        urgent: true,
        text: `Pertarungan pangeran kegelapan ${bossName || 'Musuh Utama'} telah dimulai! Waspadai tebasan maut dan gelombang kobaran api dengan melompat tinggi!`,
      };
    } else if (nearArtifact && !nearArtifact.solved) {
      msg = {
        tag: `artifact_${nearArtifact.id}`,
        urgent: false,
        text: `Kau mendekati pusaka suci: ${nearArtifact.name}. Sentuh prasasti [E] dan pecahkan kuis sejarah untuk memetik 10 koin pengetahuan leluhur!`,
      };
    } else if (nearCheckpoint) {
      msg = {
        tag: `cp_${nearCheckpoint.id}`,
        urgent: false,
        text: nearCheckpoint.resiAdvice || 'Prasasti Surya Majapahit menyinari langkahmu. Beristirahatlah sejenak untuk memulihkan raga dan memperkuat pusaka kerismu.',
      };
    }

    if (msg) {
      if (msg.tag !== lastTriggerTag) {
        setLastTriggerTag(msg.tag);
        setAutoMessage(msg);
        setIsDismissed(false);
      }
    } else {
      // Clear alert when state is back to normal
      if (lastTriggerTag.startsWith('low_') || lastTriggerTag === 'boss_fight') {
        setAutoMessage(null);
        setLastTriggerTag('');
      }
    }
  }, [stats.lanternFuel, stats.stamina, barricade?.hp, isBossFight, bossName, nearArtifact?.id, nearCheckpoint?.id, lastTriggerTag]);

  // Floor lore fallback for manual inspection
  const getFloorWisdom = () => {
    switch (currentFloor) {
      case 1:
        return 'Penjara bawah tanah bata merah menyimpan jejak pendirian Majapahit oleh Raden Wijaya. Pelajari Prasasti Kudadu untuk memahami asal-usul tanah Wilwatikta.';
      case 2:
        return 'Balairung Sasana Benteng adalah benteng lapis kedua. Jagalah barikade gerbang agar pasukan bayangan tak menguasai takhta tengah!';
      case 3:
        return 'Perpustakaan Lontar dan Altar Pusaka menyimpan ikrar sakral Sumpah Palapa oleh Mahapatih Gajah Mada demi menyatukan Nusantara.';
      case 4:
        return 'Menara Pengintai Langit dipenuhi pemanah berzirah bayangan. Gunakan perisai Surya Majapahit untuk menepis hujan panah beracun.';
      case 5:
        return 'Puncak Menara Mahkota Wilwatikta adalah sarang Avatar Angkara Dahana. Hanya ksatria berpengetahuan dan tangguh yang mampu menumpas api angkara!';
      default:
        return 'Ksatria sejati senantiasa memadukan ketangkasan keris dengan keluhuran budi dan pemahaman sejarah leluhur.';
    }
  };

  const showDialogue = isManualOpen || (autoMessage && !isDismissed);

  if (!showDialogue) return null;

  const isUrgent = autoMessage?.urgent && !isManualOpen;
  const currentText = isManualOpen ? getFloorWisdom() : (autoMessage?.text || getFloorWisdom());

  return (
    <div
      id="resi-vidyadhara-advisor-card"
      className="fixed bottom-24 md:bottom-16 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-xl pointer-events-auto animate-fade-in"
    >
      <div
        className={`relative rounded-2xl p-3.5 md:p-4 shadow-2xl backdrop-blur-xl border-2 flex items-start gap-3.5 transition-all ${
          isUrgent
            ? 'bg-stone-900/95 border-red-500/90 shadow-[0_0_25px_rgba(239,68,68,0.35)]'
            : 'bg-stone-900/95 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
        }`}
      >
        {/* Resi Vidyadhara Portrait Avatar */}
        <div className="relative shrink-0">
          <div className="w-13 h-13 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-amber-700 via-amber-900 to-stone-950 border-2 border-amber-400/80 flex items-center justify-center text-2xl shadow-inner">
            🧙‍♂️
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border border-stone-950 flex items-center justify-center text-[10px] text-stone-950 font-bold shadow">
            ✨
          </div>
        </div>

        {/* Dialogue Message */}
        <div className="flex-1 space-y-1 pr-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-serif font-bold text-xs md:text-sm text-amber-200 flex items-center gap-1.5">
              Resi Vidyadhara
            </span>
            <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Penasehat & Guru Agung
            </span>
            {isUrgent && (
              <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-500 animate-pulse flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                Peringatan Darurat
              </span>
            )}
          </div>

          <p className="text-xs md:text-sm text-stone-200 leading-relaxed font-sans font-medium">
            "{currentText}"
          </p>

          <div className="pt-1 flex items-center justify-between text-[10px] text-stone-400">
            <span className="italic text-amber-400/80">Lantai {currentFloor} • Benteng Wilwatikta</span>
            <span className="text-stone-400">Ketuk tanda silang untuk menutup</span>
          </div>
        </div>

        {/* Close / Dismiss Button */}
        <button
          id="btn-dismiss-resi-advice"
          onClick={() => {
            if (isManualOpen) {
              onCloseManual();
            } else {
              setIsDismissed(true);
            }
          }}
          className="absolute top-2.5 right-2.5 p-1 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
          title="Tutup Nasihat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

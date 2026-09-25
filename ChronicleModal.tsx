import React from 'react';
import { X, BookOpen, Shield, Flame, MapPin, Sparkles } from 'lucide-react';

interface ChronicleModalProps {
  onClose: () => void;
}

export const ChronicleModal: React.FC<ChronicleModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-stone-900 border-2 border-amber-700/80 rounded-2xl p-5 md:p-8 shadow-2xl overflow-y-auto flex flex-col gap-4 text-stone-200">
        {/* Close Button */}
        <button
          id="btn-close-chronicle-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-amber-200 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center border-b border-amber-800/40 pb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-950/80 border border-amber-600 text-amber-400 mb-2">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-amber-200 tracking-wide">
            Kronik Benteng Wilwatikta
          </h2>
          <p className="text-xs text-amber-400/90 font-mono mt-1">
            Prasasti Catatan Ksatria Bhayangkara & Perjuangan Majapahit
          </p>
        </div>

        {/* Content sections */}
        <div className="space-y-4 text-xs md:text-sm leading-relaxed text-stone-300">
          {/* Section 1: Latar Belakang */}
          <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4">
            <h3 className="font-serif font-bold text-amber-300 text-sm md:text-base flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-amber-400" />
              Latar Belakang: Benteng Ibu Kota Wilwatikta
            </h3>
            <p>
              Wilwatikta—nama agung dalam bahasa Sansekerta dan Kawi untuk Kerajaan Majapahit—dikelilingi oleh benteng-benteng kokoh dari bata merah Trowulan, kanal-kanal air, dan gerbang paduraksa suci. Ketika faksi pemberontak mengancam kedaulatan takhta, pasukan elit <b>Bhayangkara</b> ditugaskan mengawal benteng dan memulihkan ketertiban kerajaan.
            </p>
          </div>

          {/* Section 2: Sistem Checkpoint Suci */}
          <div className="bg-stone-950/60 border border-amber-900/50 rounded-xl p-4">
            <h3 className="font-serif font-bold text-amber-300 text-sm md:text-base flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              Sistem Checkpoint (Prasasti & Pos Suci)
            </h3>
            <p className="mb-2">
              Di sepanjang benteng, terdapat <b>Prasasti Batu & Panji Surya Majapahit</b> yang berfungsi sebagai titik aman (checkpoint):
            </p>
            <ul className="list-disc list-inside space-y-1 text-stone-300 pl-1">
              <li>
                <b className="text-amber-200">Aktivasi Otomatis:</b> Begitu prajurit Bhayangkara melewati prasasti, titik respawn akan tercatat dan berkas cahaya Surya Majapahit menyala.
              </li>
              <li>
                <b className="text-amber-200">Bangkit dari Gugur:</b> Bila prajurit kehabisan Darah (HP), Anda dapat bangkit kembali di Checkpoint terakhir tanpa harus mengulang bab dari awal.
              </li>
              <li>
                <b className="text-amber-200">Istirahat & Berkah:</b> Tekan <b>[E]</b> di dekat checkpoint untuk memulihkan seluruh HP dan Prana, serta meningkatkan pusaka menggunakan Keping Emas Wilwatikta.
              </li>
              <li>
                <b className="text-amber-200">Penyimpanan Terpadu:</b> Posisi checkpoint Anda tersimpan di memori perangkat, sehingga Anda dapat melanjutkan petualangan kapan saja dari menu utama.
              </li>
            </ul>
          </div>

          {/* Section 3: Ajaran Satya Haprabu */}
          <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4">
            <h3 className="font-serif font-bold text-amber-300 text-sm md:text-base flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Empat Sumpah Bhayangkara (Catur Prasetya)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-stone-900/70 p-2.5 rounded-lg border border-stone-800">
                <span className="font-bold text-amber-300 block mb-0.5">1. Satya Haprabu</span>
                Setia dan patuh seutuhnya kepada pemimpin dan negara Wilwatikta.
              </div>
              <div className="bg-stone-900/70 p-2.5 rounded-lg border border-stone-800">
                <span className="font-bold text-amber-300 block mb-0.5">2. Hanyaken Musuh</span>
                Mengenyahkan segala musuh yang mengancam ketenteraman rakyat.
              </div>
              <div className="bg-stone-900/70 p-2.5 rounded-lg border border-stone-800">
                <span className="font-bold text-amber-300 block mb-0.5">3. Gineung Pratidina</span>
                Bertekad menegakkan kebenaran setiap hari tanpa rasa takut.
              </div>
              <div className="bg-stone-900/70 p-2.5 rounded-lg border border-stone-800">
                <span className="font-bold text-amber-300 block mb-0.5">4. Tan Satrisna</span>
                Tidak terikat oleh kepentingan pribadi demi kejayaan kerajaan.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-800 flex justify-end">
          <button
            id="btn-close-chronicle-bottom"
            onClick={onClose}
            className="px-6 py-2 bg-stone-800 hover:bg-stone-700 text-amber-200 font-semibold rounded-xl transition-all cursor-pointer text-xs md:text-sm"
          >
            Tutup Kronik
          </button>
        </div>
      </div>
    </div>
  );
};

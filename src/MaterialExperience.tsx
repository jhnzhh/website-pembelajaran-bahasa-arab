import { useEffect, useMemo, useRef, useState } from "react";
import correctAudioUrl from "./imports/correct.mp3";
import wrongAudioUrl from "./imports/wrong.mp3";
import situasi1AudioUrl from "./audio/situasi-1.mp3";
import situasi2AudioUrl from "./audio/situasi-2.mp3";
import situasi3AudioUrl from "./audio/situasi-3.mp3";
import situasi4AudioUrl from "./audio/situasi-4.mp3";
import warnaPutihAudioUrl from "./audio/warna-putih.mp3";
import warnaHitamAudioUrl from "./audio/warna-hitam.mp3";
import warnaMerahAudioUrl from "./audio/warna-merah.mp3";
import warnaKuningAudioUrl from "./audio/warna-kuning.mp3";
import warnaHijauAudioUrl from "./audio/warna-hijau.mp3";
import warnaBiruAudioUrl from "./audio/warna-biru.mp3";
import warnaCokelatAudioUrl from "./audio/warna-cokelat.mp3";
import warnaUnguAudioUrl from "./audio/warna-ungu.mp3";
import konteksPutihAudioUrl from "./audio/konteks-nyata-warna-putih.mp3";
import konteksHitamAudioUrl from "./audio/konteks-nyata-warna-hitam.mp3";
import konteksMerahAudioUrl from "./audio/konteks-nyata-warna-merah.mp3";
import konteksKuningAudioUrl from "./audio/konteks-nyata-warna-kuning.mp3";
import konteksHijauAudioUrl from "./audio/konteks-nyata-warna-hijau.mp3";
import konteksBiruAudioUrl from "./audio/konteks-nyata-warna-biru.mp3";
import konteksCokelatAudioUrl from "./audio/konteks-nyata-warna-cokelat.mp3";
import konteksUnguAudioUrl from "./audio/konteks-nyata-warna-ungu.mp3";
import istimaAudioUrl from "./audio/istima.mp3";
import istimaAyyamAudioUrl from "./audio/istima-al-ayyam.mp3";
import istimaAlwanAudioUrl from "./audio/istima-alwan.mp3";
import { claimAudioPlayback, playExclusiveAudio, stopExclusiveAudio } from "./audioPlayback";
import istimaTaarufIllustration from "./imports/ISTIMA_TAARUF_ILLUSTRATION.jpeg";
import istimaAlwanIllustration from "./imports/ISTIMA_ALWAN_ILLUSTRATION.jpeg";
import situasi1Illustration from "./imports/SITUASI_1_ILLUSTRATION.jpeg";
import situasi2Illustration from "./imports/SITUASI_2_ILLUSTRATION.jpeg";
import situasi3Illustration from "./imports/SITUASI_3_ILLUSTRATION.jpeg";
import situasi4Illustration from "./imports/SITUASI_4_ILLUSTRATION.jpeg";
import tebakGambar1 from "./imports/TEBAK_GAMBAR_1.jpeg";
import tebakGambar2 from "./imports/TEBAK_GAMBAR_2.jpeg";
import tebakGambar3 from "./imports/TEBAK_GAMBAR_3.jpeg";

export type MaterialId = "taaruf" | "ayyam" | "alwan";
export type LearningPage = "mindful" | "meaningful" | "listening" | "speaking" | "writing" | "joyful" | "evaluation" | "reflection" | "result";
export type MindfulAnswer = { experience: "yes" | "no"; memory?: string; guess?: string };

type VocabItem = {
  arabic: string;
  feminine?: string;
  meaning: string;
  example: string;
  translation: string;
  color?: string;
};

const META = {
  taaruf: { arabic: "التَّعَارُفُ", title: "Perkenalan", short: "Ta'aruf" },
  ayyam: { arabic: "الْأَيَّامُ", title: "Hari-hari dalam Seminggu", short: "Al-Ayyam" },
  alwan: { arabic: "الْأَلْوَانُ", title: "Warna", short: "Al-Alwan" },
};

const COLORS: VocabItem[] = [
  { arabic: "أَبْيَضُ", feminine: "بَيْضَاءُ", meaning: "Putih", example: "لَوْنُ قَمِيصِي أَبْيَضُ.", translation: "Warna bajuku putih.", color: "#f8fafc" },
  { arabic: "أَسْوَدُ", feminine: "سَوْدَاءُ", meaning: "Hitam", example: "حَقِيبَتِي سَوْدَاءُ.", translation: "Tasku berwarna hitam.", color: "#1f2937" },
  { arabic: "أَحْمَرُ", feminine: "حَمْرَاءُ", meaning: "Merah", example: "التُّفَّاحَةُ حَمْرَاءُ.", translation: "Apel itu berwarna merah.", color: "#ef4444" },
  { arabic: "أَزْرَقُ", feminine: "زَرْقَاءُ", meaning: "Biru", example: "السَّمَاءُ زَرْقَاءُ.", translation: "Langit berwarna biru.", color: "#3b82f6" },
  { arabic: "أَخْضَرُ", feminine: "خَضْرَاءُ", meaning: "Hijau", example: "أَوْرَاقُ الشَّجَرَةِ خَضْرَاءُ.", translation: "Daun pohon itu berwarna hijau.", color: "#22c55e" },
  { arabic: "أَصْفَرُ", feminine: "صَفْرَاءُ", meaning: "Kuning", example: "الْمَوْزَةُ صَفْرَاءُ.", translation: "Pisang itu berwarna kuning.", color: "#facc15" },
  { arabic: "أَسْمَرُ", feminine: "سَمْرَاءُ", meaning: "Cokelat", example: "لَوْنُ الْحِذَاءِ أَسْمَرُ.", translation: "Warna sepatu itu cokelat.", color: "#92400e" },
  { arabic: "بَنَفْسَجِيٌّ", feminine: "بَنَفْسَجِيَّةٌ", meaning: "Ungu", example: "الْعِنَبُ بَنَفْسَجِيٌّ.", translation: "Anggur berwarna ungu.", color: "#a855f7" },
];

const ALWAN_AUDIO: Record<string, { vocabulary: string; context: string }> = {
  Putih: { vocabulary: warnaPutihAudioUrl, context: konteksPutihAudioUrl },
  Hitam: { vocabulary: warnaHitamAudioUrl, context: konteksHitamAudioUrl },
  Merah: { vocabulary: warnaMerahAudioUrl, context: konteksMerahAudioUrl },
  Kuning: { vocabulary: warnaKuningAudioUrl, context: konteksKuningAudioUrl },
  Hijau: { vocabulary: warnaHijauAudioUrl, context: konteksHijauAudioUrl },
  Biru: { vocabulary: warnaBiruAudioUrl, context: konteksBiruAudioUrl },
  Cokelat: { vocabulary: warnaCokelatAudioUrl, context: konteksCokelatAudioUrl },
  Ungu: { vocabulary: warnaUnguAudioUrl, context: konteksUnguAudioUrl },
};

const DAYS: VocabItem[] = [
  { arabic: "يَوْمُ الْأَحَدِ", meaning: "Hari Minggu", example: "نَبْدَأُ الْأُسْبُوعَ فِي يَوْمِ الْأَحَدِ.", translation: "Kami memulai pekan pada hari Minggu." },
  { arabic: "يَوْمُ الِاثْنَيْنِ", meaning: "Hari Senin", example: "نَذْهَبُ إِلَى الْمَدْرَسَةِ فِي يَوْمِ الِاثْنَيْنِ.", translation: "Kami pergi ke sekolah pada hari Senin." },
  { arabic: "يَوْمُ الثُّلَاثَاءِ", meaning: "Hari Selasa", example: "أَدْرُسُ الرِّيَاضِيَّاتِ فِي يَوْمِ الثُّلَاثَاءِ.", translation: "Aku belajar matematika pada hari Selasa." },
  { arabic: "يَوْمُ الْأَرْبِعَاءِ", meaning: "Hari Rabu", example: "نَلْعَبُ كُرَةَ الْقَدَمِ فِي يَوْمِ الْأَرْبِعَاءِ.", translation: "Kami bermain sepak bola pada hari Rabu." },
  { arabic: "يَوْمُ الْخَمِيسِ", meaning: "Hari Kamis", example: "أَقْرَأُ الْكُتُبَ فِي يَوْمِ الْخَمِيسِ.", translation: "Aku membaca buku pada hari Kamis." },
  { arabic: "يَوْمُ الْجُمُعَةِ", meaning: "Hari Jumat", example: "نَذْهَبُ إِلَى الْمَسْجِدِ فِي يَوْمِ الْجُمُعَةِ.", translation: "Kami pergi ke masjid pada hari Jumat." },
  { arabic: "يَوْمُ السَّبْتِ", meaning: "Hari Sabtu", example: "أَسْتَرِيحُ مَعَ الْعَائِلَةِ فِي يَوْمِ السَّبْتِ.", translation: "Aku beristirahat bersama keluarga pada hari Sabtu." },
  { arabic: "أَيُّ", meaning: "Apa / yang mana", example: "أَيُّ يَوْمٍ الْآنَ؟", translation: "Hari apa sekarang?" },
  { arabic: "الْآنَ", meaning: "Sekarang", example: "الْآنَ يَوْمُ الِاثْنَيْنِ.", translation: "Sekarang hari Senin." },
  { arabic: "أَمْسِ", meaning: "Kemarin", example: "أَمْسِ يَوْمُ الْأَحَدِ.", translation: "Kemarin hari Minggu." },
  { arabic: "أَوَّلُ أَمْسِ", meaning: "Kemarin lusa", example: "أَوَّلُ أَمْسِ يَوْمُ السَّبْتِ.", translation: "Kemarin lusa hari Sabtu." },
  { arabic: "غَدًا", meaning: "Besok", example: "غَدًا يَوْمُ الثُّلَاثَاءِ.", translation: "Besok hari Selasa." },
  { arabic: "بَعْدَ غَدٍ", meaning: "Besok lusa", example: "بَعْدَ غَدٍ يَوْمُ الْأَرْبِعَاءِ.", translation: "Besok lusa hari Rabu." },
];

function playFeedback(correct: boolean) {
  try {
    void new Audio(correct ? correctAudioUrl : wrongAudioUrl).play();
  } catch {
    // Feedback visual remains available when audio playback is blocked.
  }
}

const TAARUF_SITUATIONS = [
  { title: "Memperkenalkan Diri kepada Teman Baru", arabic: ["أَحْمَدُ: السَّلَامُ عَلَيْكُمْ، مَا اسْمُكَ؟", "عَلِيٌّ: وَعَلَيْكُمُ السَّلَامُ، اِسْمِي عَلِيٌّ. وَمَا اسْمُكَ؟", "أَحْمَدُ: اِسْمِي أَحْمَدُ."], meaning: ["Assalamu'alaikum, siapa namamu?", "Wa'alaikumussalam, namaku Ali. Siapa namamu?", "Namaku Ahmad."], context: "Ketika bertemu teman baru di kelas, siswa saling menanyakan nama dan memperkenalkan diri." },
  { title: "Menanyakan Kabar", arabic: ["أَحْمَدُ: كَيْفَ حَالُكَ يَا عَلِيُّ؟", "عَلِيٌّ: الْحَمْدُ لِلَّهِ، أَنَا بِخَيْرٍ، شُكْرًا. وَكَيْفَ حَالُكَ؟", "أَحْمَدُ: أَنَا بِخَيْرٍ أَيْضًا."], meaning: ["Bagaimana kabarmu, Ali?", "Alhamdulillah, aku baik, terima kasih. Bagaimana kabarmu?", "Aku juga baik."], context: "Ketika bertemu teman di sekolah, siswa saling menyapa dan menanyakan kabar." },
  { title: "Menanyakan Identitas dan Tempat Tinggal", arabic: ["أَحْمَدُ: مَا وَظِيفَتُكَ؟", "عَلِيٌّ: أَنَا تِلْمِيذٌ.", "أَحْمَدُ: أَيْنَ تَسْكُنُ الْآنَ؟", "عَلِيٌّ: أَسْكُنُ فِي جَاكَرْتَا."], meaning: ["Apa pekerjaanmu?", "Saya seorang siswa.", "Di mana kamu tinggal sekarang?", "Saya tinggal di Jakarta."], context: "Ketika berkenalan lebih lanjut, siswa dapat menanyakan identitas dan tempat tinggal temannya." },
  { title: "Menanyakan Alamat dan Sekolah", arabic: ["أَحْمَدُ: مَا عُنْوَانُكَ؟", "عَلِيٌّ: عُنْوَانِي شَارِعُ أَحْمَدَ يَانِي، رَقْمُ حَادِي عَشَرَ.", "أَحْمَدُ: أَيْنَ مَدْرَسَتُكَ؟", "عَلِيٌّ: مَدْرَسَتِي فِي سُودِيرْمَانَ."], meaning: ["Apa alamatmu?", "Alamatku Jalan Ahmad Yani nomor sebelas.", "Di mana sekolahmu?", "Sekolahku di Sudirman."], context: "Ketika bertukar informasi, siswa dapat menanyakan alamat dan lokasi sekolah temannya." },
];
const TAARUF_SITUATION_AUDIO = [situasi1AudioUrl, situasi2AudioUrl, situasi3AudioUrl, situasi4AudioUrl];

const DIALOGUES = {
  taaruf: [
    ["مَا اسْمُكَ؟", "Siapa namamu?"], ["اِسْمِي ...", "Namaku ..."],
    ["كَيْفَ حَالُكَ؟", "Bagaimana kabarmu?"], ["الْحَمْدُ لِلَّهِ، أَنَا بِخَيْرٍ، شُكْرًا.", "Alhamdulillah, aku baik, terima kasih."],
    ["مَا وَظِيفَتُكَ؟", "Apa pekerjaanmu?"], ["أَنَا تِلْمِيذٌ / تِلْمِيذَةٌ.", "Saya siswa / siswi."],
    ["أَيْنَ تَسْكُنُ الْآنَ؟", "Di mana kamu tinggal sekarang?"], ["أَسْكُنُ فِي جَاكَرْتَا.", "Saya tinggal di Jakarta."],
    ["مَا عُنْوَانُكَ؟", "Apa alamatmu?"], ["عُنْوَانِي شَارِعُ أَحْمَدَ يَانِي، رَقْمُ حَادِي عَشَرَ.", "Alamatku Jalan Ahmad Yani nomor sebelas."],
    ["أَيْنَ مَدْرَسَتُكَ؟", "Di mana sekolahmu?"], ["مَدْرَسَتِي فِي سُودِيرْمَانَ.", "Sekolahku di Sudirman."],
  ],
  ayyam: [
    ["أَيُّ يَوْمٍ الْآنَ؟", "Hari apa sekarang?"], ["الْآنَ يَوْمُ الِاثْنَيْنِ.", "Sekarang hari Senin."],
    ["أَيُّ يَوْمٍ أَمْسِ؟", "Hari apa kemarin?"], ["أَمْسِ يَوْمُ الْأَحَدِ.", "Kemarin hari Minggu."],
    ["أَيُّ يَوْمٍ أَوَّلُ أَمْسِ؟", "Hari apa kemarin lusa?"], ["أَوَّلُ أَمْسِ يَوْمُ السَّبْتِ.", "Kemarin lusa hari Sabtu."],
    ["أَيُّ يَوْمٍ غَدًا؟", "Hari apa besok?"], ["غَدًا يَوْمُ الثُّلَاثَاءِ.", "Besok hari Selasa."],
    ["أَيُّ يَوْمٍ بَعْدَ غَدٍ؟", "Hari apa besok lusa?"], ["بَعْدَ غَدٍ يَوْمُ الْأَرْبِعَاءِ.", "Besok lusa hari Rabu."],
  ],
  alwan: [
    ["هٰذِهِ حَقِيبَتِي.", "Ini tasku."], ["لَوْنُهَا أَسْوَدُ.", "Warnanya hitam."],
    ["فِيهَا كِتَابٌ أَبْيَضُ، وَقَلَمٌ أَزْرَقُ، وَدَفْتَرٌ أَحْمَرُ.", "Di dalamnya ada buku putih, pena biru, dan buku tulis merah."],
  ],
};

function Arabic({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span dir="rtl" className={className} style={{ fontFamily: "'Noto Naskh Arabic', Arial, serif" }}>{children}</span>;
}

function Shapes() {
  return <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
    <div className="absolute top-8 left-8 w-20 h-20 rounded-full bg-yellow-200 opacity-50" />
    <div className="absolute top-28 right-16 w-12 h-12 rotate-45 bg-pink-200 opacity-60" />
    <div className="absolute bottom-48 left-1/4 w-16 h-16 rounded-full bg-cyan-200 opacity-50" />
    <div className="absolute bottom-16 right-8 w-28 h-28 rounded-full bg-purple-200 opacity-40" />
    <div className="absolute top-1/2 left-4 w-10 h-10 rotate-12 bg-green-200 opacity-60" />
    <div className="absolute top-16 left-1/2 w-8 h-8 rounded-full bg-orange-200 opacity-50" />
    <div className="absolute bottom-1/3 right-1/3 w-12 h-12 rotate-45 bg-yellow-300 opacity-35" />
  </div>;
}

function Shell({ children, gradient = "from-indigo-50 to-purple-50" }: { children: React.ReactNode; gradient?: string }) {
  return <div className={`min-h-screen bg-gradient-to-br ${gradient} p-6 pt-20 pb-10`}><Shapes /><main className="relative z-10 max-w-lg mx-auto space-y-5">{children}</main></div>;
}

function Header({ icon, title, subtitle, gradient = "from-indigo-500 to-purple-600" }: { icon: string; title: React.ReactNode; subtitle: string; gradient?: string }) {
  return <div className={`bg-gradient-to-r ${gradient} rounded-3xl p-5 text-white text-center`}>
    <div className="text-3xl mb-1">{icon}</div><h2 className="text-2xl font-black" style={{ fontFamily: "Nunito, sans-serif" }}>{title}</h2>
    <p className="text-white/80 text-sm mt-1">{subtitle}</p>
  </div>;
}

function IllustrationSlot({ label, src }: { label: string; src?: string }) {
  return <div className={`rounded-2xl overflow-hidden border-2 border-cyan-100 shadow-sm bg-gradient-to-br from-cyan-50 to-indigo-50 min-h-40 flex flex-col items-center justify-center text-center ${src ? "p-3" : "p-5"}`}>
    {src ? <img src={src} alt={label} loading="lazy" decoding="async" className="block w-full max-h-64 object-contain" /> : <><div className="w-16 h-16 rounded-2xl border-2 border-dashed border-cyan-300 bg-white/80 flex items-center justify-center text-2xl text-cyan-500">▧</div><p className="text-xs text-gray-400 mt-1">Slot siap untuk ilustrasi terkait yang akan diunggah.</p></>}
    <p className="font-bold text-cyan-700 text-sm mt-3">{label}</p>
  </div>;
}

function ContinueButton({ onClick, children = "Lanjut →", disabled = false }: { onClick: () => void; children?: React.ReactNode; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-black text-lg shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100" style={{ fontFamily: "Nunito, sans-serif" }}>{children}</button>;
}

function AudioBox({ label, onComplete, src }: { label: string; onComplete?: () => void; src?: string }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [done, setDone] = useState(false);
  const [duration, setDuration] = useState(22);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) stopExclusiveAudio(audio);
    };
  }, [src]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!src || !audio) {
      setAudioError("Audio tidak tersedia.");
      return;
    }

    if (playing) {
      stopExclusiveAudio(audio);
      setPlaying(false);
      return;
    }
    if (done) {
      audio.currentTime = 0;
      setProgress(0);
      setDone(false);
    }
    audio.playbackRate = speed;
    setAudioError(null);
    try {
      await playExclusiveAudio(audio);
    } catch (error) {
      console.error("Audio gagal diputar:", error);
      setPlaying(false);
      setAudioError("Audio gagal diputar. Periksa koneksi, lalu coba lagi.");
    }
  };

  const replay = async () => {
    const audio = audioRef.current;
    if (!src || !audio) {
      setAudioError("Audio tidak tersedia.");
      return;
    }

    const shouldRetry = audioError !== null;
    stopExclusiveAudio(audio);
    audio.currentTime = 0;
    setProgress(0);
    setDone(false);
    audio.playbackRate = speed;
    setAudioError(null);
    if (shouldRetry) audio.load();
    try {
      await playExclusiveAudio(audio);
    } catch (error) {
      console.error("Audio gagal diputar:", error);
      setPlaying(false);
      setAudioError("Audio gagal diputar. Periksa koneksi, lalu coba lagi.");
    }
  };

  return <div className="bg-white rounded-2xl border-2 border-cyan-200 p-4 space-y-3">
    {src && <audio
      ref={audioRef}
      src={src}
      preload="auto"
      className="hidden"
      onLoadedMetadata={(event) => {
        const audio = event.currentTarget;
        if (Number.isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration);
      }}
      onTimeUpdate={(event) => {
        const audio = event.currentTarget;
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          setDuration(audio.duration);
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      }}
      onPlay={() => { setPlaying(true); setDone(false); }}
      onPause={() => setPlaying(false)}
      onEnded={(event) => {
        stopExclusiveAudio(event.currentTarget);
        setPlaying(false);
        setDone(true);
        setProgress(100);
        onComplete?.();
      }}
      onError={(event) => {
        console.error("Audio gagal dimuat:", src, event.currentTarget.error);
        setPlaying(false);
        setAudioError("Audio gagal dimuat. Periksa koneksi, lalu coba lagi.");
      }}
    />}
    <p className="text-xs font-bold text-cyan-600 font-body">{label}</p>
    <div className="h-3 bg-gray-100 rounded-full overflow-hidden cursor-pointer" onClick={(event) => {
      const audio = audioRef.current;
      if (!src || !audio || !Number.isFinite(audio.duration)) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100));
      audio.currentTime = (percent / 100) * audio.duration;
      setProgress(percent);
    }}><div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-100" style={{ width: `${progress}%` }} /></div>
    <div className="flex justify-between text-xs text-gray-400 font-body"><span>{Math.floor((progress / 100) * duration)} dtk</span><span>{Math.floor(duration)} dtk</span></div>
    <div className="flex items-center justify-center gap-3">
      <button aria-label="Putar ulang" onClick={replay} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 active:scale-90 transition-all">↩</button>
      <button aria-label={playing ? "Jeda audio" : "Putar audio"} onClick={toggle} className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl hover:scale-110 active:scale-95 transition-all shadow-md">{playing ? "⏸" : done ? "↺" : "▶"}</button>
      <div className="flex gap-1">{[0.75, 1, 1.25].map((value) => <button key={value} onClick={() => { setSpeed(value); if (audioRef.current) audioRef.current.playbackRate = value; }} className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${speed === value ? "bg-cyan-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{value}×</button>)}</div>
    </div>
    {playing && <div className="flex items-center justify-center gap-0.5 h-6">{[1, 2, 3, 4, 5, 6, 7].map((bar) => <div key={bar} className="w-1 bg-cyan-400 rounded-full animate-pulse" style={{ height: `${8 + (bar % 4) * 4}px`, animationDelay: `${bar * 70}ms` }} />)}</div>}
    {audioError && <div role="alert" className="space-y-2 text-center"><p className="text-sm font-bold text-red-600">{audioError}</p>{src && <button onClick={replay} className="rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100">Coba lagi</button>}</div>}
  </div>;
}

function ChoiceQuestion({ question, meaning, options, answer, onDone }: { question: string; meaning?: string; options: string[]; answer: string; onDone?: (correct: boolean) => void }) {
  const [chosen, setChosen] = useState<string | null>(null);
  const choose = (option: string) => {
    if (chosen) return;
    setChosen(option);
    const correct = option === answer;
    playFeedback(correct);
    onDone?.(correct);
  };
  return <div className="space-y-3">
    <div className="bg-white rounded-3xl border-2 border-cyan-200 p-5 text-center shadow-sm">
      <Arabic className="block text-2xl font-black text-gray-800">{question}</Arabic>
      {meaning && <p className="text-sm text-gray-500 mt-1">{meaning}</p>}
    </div>
    <div className="grid gap-2">{options.map((option) => {
      const correct = option === answer;
      return <button key={option} onClick={() => choose(option)} disabled={!!chosen} dir={/[؀-ۿ]/.test(option) ? "rtl" : "ltr"} className={`p-3 rounded-2xl border-2 font-bold transition-all ${!chosen ? "bg-white border-gray-200 hover:border-cyan-400" : correct ? "bg-green-100 border-green-400 text-green-700" : chosen === option ? "bg-red-100 border-red-400 text-red-700" : "bg-gray-50 border-gray-200 text-gray-300"}`} style={/[؀-ۿ]/.test(option) ? { fontFamily: "'Noto Naskh Arabic', Arial, serif" } : {}}>{option}</button>;
    })}</div>
    {chosen && <div className={`rounded-2xl p-3 text-center font-bold ${chosen === answer ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{chosen === answer ? "Benar!" : <>Jawaban benar: <Arabic>{answer}</Arabic></>}</div>}
  </div>;
}

function Recorder({ onSubmit }: { onSubmit: () => void }) {
  const [state, setState] = useState<"idle" | "requesting" | "recording" | "ready">("idle");
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
    const activeRecorder = recorder.current;
    if (activeRecorder && activeRecorder.state !== "inactive") {
      activeRecorder.ondataavailable = null;
      activeRecorder.onstop = null;
      activeRecorder.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);

  const start = async () => {
    setError(null);
    setState("requesting");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setState("idle");
      setError("Perekaman mikrofon tidak didukung. Gunakan browser terbaru melalui koneksi HTTPS.");
      return;
    }
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunks.current = [];
      const mimeType = typeof MediaRecorder.isTypeSupported === "function"
        ? ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type))
        : undefined;
      const activeRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.current = activeRecorder;
      activeRecorder.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      activeRecorder.onstop = () => {
        if (timer.current) clearInterval(timer.current);
        stream?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (!chunks.current.length) {
          setState("idle");
          setError("Tidak ada audio yang terekam. Periksa mikrofon, lalu coba lagi.");
          return;
        }
        const blob = new Blob(chunks.current, { type: activeRecorder.mimeType || chunks.current[0].type || "audio/webm" });
        const url = URL.createObjectURL(blob);
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = url;
        setAudioUrl(url);
        setState("ready");
      };
      activeRecorder.onerror = () => {
        if (timer.current) clearInterval(timer.current);
        stream?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setState("idle");
        setError("Perekaman terhenti karena kesalahan mikrofon. Coba lagi.");
      };
      activeRecorder.start();
      setSeconds(0);
      timer.current = window.setInterval(() => setSeconds((value) => value + 1), 1000);
      setState("recording");
    } catch (cause) {
      stream?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setState("idle");
      const name = cause instanceof DOMException ? cause.name : "";
      setError(name === "NotAllowedError" || name === "SecurityError"
        ? "Izin mikrofon ditolak. Izinkan akses mikrofon, lalu coba lagi."
        : name === "NotFoundError"
          ? "Mikrofon tidak ditemukan. Sambungkan mikrofon, lalu coba lagi."
          : cause instanceof Error ? `Perekaman gagal: ${cause.message}` : "Perekaman gagal. Periksa mikrofon dan coba lagi.");
    }
  };
  const stop = () => {
    if (recorder.current?.state === "recording") recorder.current.stop();
    else {
      if (timer.current) clearInterval(timer.current);
      setState("idle");
      setError("Perekaman tidak aktif. Mulai rekam lagi.");
    }
  };
  const reset = () => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
    setAudioUrl(null);
    setSeconds(0);
    setError(null);
    setState("idle");
  };
  return <div className="bg-white rounded-3xl border-2 border-rose-200 p-5 text-center space-y-3 shadow-md">
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
    <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center text-3xl ${state === "recording" ? "bg-red-500 text-white animate-pulse" : "bg-rose-100 text-rose-600"}`}>●</div>
    <div className="font-black text-gray-700">{state === "recording" ? `Merekam 00:${String(seconds).padStart(2, "0")}` : state === "ready" ? "Rekaman siap dikirim" : "Tekan untuk mulai merekam"}</div>
    {state === "idle" && <button onClick={start} className="w-full py-3 rounded-2xl bg-rose-500 text-white font-black">Mulai Rekam</button>}
    {state === "requesting" && <p role="status" className="text-sm font-bold text-rose-600">Meminta izin mikrofon...</p>}
    {state === "recording" && <button onClick={stop} className="w-full py-3 rounded-2xl bg-gray-800 text-white font-black">Berhenti</button>}
    {state === "ready" && <><audio controls src={audioUrl ?? undefined} className="w-full" onPlay={(event) => claimAudioPlayback(event.currentTarget)} onPause={(event) => stopExclusiveAudio(event.currentTarget)} onEnded={(event) => stopExclusiveAudio(event.currentTarget)} onError={() => setError("Rekaman tidak dapat diputar. Rekam ulang sebelum mengirim.")} /><div className="grid grid-cols-2 gap-2"><button onClick={reset} className="py-3 rounded-2xl bg-gray-100 font-bold text-gray-600">Rekam Lagi</button><button onClick={onSubmit} disabled={!audioUrl} className="py-3 rounded-2xl bg-green-500 text-white font-black disabled:opacity-40">Kirim</button></div></>}
  </div>;
}

export function MindfulMaterialPage({ material, onSave, onComplete }: { material: MaterialId; onSave: (answer: MindfulAnswer) => void; onComplete: () => void }) {
  const [experience, setExperience] = useState<"yes" | "no" | null>(null);
  const [memory, setMemory] = useState("");
  const [guess, setGuess] = useState("");
  const nextRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (experience) setTimeout(() => nextRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100); }, [experience]);
  const prompts = {
    taaruf: "Apa kosakata bahasa Arab yang masih kamu ingat tentang perkenalan?",
    ayyam: "Apa kosakata bahasa Arab tentang nama-nama hari yang masih kamu ingat?",
    alwan: "Kosakata warna dalam bahasa Arab apa saja yang masih kamu ingat?",
  };
  return <Shell><Header icon="🧠" title="Mindful Learning" subtitle="Mari aktifkan pengetahuan awalmu sebelum belajar." />
    <div className="bg-white rounded-3xl shadow-lg p-6 space-y-5">
      <div className="text-center"><p className="text-xl font-black text-gray-800">Apakah kamu pernah belajar tentang materi ini?</p><p className="text-gray-400 text-sm mt-2">Materi: <Arabic className="font-bold text-gray-700">{META[material].arabic}</Arabic> ({META[material].title})</p></div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setExperience("yes")} className={`py-7 rounded-2xl border-2 font-black ${experience === "yes" ? "bg-green-200 border-green-500 text-green-800" : "bg-green-50 border-green-200 text-green-700"}`}>✅<br />Ya, pernah!</button>
        <button onClick={() => setExperience("no")} className={`py-7 rounded-2xl border-2 font-black ${experience === "no" ? "bg-orange-200 border-orange-500 text-orange-800" : "bg-orange-50 border-orange-200 text-orange-700"}`}>🆕<br />Belum pernah</button>
      </div>
      {experience === "yes" && <div className="space-y-2 pop-in"><label className="block font-bold text-gray-700">{prompts[material]}</label><textarea value={memory} onChange={(e) => setMemory(e.target.value)} placeholder="Ketik jawabanmu di sini..." className="w-full min-h-28 rounded-2xl border-2 border-indigo-200 p-4 focus:outline-none focus:border-indigo-500" /></div>}
      {experience === "no" && <div className="space-y-2 pop-in"><label className="block font-bold text-gray-700">Menurut kamu, materi ini berkaitan tentang apa?</label><textarea value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="Ketik pendapatmu di sini..." className="w-full min-h-28 rounded-2xl border-2 border-orange-200 p-4 focus:outline-none focus:border-orange-500" /></div>}
      {experience && <div ref={nextRef}><ContinueButton disabled={experience === "yes" ? !memory.trim() : !guess.trim()} onClick={() => { onSave({ experience, memory: memory.trim() || undefined, guess: guess.trim() || undefined }); onComplete(); }}>Lanjut ke Materi →</ContinueButton></div>}
    </div>
  </Shell>;
}

export function MeaningfulMaterialPage({ material, onComplete }: { material: MaterialId; onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const [grammarSeen, setGrammarSeen] = useState(material !== "alwan");
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [index]);
  const total = material === "taaruf" ? TAARUF_SITUATIONS.length : COLORS.length;
  const next = () => index + 1 < total ? setIndex((i) => i + 1) : onComplete();
  if (material === "taaruf") {
    const item = TAARUF_SITUATIONS[index];
    return <Shell gradient="from-emerald-50 to-teal-50"><Header icon="📖" title={<>Materi — <Arabic>{META[material].arabic}</Arabic></>} subtitle={`Situasi ${index + 1} dari 4`} gradient="from-emerald-500 to-teal-600" />
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${((index + 1) / 4) * 100}%` }} /></div>
      <article className="bg-white rounded-3xl border-2 border-emerald-200 shadow-xl overflow-hidden pop-in" key={index}>
        <div className="bg-emerald-50 p-4 text-center"><span className="text-xs font-black text-emerald-600">SITUASI {index + 1}</span><h3 className="text-xl font-black text-gray-800">{item.title}</h3></div>
        <div className="p-5 space-y-4">
          <IllustrationSlot label={`Ilustrasi Situasi ${index + 1}`} src={[situasi1Illustration, situasi2Illustration, situasi3Illustration, situasi4Illustration][index]} />
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 text-sm text-gray-700"><b>Konteks:</b> {item.context}</div>
          <div className="space-y-3">{item.arabic.map((line, i) => <div key={line} className="rounded-2xl bg-cyan-50 border border-cyan-200 p-3"><Arabic className="block text-xl font-black text-right text-gray-800">{line}</Arabic><p className="text-sm text-gray-500 mt-1">{item.meaning[i]}</p></div>)}</div>
          <AudioBox label="Dengarkan contoh pengucapan" src={TAARUF_SITUATION_AUDIO[index]} />
        </div>
      </article><div className="grid grid-cols-5 gap-3">{index > 0 && <button onClick={() => setIndex((value) => value - 1)} className="col-span-2 py-4 rounded-2xl border-2 border-emerald-300 bg-white text-emerald-700 font-black">← Situasi Sebelumnya</button>}<button onClick={next} className={`${index > 0 ? "col-span-3" : "col-span-5"} py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-lg`}>{index === 3 ? "Lanjut ke Istimā' →" : `Lanjut ke Situasi ${index + 2} →`}</button></div>
    </Shell>;
  }
  if (!grammarSeen) return <Shell gradient="from-emerald-50 to-teal-50"><Header icon="📘" title="Mudzakkar dan Muannats" subtitle="Kenali bentuk kata warna sebelum mulai belajar" gradient="from-emerald-500 to-teal-600" /><div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-200 p-6 space-y-4"><p className="text-gray-700 leading-relaxed">Dalam bahasa Arab, kata warna dapat memiliki dua bentuk, yaitu bentuk <b>mudzakkar</b> (laki-laki) dan <b>muannats</b> (perempuan). Bentuk warna yang digunakan bergantung pada jenis kata benda yang dijelaskan.</p><p className="text-gray-700 leading-relaxed">Jika kata benda berbentuk mudzakkar, gunakan bentuk warna mudzakkar. Jika kata benda berbentuk muannats, gunakan bentuk warna muannats.</p><div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4"><p className="text-sm text-amber-800">Salah satu tanda yang sering menunjukkan kata benda muannats adalah <b>tā’ marbūṭah (ة)</b> di akhir kata. Ketika menemukannya, biasanya gunakan bentuk warna muannats.</p></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div className="rounded-2xl bg-cyan-50 border-2 border-cyan-200 p-4 text-center"><p className="text-xs font-black text-cyan-600">MUDZAKKAR</p><Arabic className="block text-3xl font-black mt-2">قَلَمٌ أَسْوَدُ</Arabic><p className="text-xs text-gray-500 mt-1">Pulpen berwarna hitam</p></div><div className="rounded-2xl bg-pink-50 border-2 border-pink-200 p-4 text-center"><p className="text-xs font-black text-pink-600">MUANNATS</p><Arabic className="block text-3xl font-black mt-2">حَقِيبَةٌ سَوْدَاءُ</Arabic><p className="text-xs text-gray-500 mt-1">Tas berwarna hitam</p></div></div><p className="text-center font-bold text-emerald-700">Perhatikan bentuk kata benda dan kata warnanya, ya!</p></div><ContinueButton onClick={() => setGrammarSeen(true)}>Mulai Belajar →</ContinueButton></Shell>;
  const item = COLORS[index];
  return <Shell gradient="from-emerald-50 to-teal-50"><Header icon="📖" title={<>Materi — <Arabic>{META[material].arabic}</Arabic></>} subtitle="Kosakata warna dan konteks nyata" gradient="from-emerald-500 to-teal-600" />
    <div className="flex justify-between items-center"><div className="bg-white rounded-2xl px-4 py-2 shadow-sm border-2 border-emerald-200 font-bold text-emerald-600 text-sm">{index + 1} / {COLORS.length}</div><div className="text-xs text-gray-400">Kosakata Warna</div></div>
    <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${((index + 1) / COLORS.length) * 100}%` }} /></div>
    <article className="bg-white rounded-3xl border-2 border-emerald-200 p-5 shadow-xl space-y-4 pop-in" key={index}><div className="text-center space-y-2"><span className="mx-auto block w-16 h-16 rounded-2xl border-2 border-gray-200 shadow-inner" style={{ backgroundColor: item.color }} /><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-cyan-50 p-3"><p className="text-[10px] font-black text-cyan-600">MUDZAKKAR</p><Arabic className="block text-3xl font-black text-gray-800">{item.arabic}</Arabic></div><div className="rounded-2xl bg-pink-50 p-3"><p className="text-[10px] font-black text-pink-600">MUANNATS</p><Arabic className="block text-3xl font-black text-gray-800">{item.feminine}</Arabic></div></div><div className="text-2xl font-black text-emerald-700">{item.meaning}</div></div><AudioBox label={`Dengarkan ${item.arabic} dan ${item.feminine}`} src={ALWAN_AUDIO[item.meaning].vocabulary} /></article>
    <div className="bg-emerald-50 rounded-2xl p-4 border-2 border-emerald-200 space-y-3"><p className="text-xs font-bold text-emerald-600">Konteks Nyata:</p><Arabic className="block text-xl text-right font-bold text-gray-800">{item.example}</Arabic><p className="text-sm text-gray-500 mt-1">{item.translation}</p><AudioBox label={`Dengarkan contoh: ${item.example}`} src={ALWAN_AUDIO[item.meaning].context} /></div>
    <div className="grid grid-cols-5 gap-3"><button onClick={() => setIndex((i) => i - 1)} disabled={index === 0} className="col-span-2 py-4 rounded-2xl border-2 border-gray-200 text-gray-500 font-bold disabled:opacity-30">← Kembali</button><button onClick={next} className="col-span-3 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-lg">{index === COLORS.length - 1 ? "Selesai!" : "Lanjut →"}</button></div>
  </Shell>;
}

const LISTENING_QUESTIONS = {
  taaruf: [
    ["مَا اسْمُهُ؟", "Siapa namanya?", ["أَحْمَدُ", "عَلِيٌّ", "حَسَنٌ"], "أَحْمَدُ"],
    ["كَيْفَ حَالُهُ؟", "Bagaimana kabarnya?", ["هُوَ بِخَيْرٍ", "هُوَ مَرِيضٌ", "هُوَ حَزِينٌ"], "هُوَ بِخَيْرٍ"],
    ["أَيْنَ يَسْكُنُ؟", "Di mana dia tinggal?", ["فِي جَاكَرْتَا", "فِي بَانْدُونْجَ", "فِي سُورَابَايَا"], "فِي جَاكَرْتَا"],
    ["مَا رَقْمُ عُنْوَانِهِ؟", "Berapa nomor alamatnya?", ["رَقْمُ عَشَرَةَ", "رَقْمُ حَادِي عَشَرَ", "رَقْمُ اثْنَيْ عَشَرَ"], "رَقْمُ حَادِي عَشَرَ"],
    ["أَيْنَ مَدْرَسَتُهُ؟", "Di mana sekolahnya?", ["فِي سُودِيرْمَانَ", "فِي جَاكَرْتَا", "فِي أَحْمَدَ يَانِي"], "فِي سُودِيرْمَانَ"],
  ],
  ayyam: [
    ["أَيُّ يَوْمٍ الْآنَ؟", "Hari apa sekarang?", ["يَوْمُ الِاثْنَيْنِ", "يَوْمُ الْأَحَدِ", "يَوْمُ الثُّلَاثَاءِ"], "يَوْمُ الِاثْنَيْنِ"],
    ["أَيُّ يَوْمٍ أَمْسِ؟", "Hari apa kemarin?", ["يَوْمُ الْأَحَدِ", "يَوْمُ السَّبْتِ", "يَوْمُ الْأَرْبِعَاءِ"], "يَوْمُ الْأَحَدِ"],
    ["أَيُّ يَوْمٍ غَدًا؟", "Hari apa besok?", ["يَوْمُ الثُّلَاثَاءِ", "يَوْمُ الْخَمِيسِ", "يَوْمُ الْجُمُعَةِ"], "يَوْمُ الثُّلَاثَاءِ"],
  ],
  alwan: [
    ["مَا لَوْنُ الْحَقِيبَةِ؟", "Apa warna tas tersebut?", ["أَسْوَدُ", "أَبْيَضُ", "أَحْمَرُ"], "أَسْوَدُ"],
    ["مَا لَوْنُ الْكِتَابِ؟", "Apa warna buku tersebut?", ["أَبْيَضُ", "أَزْرَقُ", "أَصْفَرُ"], "أَبْيَضُ"],
    ["مَا لَوْنُ الْقَلَمِ؟", "Apa warna pena tersebut?", ["أَزْرَقُ", "أَخْضَرُ", "أَسْوَدُ"], "أَزْرَقُ"],
  ],
} as const;

export function ListeningMaterialPage({ material, onComplete }: { material: MaterialId; onComplete: () => void }) {
  const [heard, setHeard] = useState(false);
  const [question, setQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const qs = LISTENING_QUESTIONS[material];
  const done = question >= qs.length;
  const q = !done ? qs[question] : null;
  const audioSrc = material === "alwan" ? istimaAlwanAudioUrl : material === "ayyam" ? istimaAyyamAudioUrl : istimaAudioUrl;
  return <Shell gradient="from-sky-50 to-cyan-50"><Header icon="🎧" title="الِاسْتِمَاعُ — Istimā'" subtitle="Dengarkan percakapan dengan saksama sebelum menjawab." gradient="from-cyan-600 to-sky-500" />
    <IllustrationSlot label={material === "alwan" ? "Ilustrasi deskripsi tas sekolah" : "Ilustrasi percakapan Ta'aruf"} src={material === "alwan" ? istimaAlwanIllustration : material === "taaruf" ? istimaTaarufIllustration : undefined} />
    <AudioBox label={material === "alwan" ? "Deskripsi tas sekolah" : "Percakapan lengkap"} src={audioSrc} onComplete={() => setHeard(true)} />
    <div className="bg-white rounded-3xl p-5 border-2 border-cyan-200 shadow-md space-y-3">
      {(material !== "alwan" || heard) && <div className="space-y-2">{DIALOGUES[material].map(([arabic, translation], i) => <div key={i} className={`rounded-2xl p-3 max-w-[88%] ${i % 2 ? "ml-auto bg-green-50 border border-green-200" : "bg-cyan-50 border border-cyan-200"}`}><Arabic className="block text-lg text-right font-bold">{arabic}</Arabic><p className="text-xs text-gray-500 mt-1">{translation}</p></div>)}</div>}
      {!heard && <p className="text-xs text-center text-gray-400">Dengarkan audio sampai selesai untuk membuka pertanyaan.</p>}
    </div>
    {heard && !done && q && <div className="space-y-3"><div className="text-sm font-bold text-cyan-600 text-center">Pertanyaan {question + 1}/{qs.length} · Skor {score}</div><ChoiceQuestion key={question} question={q[0]} meaning={q[1]} options={[...q[2]]} answer={q[3]} onDone={(correct) => { if (correct) setScore((s) => s + 1); setTimeout(() => setQuestion((n) => n + 1), 900); }} /></div>}
    {done && <div className="bg-white rounded-3xl p-7 text-center shadow-xl space-y-4"><div className="text-5xl">🏆</div><h3 className="text-2xl font-black">Istimā' Selesai!</h3><p className="text-cyan-600 font-black text-3xl">{score}/{qs.length}</p><ContinueButton onClick={onComplete}>Lanjut ke Kalām →</ContinueButton></div>}
  </Shell>;
}

const SPEAKING = {
  taaruf: [
    ["مَا اسْمُكَ؟", "Ucapkan jawaban untuk memperkenalkan namamu.", "اِسْمِي ..."],
    ["كَيْفَ حَالُكَ؟", "Ucapkan jawaban untuk menjelaskan kabarmu.", "أَنَا بِخَيْرٍ، الْحَمْدُ لِلَّهِ."],
    ["أَيْنَ تَسْكُنُ؟", "Ucapkan jawaban untuk menjelaskan tempat tinggalmu.", "أَسْكُنُ فِي ..."],
  ],
  ayyam: [
    ["أَيُّ يَوْمٍ الْآنَ؟", "Jawablah pertanyaan ini dengan lantang.", "الْآنَ يَوْمُ الِاثْنَيْنِ."],
    ["أَيُّ يَوْمٍ غَدًا؟", "Baca lalu ucapkan jawaban dengan jelas.", "غَدًا يَوْمُ الثُّلَاثَاءِ."],
    ["مَاذَا تَفْعَلُ يَوْمَ الْجُمُعَةِ؟", "Jawab secara lisan dengan bahasa Arab.", "أَذْهَبُ إِلَى الْمَسْجِدِ."],
    ["أَيُّ يَوْمٍ بَعْدَ غَدٍ؟", "Lakukan percakapan singkat dengan website.", "بَعْدَ غَدٍ يَوْمُ الْأَرْبِعَاءِ."],
  ],
  alwan: [
    ["مَا لَوْنُ الْحَقِيبَةِ؟", "Jawablah dengan menyebutkan warna tas.", "الْحَقِيبَةُ سَوْدَاءُ."],
    ["مَا لَوْنُ السَّمَاءِ؟", "Jawablah dengan menyebutkan warna langit.", "السَّمَاءُ زَرْقَاءُ."],
    ["مَا لَوْنُ قَمِيصِكَ؟", "Jawablah dengan menyebutkan warna bajumu.", "قَمِيصِي أَبْيَضُ."],
  ],
};

export function SpeakingMaterialPage({ material, onComplete, RecorderComponent = Recorder }: { material: MaterialId; onComplete: () => void; RecorderComponent?: React.ComponentType<{ onSubmit: () => void; submitLabel?: string }> }) {
  const [level, setLevel] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const levels = SPEAKING[material];
  const levelStyles = [
    { title: "Dengar & Ulangi", icon: "🔊", color: "from-rose-500 to-pink-600" },
    { title: "Baca & Ucapkan", icon: "📖", color: "from-orange-500 to-amber-500" },
    { title: "Jawab Pertanyaan", icon: "💬", color: "from-violet-500 to-purple-600" },
    { title: "Bermain Peran", icon: "🎭", color: "from-teal-500 to-cyan-600" },
  ];
  const done = level >= levels.length;
  if (done) return <Shell gradient="from-rose-50 to-pink-50"><div className="bg-white rounded-3xl p-8 text-center shadow-xl space-y-5"><div className="text-6xl">🌟</div><h2 className="text-2xl font-black">Kalām Selesai!</h2><p className="text-gray-500">Semua tugas berbicara sudah kamu selesaikan.</p><ContinueButton onClick={onComplete}>Lanjut ke Kitābah →</ContinueButton></div></Shell>;
  const item = levels[level];
  const style = levelStyles[level];
  return <Shell gradient="from-rose-50 to-pink-50"><div className={`bg-gradient-to-r ${style.color} rounded-3xl p-5 text-white`}>
    <div className="flex items-center gap-3 mb-1"><span className="text-3xl">{style.icon}</span><div><div className="text-xs opacity-70 font-body">Level {level + 1} dari {levels.length}</div><h2 className="text-xl font-black" style={{ fontFamily: "Nunito, sans-serif" }}>{style.title}</h2></div></div>
    <p className="text-white/80 font-body text-sm">{item[1]}</p>
  </div>
    <div className="flex gap-2 overflow-x-auto pb-1">{levels.map((_, i) => <div key={i} className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold ${i < level ? "bg-green-100 text-green-700 border-2 border-green-300" : i === level ? "bg-rose-500 text-white shadow-md" : "bg-gray-100 text-gray-300 border-2 border-gray-200"}`}>{i < level ? "✓ " : i > level ? "🔒 " : ""}{levelStyles[i].icon} L{i + 1}</div>)}</div>
    <div className="bg-white rounded-3xl border-2 border-rose-200 p-6 text-center shadow-md space-y-3"><Arabic className="block text-3xl font-black text-gray-800">{item[0]}</Arabic><p className="text-gray-500">{item[1]}</p><div className="bg-rose-50 rounded-2xl p-3"><span className="text-xs font-bold text-rose-500">Contoh jawaban</span><Arabic className="block text-xl font-bold text-gray-700">{item[2]}</Arabic></div><AudioBox label="Dengarkan contoh" /></div>
    {!submitted ? <RecorderComponent onSubmit={() => setSubmitted(true)} submitLabel="✓ Kirim Rekaman" /> : <div className="bg-green-50 rounded-3xl border-2 border-green-300 p-5 text-center space-y-3"><p className="font-black text-green-700">Bagus! Rekamanmu sudah diterima.</p><ContinueButton onClick={() => { setLevel((n) => n + 1); setSubmitted(false); }}>{level + 1 === levels.length ? "Selesaikan Kalām →" : "Level Berikutnya →"}</ContinueButton></div>}
  </Shell>;
}

const WRITING = {
  taaruf: [
    ["اِسْمِي ______.", [], "Lengkapi namamu."],
    ["أَنَا بِخَيْرٍ، ______.", ["الْحَمْدُ لِلَّهِ", "الْحَمْدُ لِلّٰهِ"], "Lengkapi ungkapan kabar."],
    ["أَسْكُنُ فِي ______.", [], "Tuliskan tempat tinggalmu."],
  ],
  ayyam: [
    ["الْآنَ يَوْمُ ______.", ["الِاثْنَيْنِ", "الاثنين"], "Lengkapi kalimat tentang hari ini."],
    ["غَدًا يَوْمُ ______.", ["الثُّلَاثَاءِ", "الثلاثاء"], "Lengkapi kalimat tentang besok."],
    ["بَعْدَ غَدٍ يَوْمُ ______.", ["الْأَرْبِعَاءِ", "الأربعاء"], "Lengkapi kalimat tentang besok lusa."],
  ],
  alwan: [
    ["الْحَقِيبَةُ ______.", ["سَوْدَاءُ", "سوداء"], "Lengkapi warna tas."],
    ["السَّمَاءُ ______.", ["زَرْقَاءُ", "زرقاء"], "Lengkapi warna langit."],
    ["الْعِنَبُ ______.", ["بَنَفْسَجِيٌّ", "بنفسجي"], "Lengkapi warna anggur."],
  ],
};

export function WritingMaterialPage({ material, onComplete }: { material: MaterialId; onComplete: () => void }) {
  const [level, setLevel] = useState(0);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState<null | boolean>(null);
  const levels = WRITING[material];
  const done = level >= levels.length;
  if (done) return <Shell gradient="from-indigo-50 to-sky-50"><div className="bg-white rounded-3xl p-8 text-center shadow-xl space-y-5"><div className="text-6xl">✍️</div><h2 className="text-2xl font-black">Kitābah Selesai!</h2><p className="text-gray-500">Kamu telah menyelesaikan tiga level menulis.</p><ContinueButton onClick={onComplete}>Lanjut ke Mini Game →</ContinueButton></div></Shell>;
  const item = levels[level];
  const check = () => {
    const normalized = answer.trim().replace(/[.،]/g, "");
    const accepted = item[1] as string[];
    setChecked(accepted.length === 0 ? normalized.length > 1 : accepted.some((value) => normalized.includes(value.replace(/[.،]/g, ""))));
  };
  const levelMeta = [
    { title: "Melengkapi", icon: "👆", color: "from-indigo-500 to-purple-600" },
    { title: "Menyalin", icon: "✏️", color: "from-sky-500 to-indigo-500" },
    { title: "Mengingat", icon: "🧠", color: "from-violet-500 to-purple-700" },
  ][level];
  return <Shell gradient="from-indigo-50 to-sky-50"><div className={`bg-gradient-to-r ${levelMeta.color} rounded-3xl p-5 text-white`}>
    <div className="flex items-center gap-2"><span className="text-2xl">{levelMeta.icon}</span><div><div className="text-xs opacity-70 font-body">Level {level + 1} dari {levels.length}</div><h2 className="text-lg font-black" style={{ fontFamily: "Nunito, sans-serif" }}>{levelMeta.title}</h2></div></div><p className="text-white/80 font-body text-xs mt-1">Setiap level berisi satu soal menulis.</p>
  </div>
    <div className="flex gap-2">{levels.map((_, i) => <div key={i} className={`flex-1 py-2 rounded-xl text-xs text-center font-bold ${i < level ? "bg-green-100 text-green-700 border-2 border-green-300" : i === level ? "bg-indigo-500 text-white shadow-md" : "bg-gray-100 text-gray-300 border-2 border-gray-200"}`}>{i < level ? "✓ " : i > level ? "🔒 " : ""}{["👆", "✏️", "🧠"][i]} L{i + 1}</div>)}</div>
    <div className="bg-white rounded-3xl border-2 border-indigo-200 p-6 shadow-md space-y-4"><p className="font-bold text-indigo-600">{item[2]}</p><Arabic className="block text-3xl font-black text-center text-gray-800">{item[0]}</Arabic><input dir="rtl" lang="ar" value={answer} onChange={(e) => { setAnswer(e.target.value); setChecked(null); }} placeholder="اُكْتُبْ هُنَا..." className="w-full rounded-2xl border-2 border-indigo-200 px-4 py-4 text-xl text-right focus:outline-none focus:border-indigo-500" style={{ fontFamily: "'Noto Naskh Arabic', Arial, serif" }} /><button onClick={check} disabled={!answer.trim()} className="w-full py-3 rounded-2xl bg-indigo-500 text-white font-black disabled:opacity-40">Periksa Jawaban</button></div>
    {checked !== null && <div className={`rounded-2xl p-4 text-center font-bold ${checked ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{checked ? "Jawaban diterima!" : <>Coba periksa lagi. Contoh jawaban: <Arabic>{(item[1] as string[])[0]}</Arabic></>}<div className="mt-3">{checked && <ContinueButton onClick={() => { setLevel((n) => n + 1); setAnswer(""); setChecked(null); }}>Level Berikutnya →</ContinueButton>}</div></div>}
  </Shell>;
}

const MEMORY_PAIRS = [
  ["مَا اسْمُكَ؟", "اِسْمِي عَلِيٌّ."], ["كَيْفَ حَالُكَ؟", "أَنَا بِخَيْرٍ."], ["مَا وَظِيفَتُكَ؟", "أَنَا تِلْمِيذٌ."], ["أَيْنَ تَسْكُنُ؟", "أَسْكُنُ فِي جَاكَرْتَا."], ["أَيْنَ مَدْرَسَتُكَ؟", "مَدْرَسَتِي فِي سُودِيرْمَانَ."],
];

function MemoryGame({ onDone, onReward }: { onDone: () => void; onReward?: (id: string, correct: boolean) => void }) {
  const cards = useMemo(() => MEMORY_PAIRS.flatMap((pair, pairId) => pair.map((text) => ({ pairId, text }))).sort(() => Math.random() - .5), []);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [wrongCards, setWrongCards] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  useEffect(() => {
    if (matched.length === MEMORY_PAIRS.length) {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      const timer = window.setTimeout(onDone, 650);
      return () => window.clearTimeout(timer);
    }
  }, [matched.length]);
  const choose = (index: number) => {
    if (open.length === 2 || open.includes(index) || matched.includes(cards[index].pairId)) return;
    const next = [...open, index]; setOpen(next);
    if (next.length === 2) {
      if (cards[next[0]].pairId === cards[next[1]].pairId) {
        onReward?.(`taaruf:game:memory:pair${cards[index].pairId + 1}`, true);
        playFeedback(true);
        setFeedback("Pasangan benar!");
        setTimeout(() => { setMatched((m) => [...m, cards[index].pairId]); setOpen([]); setFeedback(null); }, 500);
      } else {
        playFeedback(false);
        setWrongCards(next);
        setFeedback("Belum cocok. Coba pasangan yang lain!");
        setTimeout(() => { setOpen([]); setWrongCards([]); setFeedback(null); }, 900);
      }
    }
  };
  return <div className="space-y-4"><div className="text-center font-black text-purple-600">{matched.length}/5 pasangan ditemukan</div><div className="grid grid-cols-2 gap-3">{cards.map((card, i) => {
    const visible = open.includes(i) || matched.includes(card.pairId);
    return <button key={i} onClick={() => choose(i)} className={`min-h-24 rounded-2xl border-2 p-2 transition-all ${wrongCards.includes(i) ? "shake bg-red-50 border-red-400" : visible ? "bg-white border-purple-300" : "bg-gradient-to-br from-purple-500 to-pink-500 border-purple-400"}`}>{visible ? <Arabic className="text-lg font-bold text-gray-800">{card.text}</Arabic> : <span className="text-white text-2xl">؟</span>}</button>;
  })}</div>{feedback && <div className={`rounded-2xl p-3 text-center font-bold pop-in ${wrongCards.length ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{feedback}</div>}{matched.length === MEMORY_PAIRS.length && <div className="bg-green-100 rounded-2xl p-4 text-center font-black text-green-700 bounce-in">Semua pasangan cocok! Melanjutkan otomatis...</div>}</div>;
}

const TAARUF_PICTURE_QUESTIONS = [
  { illustration: "Dua siswa saling berkenalan", src: tebakGambar1, question: "Ungkapan apa yang tepat untuk menanyakan nama?", options: ["مَا اسْمُكَ؟", "كَيْفَ حَالُكَ؟", "أَيْنَ مَدْرَسَتُكَ؟"], answer: "مَا اسْمُكَ؟" },
  { illustration: "Seorang siswa menanyakan alamat temannya", src: tebakGambar2, question: "Ungkapan apa yang tepat untuk menanyakan alamat?", options: ["مَا عُنْوَانُكَ؟", "مَا وَظِيفَتُكَ؟", "أَيْنَ تَسْكُنُ؟"], answer: "مَا عُنْوَانُكَ؟" },
  { illustration: "Dua siswa membicarakan sekolah", src: tebakGambar3, question: "Ungkapan apa yang tepat untuk menanyakan sekolah?", options: ["أَيْنَ مَدْرَسَتُكَ؟", "مَا اسْمُكَ؟", "كَيْفَ حَالُكَ؟"], answer: "أَيْنَ مَدْرَسَتُكَ؟" },
];

function GuessPictureGame({ onDone, onReward }: { onDone: () => void; onReward?: (id: string, correct: boolean) => void }) {
  const [question, setQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [question]);
  if (question >= TAARUF_PICTURE_QUESTIONS.length) return <div className="bg-white rounded-3xl shadow-xl p-8 text-center space-y-5 bounce-in"><div className="text-6xl">🏆</div><h3 className="text-2xl font-black text-gray-800">Tebak Gambar Selesai!</h3><div className="text-4xl font-black text-pink-600">{score}/{TAARUF_PICTURE_QUESTIONS.length}</div><ContinueButton onClick={onDone}>Kembali ke Menu</ContinueButton></div>;
  const item = TAARUF_PICTURE_QUESTIONS[question];
  const answer = (option: string) => {
    if (selected) return;
    setSelected(option);
    const correct = option === item.answer;
    onReward?.(`taaruf:game:picture:q${question + 1}`, correct);
    if (correct) setScore((value) => value + 1);
    playFeedback(correct);
    setTimeout(() => { setQuestion((value) => value + 1); setSelected(null); }, 950);
  };
  return <div className="space-y-4"><div className="flex justify-between items-center"><span className="font-bold text-pink-600">Gambar {question + 1}/{TAARUF_PICTURE_QUESTIONS.length}</span><span className="font-black text-pink-600">Skor {score}</span></div><IllustrationSlot label={item.illustration} src={item.src} /><div className="bg-white rounded-3xl border-2 border-pink-200 p-5 text-center shadow-lg"><p className="font-black text-gray-800">{item.question}</p></div><div className="space-y-3">{item.options.map((option) => <button key={option} onClick={() => answer(option)} disabled={!!selected} className={`w-full py-4 px-5 rounded-2xl border-2 font-bold transition-all ${!selected ? "bg-white border-gray-200 hover:border-pink-400" : option === item.answer ? "bg-green-100 border-green-400 text-green-700" : selected === option ? "bg-red-100 border-red-400 text-red-600" : "bg-gray-50 border-gray-200 text-gray-300"}`}><Arabic className="text-xl">{option}</Arabic></button>)}</div>{selected && <div className={`rounded-2xl p-4 text-center font-bold ${selected === item.answer ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{selected === item.answer ? "Benar!" : <>Jawaban yang tepat: <Arabic>{item.answer}</Arabic></>}</div>}</div>;
}

const FIND_ROUNDS = [
  ["merah", "red"], ["kuning", "yellow"], ["biru", "blue"], ["hijau", "green"], ["hitam", "black"],
] as const;
const OBJECTS = [
  { label: "Buku", icon: "▭", color: "red" }, { label: "Tas", icon: "▰", color: "black" }, { label: "Pensil", icon: "▮", color: "yellow" }, { label: "Buku Tulis", icon: "▭", color: "blue" }, { label: "Apel", icon: "●", color: "red" }, { label: "Daun", icon: "◆", color: "green" }, { label: "Pena", icon: "▮", color: "blue" }, { label: "Pisang", icon: "◒", color: "yellow" }, { label: "Kotak", icon: "■", color: "black" }, { label: "Botol", icon: "▰", color: "green" },
];
const CSS_COLORS: Record<string, string> = { red: "#ef4444", yellow: "#facc15", blue: "#3b82f6", green: "#22c55e", black: "#1f2937" };

function FindColorGame({ onDone }: { onDone: () => void }) {
  const [round, setRound] = useState(0);
  const [found, setFound] = useState<number[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [round]);
  if (round >= FIND_ROUNDS.length) return <div className="bg-white rounded-3xl shadow-xl border-2 border-green-300 p-8 text-center space-y-5 bounce-in"><div className="text-6xl">🏆</div><h3 className="text-2xl font-black text-green-700">Find the Color Selesai!</h3><p className="text-gray-500">Luar biasa! Kamu berhasil menemukan semua benda berdasarkan warna yang diminta.</p><div className="grid grid-cols-2 gap-3"><div className="bg-green-50 rounded-2xl p-3 border-2 border-green-200"><div className="text-3xl font-black text-green-600">5/5</div><div className="text-xs text-gray-400">ronde selesai</div></div><div className="bg-cyan-50 rounded-2xl p-3 border-2 border-cyan-200"><div className="text-3xl font-black text-cyan-600">{correctCount}/10</div><div className="text-xs text-gray-400">benda ditemukan</div></div></div><ContinueButton onClick={onDone}>Lanjutkan →</ContinueButton></div>;
  const [name, color] = FIND_ROUNDS[round];
  const targets = OBJECTS.map((o, i) => o.color === color ? i : -1).filter((i) => i >= 0);
  const select = (i: number) => {
    const correct = OBJECTS[i].color === color;
    playFeedback(correct);
    if (correct && !found.includes(i)) { setFound((f) => [...f, i]); setCorrectCount((value) => value + 1); }
  };
  const complete = targets.every((i) => found.includes(i));
  return <div className="space-y-4"><div className="bg-white rounded-3xl p-5 text-center border-2 border-cyan-200"><b>Temukan semua benda yang berwarna {name}.</b><p className="text-xs text-gray-400 mt-1">Ronde {round + 1}/5</p></div><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{OBJECTS.map((o, i) => <button key={i} onClick={() => select(i)} className={`rounded-2xl bg-white border-2 p-4 ${found.includes(i) ? "border-green-500 ring-2 ring-green-200" : "border-gray-200"}`}><span className="block text-5xl" style={{ color: CSS_COLORS[o.color] }}>{o.icon}</span><span className="text-xs font-bold text-gray-600">{o.label}</span></button>)}</div>{complete && <ContinueButton onClick={() => { setRound((r) => r + 1); setFound([]); }}>Warna Berikutnya →</ContinueButton>}</div>;
}

function MatchColorGame({ onDone }: { onDone: () => void }) {
  const [matched, setMatched] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  useEffect(() => {
    if (matched.length === COLORS.length) window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [matched.length]);
  const chooseObject = (i: number) => {
    if (selected === null) return;
    const correct = selected === i;
    playFeedback(correct);
    if (correct) { setMatched((m) => [...m, i]); setSelected(null); }
  };
  if (matched.length === COLORS.length) return <div className="bg-white rounded-3xl shadow-xl border-2 border-green-300 p-8 text-center space-y-5 bounce-in"><div className="text-6xl">🎨</div><h3 className="text-2xl font-black text-green-700">Match the Color Selesai!</h3><p className="text-gray-500">Hebat! Semua kosakata warna Arab berhasil kamu cocokkan dengan benar.</p><div className="bg-purple-50 rounded-2xl p-4 border-2 border-purple-200"><div className="text-4xl font-black text-purple-600">{matched.length}/{COLORS.length}</div><div className="text-sm text-gray-400">warna berhasil dicocokkan</div></div><ContinueButton onClick={onDone}>Lanjutkan →</ContinueButton></div>;
  return <div className="space-y-4"><p className="text-center text-sm text-gray-500">Pilih label Arab, lalu pilih objek dengan warna yang sesuai.</p><div className="flex flex-wrap gap-2 justify-center">{COLORS.map((c, i) => <button key={c.arabic} disabled={matched.includes(i)} onClick={() => setSelected(i)} className={`px-3 py-2 rounded-xl border-2 ${matched.includes(i) ? "bg-green-100 border-green-300" : selected === i ? "bg-purple-100 border-purple-500" : "bg-white border-purple-200"}`}><Arabic>{matched.includes(i) ? "✓" : c.arabic}</Arabic></button>)}</div><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{COLORS.map((c, i) => <button key={i} onClick={() => chooseObject(i)} className={`rounded-2xl border-2 bg-white p-3 ${matched.includes(i) ? "border-green-500" : "border-gray-200"}`}><span className="block h-16 rounded-xl border border-gray-200" style={{ backgroundColor: c.color }} /><span className="text-xs font-bold mt-2 block">{c.meaning}</span></button>)}</div></div>;
}

const ARRANGE = [
  [["أَوَّلُ", "أَمْسِ", "يَوْمُ", "السَّبْتِ."], "Kemarin lusa adalah hari Sabtu."],
  [["أَمْسِ", "يَوْمُ", "الْأَحَدِ."], "Kemarin adalah hari Minggu."],
  [["الْيَوْمُ", "يَوْمُ", "الِاثْنَيْنِ."], "Hari ini adalah hari Senin."],
  [["غَدًا", "يَوْمُ", "الثُّلَاثَاءِ."], "Besok adalah hari Selasa."],
  [["بَعْدَ", "غَدٍ", "يَوْمُ", "الْأَرْبِعَاءِ."], "Besok lusa adalah hari Rabu."],
] as const;

function ArrangeGame({ onDone }: { onDone: () => void }) {
  const [q, setQ] = useState(0);
  const [pool, setPool] = useState<string[]>(() => [...ARRANGE[0][0]].sort(() => Math.random() - .5));
  const [answer, setAnswer] = useState<string[]>([]);
  const [checked, setChecked] = useState<null | boolean>(null);
  if (q >= ARRANGE.length) return <div className="bg-green-100 rounded-3xl p-7 text-center space-y-4"><h3 className="text-xl font-black text-green-700">Lima kalimat selesai!</h3><ContinueButton onClick={onDone}>Selesai →</ContinueButton></div>;
  const current = ARRANGE[q];
  const next = () => { const n = q + 1; setQ(n); setAnswer([]); setChecked(null); if (n < ARRANGE.length) setPool([...ARRANGE[n][0]].sort(() => Math.random() - .5)); };
  return <div className="space-y-4"><div className="bg-white rounded-2xl p-4 text-center border-2 border-amber-200"><b>{current[1]}</b><p className="text-xs text-gray-400">Kalimat {q + 1}/5</p></div><div dir="rtl" className="min-h-20 rounded-2xl border-2 border-dashed border-amber-300 p-3 flex flex-wrap gap-2 justify-end">{answer.map((word, i) => <button key={i} onClick={() => { if (checked !== null) return; setAnswer((a) => a.filter((_, n) => n !== i)); setPool((p) => [...p, word]); }} className="px-3 py-2 rounded-xl bg-amber-100"><Arabic>{word}</Arabic></button>)}</div><div dir="rtl" className="bg-white rounded-2xl p-3 flex flex-wrap gap-2 justify-center">{pool.map((word, i) => <button key={i} onClick={() => { setPool((p) => p.filter((_, n) => n !== i)); setAnswer((a) => [...a, word]); }} className="px-3 py-2 rounded-xl border-2 border-gray-200"><Arabic>{word}</Arabic></button>)}</div><button disabled={pool.length > 0 || checked !== null} onClick={() => setChecked(answer.join(" ") === current[0].join(" "))} className="w-full py-3 rounded-2xl bg-amber-500 text-white font-black disabled:opacity-40">Periksa</button>{checked !== null && <div className={`rounded-2xl p-4 text-center ${checked ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{checked ? "Urutan benar!" : <><span>Urutan yang benar:</span><Arabic className="block text-xl">{current[0].join(" ")}</Arabic></>}<div className="mt-3"><ContinueButton onClick={next}>Kalimat Berikutnya →</ContinueButton></div></div>}</div>;
}

function DrawingGame({ onDone }: { onDone: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const point = useRef<{ x: number; y: number } | null>(null);
  const position = (event: React.PointerEvent) => { const rect = canvas.current!.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
  const move = (event: React.PointerEvent) => { if (!drawing.current || !point.current) return; const next = position(event); const ctx = canvas.current!.getContext("2d")!; ctx.beginPath(); ctx.moveTo(point.current.x, point.current.y); ctx.lineTo(next.x, next.y); ctx.strokeStyle = "#334155"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.stroke(); point.current = next; };
  return <div className="space-y-4"><div className="bg-white rounded-2xl p-4 border-2 border-violet-200 text-center"><Arabic className="block text-xl font-bold">يَوْمُ الْجُمُعَةِ</Arabic><p className="text-sm">Gambarkan kegiatan yang kamu lakukan pada hari favoritmu.</p></div><canvas ref={canvas} width={620} height={350} className="w-full bg-white rounded-3xl border-2 border-violet-300 touch-none" onPointerDown={(e) => { drawing.current = true; point.current = position(e); }} onPointerMove={move} onPointerUp={() => { drawing.current = false; point.current = null; }} onPointerLeave={() => { drawing.current = false; }} /><div className="grid grid-cols-2 gap-2"><button onClick={() => canvas.current?.getContext("2d")?.clearRect(0, 0, 620, 350)} className="py-3 rounded-2xl bg-red-100 text-red-700 font-bold">Hapus</button><button onClick={onDone} className="py-3 rounded-2xl bg-violet-500 text-white font-black">Kirim Gambar</button></div></div>;
}

const SORT_SHAPES = [
  { id: "r1", color: "red", kind: "★" }, { id: "r2", color: "red", kind: "◆" }, { id: "r3", color: "red", kind: "⬢" },
  { id: "y1", color: "yellow", kind: "●" }, { id: "y2", color: "yellow", kind: "▲" }, { id: "y3", color: "yellow", kind: "✦" },
  { id: "g1", color: "green", kind: "☁" }, { id: "g2", color: "green", kind: "⬟" }, { id: "g3", color: "green", kind: "♣" },
  { id: "b1", color: "blue", kind: "◆" }, { id: "b2", color: "blue", kind: "◒" }, { id: "b3", color: "blue", kind: "⬢" },
];
const SORT_COLORS = {
  red: { label: "Merah", bg: "#ef4444" },
  yellow: { label: "Kuning", bg: "#facc15" },
  green: { label: "Hijau", bg: "#22c55e" },
  blue: { label: "Biru", bg: "#3b82f6" },
};

function ColorSortingGame({ onDone, onReward }: { onDone: () => void; onReward?: (id: string, correct: boolean) => void }) {
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const place = (container: string, shapeId?: string) => {
    const id = shapeId ?? selected;
    if (!id || placed[id]) return;
    const shape = SORT_SHAPES.find((item) => item.id === id)!;
    if (shape.color === container) {
      onReward?.(`alwan:game:sort:${id}`, true);
      setPlaced((current) => ({ ...current, [id]: container })); setSelected(null); setFeedback("Benar! Bentuk masuk ke warna yang tepat.");
      playFeedback(true);
    } else {
      setFeedback("Belum tepat. Bentuk kembali ke tempat semula.");
      playFeedback(false);
    }
    setTimeout(() => setFeedback(null), 800);
  };
  const completed = Object.keys(placed).length === SORT_SHAPES.length;
  useEffect(() => { if (completed) window.scrollTo({ top: 0, behavior: "smooth" }); }, [completed]);
  if (completed) return <div className="bg-white rounded-3xl shadow-xl border-2 border-green-300 p-8 text-center space-y-5 bounce-in"><div className="text-6xl">🏆</div><h3 className="text-2xl font-black text-green-700">Sort the Shapes Selesai!</h3><p className="text-gray-500">Hebat! Semua bentuk sudah berada di wadah warna yang tepat.</p><div className="text-4xl font-black text-cyan-600">12/12</div><div className="h-3 bg-green-100 rounded-full overflow-hidden"><div className="h-full w-full bg-green-500" /></div><ContinueButton onClick={onDone}>Lanjut ke Game Berikutnya →</ContinueButton></div>;
  return <div className="space-y-4"><div className="bg-white rounded-2xl p-4 text-center border-2 border-cyan-200"><h3 className="text-xl font-black">Sort the Shapes by Color</h3><p className="text-sm text-gray-500">Seret bentuk atau pilih bentuk lalu ketuk wadah dengan warna yang sama.</p><p className="font-black text-cyan-600 mt-2">{Object.keys(placed).length}/12 bentuk</p></div><div className="grid grid-cols-2 gap-3">{Object.entries(SORT_COLORS).map(([key, value]) => <button key={key} onClick={() => place(key)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); place(key, e.dataTransfer.getData("text/plain")); }} className="min-h-36 rounded-3xl border-2 border-dashed bg-white p-3 text-center" style={{ borderColor: value.bg }}><span className="inline-block px-4 py-1 rounded-full text-white font-black" style={{ backgroundColor: value.bg }}>{value.label}</span><div className="flex flex-wrap justify-center gap-1 mt-3">{SORT_SHAPES.filter((shape) => placed[shape.id] === key).map((shape) => <span key={shape.id} className="text-3xl" style={{ color: value.bg }}>{shape.kind}</span>)}</div></button>)}</div><div className="bg-white rounded-3xl border-2 border-cyan-100 p-4 flex flex-wrap gap-3 justify-center">{SORT_SHAPES.filter((shape) => !placed[shape.id]).map((shape) => <button draggable key={shape.id} onDragStart={(e) => e.dataTransfer.setData("text/plain", shape.id)} onClick={() => setSelected(shape.id)} className={`relative w-16 h-16 text-5xl flex items-center justify-center transition-all ${selected === shape.id ? "scale-110 ring-4 ring-purple-300 rounded-2xl" : ""}`} style={{ color: SORT_COLORS[shape.color as keyof typeof SORT_COLORS].bg }}><span>{shape.kind}</span><span className="absolute text-[10px] text-gray-800">•ᴗ•</span></button>)}</div>{feedback && <div className={`rounded-2xl p-3 text-center font-bold pop-in ${feedback.startsWith("Benar") ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{feedback}</div>}</div>;
}

const FILL_PALETTE = ["#3b82f6", "#22c55e", "#f97316", "#ec4899", "#a855f7"];
const FILL_SHAPES = [
  { id: "circle", type: "circle" }, { id: "square", type: "square" }, { id: "triangle", type: "triangle" }, { id: "star", type: "star" },
  { id: "rectangle", type: "rectangle" }, { id: "hexagon", type: "hexagon" }, { id: "circle2", type: "circle" }, { id: "triangle2", type: "triangle" },
  { id: "star2", type: "star" }, { id: "square2", type: "square" },
];

function ShapeSvg({ type, fill }: { type: string; fill: string }) {
  const common = { fill, stroke: "#111827", strokeWidth: 4, strokeLinejoin: "round" as const };
  return <svg viewBox="0 0 100 100" className="w-full h-full">{type === "circle" && <circle cx="50" cy="50" r="37" {...common} />}{type === "square" && <rect x="15" y="15" width="70" height="70" rx="4" {...common} />}{type === "rectangle" && <rect x="8" y="25" width="84" height="50" rx="4" {...common} />}{type === "triangle" && <polygon points="50,8 92,88 8,88" {...common} />}{type === "hexagon" && <polygon points="25,8 75,8 95,50 75,92 25,92 5,50" {...common} />}{type === "star" && <polygon points="50,5 61,36 95,36 68,56 78,90 50,70 22,90 32,56 5,36 39,36" {...common} />}</svg>;
}

function FillShapesGame({ onDone, onReward }: { onDone: () => void; onReward?: (id: string, correct: boolean) => void }) {
  const [selectedColor, setSelectedColor] = useState(FILL_PALETTE[0]);
  const [fills, setFills] = useState<Record<string, string>>({});
  const completed = Object.keys(fills).length === FILL_SHAPES.length;
  useEffect(() => { if (completed) window.scrollTo({ top: 0, behavior: "smooth" }); }, [completed]);
  if (completed) return <div className="bg-white rounded-3xl shadow-xl border-2 border-pink-300 p-8 text-center space-y-5 bounce-in"><div className="text-6xl">🎨</div><h3 className="text-2xl font-black text-pink-700">Color the Shapes Selesai!</h3><p className="text-gray-500">Karyamu penuh warna! Semua bentuk berhasil diwarnai.</p><div className="text-4xl font-black text-purple-600">10/10</div><div className="h-3 bg-pink-100 rounded-full overflow-hidden"><div className="h-full w-full bg-gradient-to-r from-blue-500 via-pink-500 to-purple-500" /></div><ContinueButton onClick={onDone}>Lanjut ke Aktivitas Berikutnya →</ContinueButton></div>;
  return <div className="bg-pink-100 rounded-3xl p-4 sm:p-6"><div className="bg-white rounded-3xl border-2 border-pink-200 p-5 space-y-5 shadow-lg"><div className="text-center"><h3 className="text-2xl font-black">Color the Shapes</h3><p className="text-sm text-gray-500">Pilih warna, lalu ketuk setiap bentuk untuk mewarnainya.</p><p className="font-black text-pink-600 mt-2">{Object.keys(fills).length}/10 bentuk</p></div><div className="grid grid-cols-3 gap-4 sm:gap-6">{FILL_SHAPES.map((shape, index) => <button key={shape.id} onClick={() => { if (!fills[shape.id]) { setFills((current) => ({ ...current, [shape.id]: selectedColor })); onReward?.(`alwan:game:fill:${shape.id}`, false); } }} className={`${index % 2 ? "rotate-3" : "-rotate-2"} aspect-square p-1 hover:scale-105 transition-all`}><ShapeSvg type={shape.type} fill={fills[shape.id] ?? "#ffffff"} /></button>)}</div><div className="border-t-2 border-dashed border-pink-200 pt-4"><p className="text-center text-xs font-bold text-gray-500 mb-3">Warna terpilih: <span className="inline-block w-3 h-3 rounded-full align-middle" style={{ backgroundColor: selectedColor }} /></p><div className="flex justify-center gap-3">{FILL_PALETTE.map((color, index) => <button key={color} onClick={() => setSelectedColor(color)} aria-label={`Pilih warna ${index + 1}`} className={`w-12 h-12 rotate-45 rounded-lg border-4 transition-all ${selectedColor === color ? "border-gray-800 scale-110" : "border-white shadow-md"}`} style={{ backgroundColor: color }} />)}</div></div></div></div>;
}

export function JoyfulMaterialPage({ material, onComplete, onScore, onReward }: { material: MaterialId; onComplete: () => void; onScore: (score: number) => void; onReward?: (id: string, correct: boolean) => void }) {
  const games = material === "taaruf" ? [["memory", "Memory Flip Card"], ["picture", "Tebak Gambar"]] : material === "alwan" ? [["sort", "Sort the Shapes by Color"], ["fill", "Color the Shapes"]] : [["pairs", "Cocokkan Kata"], ["arrange", "Susun Kalimat"], ["draw", "Gambar Kegiatan"]];
  const [active, setActive] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [active]);
  const finish = () => { if (active) { setDone((d) => [...new Set([...d, active])]); onReward?.(`${material}:game:${active}`, true); } setActive(null); };
  if (active === "memory") return <Shell gradient="from-purple-50 to-pink-50"><Header icon="🃏" title="Memory Flip Card" subtitle="Cocokkan lima pertanyaan dengan jawabannya." /><MemoryGame onDone={finish} onReward={onReward} /></Shell>;
  if (active === "picture") return <Shell gradient="from-pink-50 to-rose-50"><Header icon="▧" title="Tebak Gambar" subtitle="Pilih ungkapan Arab yang sesuai dengan situasi." gradient="from-pink-500 to-rose-500" /><GuessPictureGame onDone={finish} onReward={onReward} /></Shell>;
  if (active === "sort") return <Shell gradient="from-cyan-50 to-blue-50"><ColorSortingGame onDone={finish} onReward={onReward} /></Shell>;
  if (active === "fill") return <Shell gradient="from-pink-50 to-rose-50"><FillShapesGame onDone={finish} onReward={onReward} /></Shell>;
  if (active === "arrange") return <Shell gradient="from-amber-50 to-yellow-50"><Header icon="📝" title="Susun Kalimat" subtitle="Susun tepat lima kalimat Arab." /><ArrangeGame onDone={finish} /></Shell>;
  if (active === "draw") return <Shell gradient="from-violet-50 to-purple-50"><Header icon="🎨" title="Gambar Kegiatan" subtitle="Ekspresikan kegiatanmu melalui gambar." /><DrawingGame onDone={finish} /></Shell>;
  if (active === "pairs") return <Shell gradient="from-orange-50 to-amber-50"><Header icon="🔗" title="Cocokkan Kata" subtitle="Cocokkan nama hari dengan artinya." /><SimplePairs onDone={finish} /></Shell>;
  return <Shell gradient="from-pink-50 to-rose-50"><Header icon="🎮" title="Mini Game" subtitle="Joyful Learning: belajar melalui permainan aktif." gradient="from-pink-500 to-rose-500" /><div className="space-y-3">{games.map(([id, title], i) => <button key={id} onClick={() => setActive(id)} className="w-full bg-white rounded-3xl border-2 border-pink-200 p-5 flex items-center gap-4 text-left shadow-sm hover:scale-[1.02] transition-all"><span className="w-14 h-14 rounded-2xl bg-pink-100 flex items-center justify-center text-2xl">{i + 1}</span><span className="flex-1 font-black text-gray-800">{title}</span>{done.includes(id) ? <span className="w-8 h-8 rounded-full bg-green-500 text-white grid place-items-center">✓</span> : <span>→</span>}</button>)}</div>{done.length === games.length ? <ContinueButton onClick={() => { onScore(games.length); onComplete(); }}>Lanjut ke Evaluasi →</ContinueButton> : <div className="bg-gray-100 rounded-2xl p-4 text-center text-gray-500 text-sm">Selesaikan {games.length - done.length} permainan lagi.</div>}</Shell>;
}

function SimplePairs({ onDone }: { onDone: () => void }) {
  const items = DAYS.slice(0, 6);
  const [selected, setSelected] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  return <div className="space-y-3"><div className="grid grid-cols-2 gap-3">{items.map((item, i) => <button key={item.arabic} disabled={matched.includes(i)} onClick={() => setSelected(i)} className={`p-3 rounded-2xl border-2 ${matched.includes(i) ? "bg-green-100 border-green-300" : selected === i ? "bg-orange-100 border-orange-400" : "bg-white border-gray-200"}`}><Arabic>{matched.includes(i) ? "✓" : item.arabic}</Arabic></button>)}{items.map((item, i) => <button key={item.meaning} disabled={matched.includes(i)} onClick={() => { if (selected === i) { setMatched((m) => [...m, i]); setSelected(null); } }} className={`p-3 rounded-2xl border-2 ${matched.includes(i) ? "bg-green-100 border-green-300" : "bg-white border-gray-200"}`}>{matched.includes(i) ? "✓" : item.meaning}</button>)}</div>{matched.length === items.length && <ContinueButton onClick={onDone}>Selesai →</ContinueButton>}</div>;
}

export function ReflectionMaterialPage({ material, mindful, onComplete }: { material: MaterialId; mindful: MindfulAnswer | null; onComplete: (answers: string[]) => void }) {
  const questions = ["Apa yang kamu pelajari hari ini?", "Bagian apa yang paling kamu ingat?", "Aktivitas mana yang paling kamu sukai?", "Apa yang masih terasa sulit?", "Bagaimana perasaanmu setelah belajar?", "Apakah kamu sudah bisa membaca kata-kata Arab?", "Apakah kamu bisa memahami bahasa Arab yang kamu dengar?", "Apakah kamu sudah bisa berbicara menggunakan bahasa Arab?", "Apakah kamu sudah bisa menulis kata-kata Arab?"];
  const options = [
    [`Kosakata ${META[material].title}`, "Kalimat dalam konteks nyata", "Semua materi"],
    ["Kosakata", "Percakapan", "Contoh kalimat"],
    ["Mendengarkan", "Berbicara", "Menulis", "Mini game"],
    ["Pelafalan", "Memahami audio", "Menulis Arab", "Sudah cukup mudah"],
    ["Sangat senang", "Cukup senang", "Masih perlu berlatih", "Bersemangat belajar lagi"],
    ["Sudah bisa!", "Hampir bisa", "Belum bisa"],
    ["Sudah bisa!", "Hampir bisa", "Belum bisa"],
    ["Sudah bisa!", "Hampir bisa", "Belum bisa"],
    ["Sudah bisa!", "Hampir bisa", "Belum bisa"],
  ];
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const choose = (answer: string) => { const next = [...answers, answer]; setAnswers(next); setTimeout(() => setIndex((i) => i + 1), 250); };
  if (index >= questions.length) return <Shell gradient="from-amber-50 to-orange-50"><div className="bg-white rounded-3xl p-8 text-center shadow-xl space-y-5"><div className="text-6xl">💭</div><h2 className="text-2xl font-black">Refleksi Selesai</h2><p className="text-gray-500">Kamu sudah menilai pembelajaran dan empat keterampilan bahasamu.</p><ContinueButton onClick={() => onComplete(answers)}>Lihat Hasil Belajar →</ContinueButton></div></Shell>;
  return <Shell gradient="from-amber-50 to-orange-50"><Header icon="💭" title="Refleksi" subtitle={`Renungkan pengalaman belajar ${META[material].title}.`} gradient="from-amber-500 to-orange-500" />{mindful && <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 text-sm"><b>Jawaban Mindful Learning-mu:</b> {mindful.experience === "yes" ? mindful.memory : "Belum pernah mempelajari materi ini."}</div>}<div className="bg-white rounded-3xl p-6 shadow-lg space-y-4"><div className="text-xs font-bold text-amber-600">Pertanyaan {index + 1}/{questions.length}</div><h3 className="text-xl font-black text-gray-800">{questions[index]}</h3><div className="space-y-2">{options[index].map((option) => <button key={option} onClick={() => choose(option)} className="w-full p-4 rounded-2xl border-2 border-gray-200 text-left font-bold hover:border-amber-400 hover:bg-amber-50">{option}</button>)}</div></div></Shell>;
}

export function ResultMaterialPage({ material, name, gameScore, evalScore, reflection, onRestart, onMaterials }: { material: MaterialId; name: string; gameScore: number; evalScore: number; reflection: string[]; onRestart: () => void; onMaterials: () => void }) {
  return <Shell gradient="from-yellow-50 to-orange-50"><Header icon="🏆" title="Hasil Belajar" subtitle={`Selamat, ${name || "Pelajar"}! Kamu menuntaskan ${META[material].title}.`} gradient="from-orange-500 to-pink-500" /><div className="bg-white rounded-3xl p-6 shadow-xl space-y-5"><Arabic className="block text-4xl font-black text-center text-purple-700">{META[material].arabic}</Arabic><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-pink-50 border-2 border-pink-200 p-4 text-center"><div className="text-xs text-gray-500">Mini Game</div><div className="text-3xl font-black text-pink-600">{gameScore}</div></div><div className="rounded-2xl bg-purple-50 border-2 border-purple-200 p-4 text-center"><div className="text-xs text-gray-500">Evaluasi</div><div className="text-3xl font-black text-purple-600">{evalScore}/8</div></div></div><div className="bg-green-50 rounded-2xl p-4 border-2 border-green-200"><h3 className="font-black text-green-700 mb-2">Pembelajaran selesai</h3>{["Mindful Learning", "Materi dan konteks nyata", "Istimā'", "Kalām", "Kitābah", "Mini game", "Evaluasi", "Refleksi"].map((item) => <div key={item} className="text-sm text-gray-600 py-1">✓ {item}</div>)}</div>{reflection[4] && <div className="bg-amber-50 rounded-2xl p-4"><b>Perasaanmu:</b> {reflection[4]}</div>}<div className="grid grid-cols-2 gap-3"><button onClick={onMaterials} className="py-4 rounded-2xl border-2 border-cyan-300 text-cyan-700 font-black">Pilih Materi Lain</button><button onClick={onRestart} className="py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-black">Ke Beranda</button></div></div></Shell>;
}

export function getMaterialMeta(material: MaterialId) {
  return META[material];
}

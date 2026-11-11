import { useState, useRef, useEffect, useCallback } from "react";
import {
  getMaterialMeta,
  JoyfulMaterialPage,
  MeaningfulMaterialPage,
  MindfulMaterialPage,
  type MindfulAnswer,
} from "./MaterialExperience";
import evaluasiIstimaAudioUrl from "./audio/evaluasi-istima.mp3";
import istimaAudioUrl from "./audio/istima.mp3";
import kalamLevel1AudioUrl from "./audio/kalam-level-1.mp3";
import evaluasiIstimaAlwanAudioUrl from "./audio/evaluasi-istima-alwan.mp3";
import istimaAlwanAudioUrl from "./audio/istima-alwan.mp3";
import kalamLevel1AlwanAudioUrl from "./audio/kalam-level-1-alwan.mp3";
import hariMingguAudioUrl from "./audio/hari-minggu.mp3";
import hariSeninAudioUrl from "./audio/hari-senin.mp3";
import hariSelasaAudioUrl from "./audio/hari-selasa.mp3";
import hariRabuAudioUrl from "./audio/hari-rabu.mp3";
import hariKamisAudioUrl from "./audio/hari-kamis.mp3";
import hariJumatAudioUrl from "./audio/hari-jumat.mp3";
import hariSabtuAudioUrl from "./audio/hari-sabtu.mp3";
import yangManaAudioUrl from "./audio/yang-mana.mp3";
import sekarangAudioUrl from "./audio/sekarang.mp3";
import kemarinAudioUrl from "./audio/kemarin.mp3";
import kemarinLusaAudioUrl from "./audio/kemarin-lusa.mp3";
import besokAudioUrl from "./audio/besok.mp3";
import besokLusaAudioUrl from "./audio/besok-lusa.mp3";
import contohHariMingguAudioUrl from "./audio/contoh-kalimat-hari-minggu.mp3";
import contohHariSeninAudioUrl from "./audio/contoh-kalimat-hari-senin.mp3";
import contohHariSelasaAudioUrl from "./audio/contoh-kalimat-hari-selasa.mp3";
import contohHariRabuAudioUrl from "./audio/contoh-kalimat-hari-rabu.mp3";
import contohHariKamisAudioUrl from "./audio/contoh-kalimat-hari-kamis.mp3";
import contohHariJumatAudioUrl from "./audio/contoh-kalimat-hari-jumat.mp3";
import contohHariSabtuAudioUrl from "./audio/contoh-kalimat-hari-sabtu.mp3";
import contohYangManaAudioUrl from "./audio/contoh-kalimat-yang-mana.mp3";
import contohSekarangAudioUrl from "./audio/contoh-kalimat-sekarang.mp3";
import contohKemarinAudioUrl from "./audio/contoh-kalimat-kemarin.mp3";
import contohKemarinLusaAudioUrl from "./audio/contoh-kalimat-kemarin-lusa.mp3";
import contohBesokAudioUrl from "./audio/contoh-kalimat-besok.mp3";
import contohBesokLusaAudioUrl from "./audio/contoh-kalimat-besok-lusa.mp3";
import evaluasiIstimaAyyamAudioUrl from "./audio/evaluasi-istima-al-ayyam.mp3";
import istimaAyyamAudioUrl from "./audio/istima-al-ayyam.mp3";
import kalamLevel1AyyamAudioUrl from "./audio/kalam-level-1-al-ayyam.mp3";
import { claimAudioPlayback, playExclusiveAudio, stopExclusiveAudio } from "./audioPlayback";
import istimaTaarufIllustration from "./imports/ISTIMA_TAARUF_ILLUSTRATION.jpeg";
import istimaAlwanIllustration from "./imports/ISTIMA_ALWAN_ILLUSTRATION.jpeg";
import qiraahTaarufIllustration from "./imports/QIRAAH_TAARUF_ILLUSTRATION.jpeg";
import qiraahAlwanIllustration from "./imports/QIRAAH_ALWAN_ILLUSTRATION.jpeg";
import qiraahAyyamIllustration from "./imports/QIRAAH_AL-AYYAM_ILLUSTRATION.jpeg";

// ────────────────────────────────────────────────────────────────
// SOUND EFFECTS — Web Audio API
//
// HTMLAudioElement is unreliable on iOS Safari when created
// programmatically (not attached to the DOM), and the play/pause
// unlock trick introduces a race condition that can silence the
// very answer sound the user just triggered.
//
// Web Audio API (AudioContext + AudioBufferSourceNode) is the correct
// solution: we pre-fetch + decode the MP3 files into memory buffers,
// resume the AudioContext on the first user gesture, then play by
// creating a new BufferSourceNode (which is lightweight and designed
// to be created per-playback). Both resume() and start() are called
// synchronously inside the user's tap/click handler, which satisfies
// iOS Safari's "user gesture required" policy.
// ────────────────────────────────────────────────────────────────
let _actx: AudioContext | null = null;
const _bufs: Partial<Record<"correct" | "wrong", AudioBuffer>> = {};

function _getCtx(): AudioContext {
  if (!_actx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    _actx = new AC();
  }
  return _actx;
}

async function _loadBuf(type: "correct" | "wrong") {
  try {
    const ctx = _getCtx();
    const res = await fetch(`/src/imports/${type}.mp3`);
    if (!res.ok) return;
    const ab = await res.arrayBuffer();
    // decodeAudioData works on a suspended context — no gesture needed
    _bufs[type] = await ctx.decodeAudioData(ab);
  } catch {
    // Silent — missing file or decode error
  }
}

// Self-invoking init: pre-fetch buffers and wire up the gesture listener
(function _initSfx() {
  if (typeof window === "undefined") return;

  // Start fetching both files immediately so they are ready before first answer
  _loadBuf("correct");
  _loadBuf("wrong");

  // iOS Safari creates AudioContext in "suspended" state and requires
  // resume() to be called synchronously inside a native user gesture.
  // We do it on the very first touchstart or mousedown so that by the
  // time the user taps an answer button, the context is already running.
  const resumeCtx = () => {
    try {
      _getCtx().resume();
    } catch {}
    document.removeEventListener("touchstart", resumeCtx);
    document.removeEventListener("mousedown", resumeCtx);
  };
  document.addEventListener("touchstart", resumeCtx, { passive: true });
  document.addEventListener("mousedown", resumeCtx);
})();

// Called synchronously inside every answer onClick handler.
// AudioBufferSourceNode is designed to be single-use and created per play.
function playSound(type: "correct" | "wrong") {
  try {
    const ctx = _getCtx();
    // Also call resume() here in case the first gesture was the answer tap itself
    if (ctx.state === "suspended") ctx.resume();
    const buf = _bufs[type];
    if (!buf) return; // buffer not loaded yet — silent graceful skip
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0); // 0 = "as soon as possible" (or when context resumes)
  } catch {
    // Silently ignore — nothing more we can do without a user gesture
  }
}

// ────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────
type Page =
  | "home"
  | "about"
  | "info"
  | "profile"
  | "welcome"
  | "materials"
  | "mindful"
  | "meaningful"
  | "listening"
  | "reading"
  | "speaking"
  | "writing"
  | "joyful"
  | "evaluation"
  | "reflection"
  | "result";

type MaterialId = "taaruf" | "ayyam" | "alwan";

interface StudentProfile {
  name: string;
  kelas: string;
  avatar: string;
}

interface MindfulData {
  experience: "yes" | "no" | null;
  memory?: string | null;
  guess?: string | null;
}

interface ReflectionData {
  learned: string;
  remembered: string;
  liked: string;
  difficult: string;
  feeling: string;
  skillReading?: string;
  skillListening?: string;
  skillSpeaking?: string;
  skillWriting?: string;
}

interface MaharahProgress {
  listening: boolean;
  speaking: boolean;
  reading: boolean;
  writing: boolean;
}

type LearningStatus = "Belum dimulai" | "Sedang dikerjakan" | "Selesai";
type MaterialProgress = {
  status: LearningStatus;
  latestScore: number | null;
  maxScore: number;
  attempts: number;
  completedAt?: string;
};
type LearningProgress = Record<MaterialId, MaterialProgress>;
type SavedStudent = { profile: StudentProfile; progress: LearningProgress; exp: number; awarded: Record<string, true> };
type StudentStorage = { activeId: string | null; students: Record<string, SavedStudent> };

const STUDENT_STORAGE_KEY = "arabic-learning-students-v1";
const EMPTY_PROGRESS: LearningProgress = {
  taaruf: { status: "Belum dimulai", latestScore: null, maxScore: 9, attempts: 0 },
  ayyam: { status: "Belum dimulai", latestScore: null, maxScore: 11, attempts: 0 },
  alwan: { status: "Belum dimulai", latestScore: null, maxScore: 9, attempts: 0 },
};

function cloneEmptyProgress(): LearningProgress {
  return JSON.parse(JSON.stringify(EMPTY_PROGRESS)) as LearningProgress;
}

function loadStudentStorage(): StudentStorage {
  try {
    const saved = localStorage.getItem(STUDENT_STORAGE_KEY);
    if (!saved) return { activeId: null, students: {} };
    const parsed = JSON.parse(saved) as StudentStorage;
    const students = Object.fromEntries(Object.entries(parsed.students ?? {}).map(([id, student]) => [id, {
      ...student,
      progress: {
        taaruf: { ...EMPTY_PROGRESS.taaruf, ...student.progress?.taaruf, maxScore: 9 },
        ayyam: { ...EMPTY_PROGRESS.ayyam, ...student.progress?.ayyam, maxScore: 11 },
        alwan: { ...EMPTY_PROGRESS.alwan, ...student.progress?.alwan, maxScore: 9 },
      },
      exp: Math.min(1000, student.exp ?? 0),
      awarded: student.awarded ?? {},
    }]));
    return { activeId: parsed.activeId ?? null, students };
  } catch {
    return { activeId: null, students: {} };
  }
}

// ────────────────────────────────────────────────────────────────
// CONTENT: الأيام
// ────────────────────────────────────────────────────────────────
const DAYS = [
  { arabic: "يَوْمُ الْأَحَدِ", transliteration: "Yaumul-Ahadi", indonesian: "Hari Minggu", emoji: "🌅", bg: "bg-orange-50", border: "border-orange-300", accent: "text-orange-600", badgeBg: "bg-orange-100", sentence: "يَوْمُ الْأَحَدِ هُوَ أَوَّلُ أَيَّامِ الْأُسْبُوعِ.", sentenceId: "Hari Minggu adalah hari pertama dalam seminggu.", context: "Di hari Minggu, kamu bisa beristirahat dan bermain bersama keluarga!" },
  { arabic: "يَوْمُ الإِثْنَيْنِ", transliteration: "Yaumul-Itsnayni", indonesian: "Hari Senin", emoji: "📚", bg: "bg-sky-50", border: "border-sky-300", accent: "text-sky-600", badgeBg: "bg-sky-100", sentence: "نَذْهَبُ إِلَى الْمَدْرَسَةِ فِي يَوْمِ الإِثْنَيْنِ.", sentenceId: "Hari Senin kita pergi ke sekolah.", context: "Hari Senin biasanya ada upacara bendera di sekolah!" },
  { arabic: "يَوْمُ الثُّلَاثَاءِ", transliteration: "Yaumuts-tsulātsāi", indonesian: "Hari Selasa", emoji: "✏️", bg: "bg-green-50", border: "border-green-300", accent: "text-green-600", badgeBg: "bg-green-100", sentence: "أَدْرُسُ الرِّيَاضِيَّاتِ فِي يَوْمِ الثُّلَاثَاءِ.", sentenceId: "Hari Selasa aku belajar matematika.", context: "Apa pelajaran favoritmu di hari Selasa?" },
  { arabic: "يَوْمُ الْأَرْبِعَاءِ", transliteration: "Yaumul-arbi'āi", indonesian: "Hari Rabu", emoji: "🌿", bg: "bg-teal-50", border: "border-teal-300", accent: "text-teal-600", badgeBg: "bg-teal-100", sentence: "نَلْعَبُ كُرَةَ الْقَدَمِ فِي يَوْمِ الْأَرْبِعَاءِ.", sentenceId: "Hari Rabu kami bermain sepak bola.", context: "Rabu biasanya ada kegiatan ekstrakulikuler di sekolah!" },
  { arabic: "يَوْمُ الْخَمِيسِ", transliteration: "Yaumul-khamīsi", indonesian: "Hari Kamis", emoji: "⭐", bg: "bg-yellow-50", border: "border-yellow-300", accent: "text-yellow-600", badgeBg: "bg-yellow-100", sentence: "أَقْرَأُ الْكُتُبَ فِي يَوْمِ الْخَمِيسِ.", sentenceId: "Hari Kamis aku membaca buku.", context: "Kamis adalah hari terakhir sebelum akhir pekan. Semangat!" },
  { arabic: "يَوْمُ الْجُمْعَةِ", transliteration: "Yaumul-jum'ati", indonesian: "Hari Jumat", emoji: "🕌", bg: "bg-purple-50", border: "border-purple-300", accent: "text-purple-600", badgeBg: "bg-purple-100", sentence: "يَوْمُ الْجُمْعَةِ هُوَ يَوْمٌ مُبَارَكٌ.", sentenceId: "Hari Jumat adalah hari yang penuh berkah.", context: "Jumat adalah hari istimewa! Ada shalat Jumat bagi yang muslim." },
  { arabic: "يَوْمُ السَّبْتِ", transliteration: "Yaumus-Sabti", indonesian: "Hari Sabtu", emoji: "🎮", bg: "bg-pink-50", border: "border-pink-300", accent: "text-pink-600", badgeBg: "bg-pink-100", sentence: "أَسْتَرِيحُ مَعَ الْعَائِلَةِ فِي يَوْمِ السَّبْتِ.", sentenceId: "Hari Sabtu aku beristirahat bersama keluarga.", context: "Sabtu adalah hari libur! Waktunya bermain dan bersantai." },
];

const DIALOGUE = [
  { speaker: "س", arabic: "أَيُّ يَوْمٍ الْآنَ؟", indonesian: "Hari apa sekarang?", side: "left" },
  { speaker: "ج", arabic: "الْآنَ يَوْمُ الإِثْنَيْنِ.", indonesian: "Sekarang hari Senin.", side: "right" },
  { speaker: "س", arabic: "أَيُّ يَوْمٍ بِالْأَمْسِ؟", indonesian: "Hari apa kemarin?", side: "left" },
  { speaker: "ج", arabic: "بِالْأَمْسِ يَوْمُ الْأَحَدِ.", indonesian: "Kemarin hari Minggu.", side: "right" },
  { speaker: "س", arabic: "أَيُّ يَوْمٍ أَوَّلُ أَمْسِ؟", indonesian: "Hari apa kemarin lusa?", side: "left" },
  { speaker: "ج", arabic: "أَوَّلُ أَمْسِ يَوْمُ السَّبْتِ.", indonesian: "Kemarin lusa hari Sabtu.", side: "right" },
  { speaker: "س", arabic: "أَيُّ يَوْمٍ غَدًا؟", indonesian: "Hari apa besok?", side: "left" },
  { speaker: "ج", arabic: "غَدًا يَوْمُ الثُّلَاثَاءِ.", indonesian: "Besok hari Selasa.", side: "right" },
  { speaker: "س", arabic: "أَيُّ يَوْمٍ بَعْدَ غَدٍ؟", indonesian: "Hari apa besok lusa?", side: "left" },
  { speaker: "ج", arabic: "بَعْدَ غَدٍ يَوْمُ الْأَرْبِعَاءِ.", indonesian: "Besok lusa hari Rabu.", side: "right" },
];

const EXTRA_VOCAB = [
  { arabic: "أَيُّ", transliteration: "ayyu", indonesian: "Yang mana / Apa", emoji: "❓", bg: "bg-blue-50", border: "border-blue-300", accent: "text-blue-600", badgeBg: "bg-blue-100", sentence: "أَيُّ يَوْمٍ الْآنَ؟", sentenceId: "Hari apa sekarang?", context: "Kata tanya untuk menanyakan hari." },
  { arabic: "الْآنَ", transliteration: "al-āna", indonesian: "Sekarang", emoji: "⏰", bg: "bg-cyan-50", border: "border-cyan-300", accent: "text-cyan-600", badgeBg: "bg-cyan-100", sentence: "الْآنَ يَوْمُ الإِثْنَيْنِ.", sentenceId: "Sekarang hari Senin.", context: "Digunakan untuk menyatakan waktu saat ini." },
  { arabic: "بِالْأَمْسِ", transliteration: "bil-amsi", indonesian: "Kemarin", emoji: "📅", bg: "bg-indigo-50", border: "border-indigo-300", accent: "text-indigo-600", badgeBg: "bg-indigo-100", sentence: "بِالْأَمْسِ يَوْمُ الْأَحَدِ.", sentenceId: "Kemarin hari Minggu.", context: "Merujuk pada hari sebelum hari ini." },
  { arabic: "أَوَّلُ الْأَمْسِ", transliteration: "awwalu al-amsi", indonesian: "Kemarin lusa", emoji: "⏪", bg: "bg-violet-50", border: "border-violet-300", accent: "text-violet-600", badgeBg: "bg-violet-100", sentence: "أَوَّلُ الْأَمْسِ يَوْمُ السَّبْتِ.", sentenceId: "Kemarin lusa hari Sabtu.", context: "Merujuk pada dua hari sebelum hari ini." },
  { arabic: "غَدًا", transliteration: "ghadan", indonesian: "Besok", emoji: "🌤️", bg: "bg-amber-50", border: "border-amber-300", accent: "text-amber-600", badgeBg: "bg-amber-100", sentence: "غَدًا يَوْمُ الثُّلَاثَاءِ.", sentenceId: "Besok hari Selasa.", context: "Merujuk pada hari setelah hari ini." },
  { arabic: "بَعْدَ غَدٍ", transliteration: "ba'da ghadin", indonesian: "Besok lusa", emoji: "⏩", bg: "bg-rose-50", border: "border-rose-300", accent: "text-rose-600", badgeBg: "bg-rose-100", sentence: "بَعْدَ غَدٍ يَوْمُ الْأَرْبِعَاءِ.", sentenceId: "Besok lusa hari Rabu.", context: "Merujuk pada dua hari setelah hari ini." },
];

const AYYAM_VOCAB_AUDIO = [
  { vocabulary: hariMingguAudioUrl, example: contohHariMingguAudioUrl },
  { vocabulary: hariSeninAudioUrl, example: contohHariSeninAudioUrl },
  { vocabulary: hariSelasaAudioUrl, example: contohHariSelasaAudioUrl },
  { vocabulary: hariRabuAudioUrl, example: contohHariRabuAudioUrl },
  { vocabulary: hariKamisAudioUrl, example: contohHariKamisAudioUrl },
  { vocabulary: hariJumatAudioUrl, example: contohHariJumatAudioUrl },
  { vocabulary: hariSabtuAudioUrl, example: contohHariSabtuAudioUrl },
  { vocabulary: yangManaAudioUrl, example: contohYangManaAudioUrl },
  { vocabulary: sekarangAudioUrl, example: contohSekarangAudioUrl },
  { vocabulary: kemarinAudioUrl, example: contohKemarinAudioUrl },
  { vocabulary: kemarinLusaAudioUrl, example: contohKemarinLusaAudioUrl },
  { vocabulary: besokAudioUrl, example: contohBesokAudioUrl },
  { vocabulary: besokLusaAudioUrl, example: contohBesokLusaAudioUrl },
];

const STORY = {
  arabic: "أَنَا طَالِبٌ فِي الصَّفِّ السَّابِعِ. اسْمِي أَحْمَدُ.\nأَذْهَبُ إِلَى الْمَدْرَسَةِ فِي أَيَّامِ الإِثْنَيْنِ وَالثُّلَاثَاءِ وَالْأَرْبِعَاءِ وَالْخَمِيسِ.\nيَوْمَ الْجُمُعَةِ أُصَلِّي فِي الْمَسْجِدِ مَعَ أَبِي.\nيَوْمَ السَّبْتِ وَالْأَحَدِ أَسْتَرِيحُ فِي الْبَيْتِ.\nأُحِبُّ يَوْمَ الْجُمُعَةِ كَثِيرًا!",
  indonesian: "Saya seorang siswa kelas tujuh. Nama saya Ahmad.\nSaya pergi ke sekolah pada hari Senin, Selasa, Rabu, dan Kamis.\nHari Jumat saya shalat di masjid bersama ayah saya.\nHari Sabtu dan Minggu saya beristirahat di rumah.\nSaya sangat suka hari Jumat!",
};

const ARRANGE_DATA = [
  { words: ["السَّبْتِ.", "يَوْمُ", "أَمْسِ", "أَوَّلُ"], correct: ["أَوَّلُ", "أَمْسِ", "يَوْمُ", "السَّبْتِ."], meaning: "Kemarin lusa adalah hari Sabtu." },
  { words: ["الْأَحَدِ.", "يَوْمُ", "أَمْسِ"], correct: ["أَمْسِ", "يَوْمُ", "الْأَحَدِ."], meaning: "Kemarin adalah hari Minggu." },
  { words: ["الِاثْنَيْنِ.", "يَوْمُ", "الْيَوْمُ"], correct: ["الْيَوْمُ", "يَوْمُ", "الِاثْنَيْنِ."], meaning: "Hari ini adalah hari Senin." },
  { words: ["الثُّلَاثَاءِ.", "يَوْمُ", "غَدًا"], correct: ["غَدًا", "يَوْمُ", "الثُّلَاثَاءِ."], meaning: "Besok adalah hari Selasa." },
  { words: ["الْأَرْبِعَاءِ.", "يَوْمُ", "غَدٍ", "بَعْدَ"], correct: ["بَعْدَ", "غَدٍ", "يَوْمُ", "الْأَرْبِعَاءِ."], meaning: "Besok lusa adalah hari Rabu." },
];

// ────────────────────────────────────────────────────────────────
// SHARED: AudioPlayer
// ────────────────────────────────────────────────────────────────
function AudioPlayer({
  label,
  duration = 22,
  onComplete,
  compact = false,
  src,
}: {
  label?: string;
  duration?: number;
  onComplete?: () => void;
  compact?: boolean;
  src?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [done, setDone] = useState(false);
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
    if (!audio || !src) {
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
    if (!audio || !src) {
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

  const fmt = (pct: number) => {
    const audioDuration = audioRef.current?.duration || duration;
    const s = Math.floor((pct / 100) * audioDuration);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div className={`bg-white rounded-2xl border-2 border-cyan-200 p-4 space-y-3 ${compact ? "p-3" : ""}`}>
      {src && (
        <audio
          ref={audioRef}
          src={src}
          preload="auto"
          onLoadedMetadata={(event) => {
            const audioDuration = event.currentTarget.duration;
            if (Number.isFinite(audioDuration) && audioDuration > 0) setProgress((event.currentTarget.currentTime / audioDuration) * 100);
          }}
          onTimeUpdate={(event) => {
            const { currentTime, duration: audioDuration } = event.currentTarget;
            if (Number.isFinite(audioDuration) && audioDuration > 0) setProgress((currentTime / audioDuration) * 100);
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
        />
      )}

      {label && <p className="text-xs font-bold text-cyan-600 font-body">{label}</p>}

      <div className="space-y-1">
        <div
          className="h-3 bg-gray-100 rounded-full overflow-hidden cursor-pointer"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const pct = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
            if (audioRef.current && src && audioRef.current.duration) {
              audioRef.current.currentTime = (pct / 100) * audioRef.current.duration;
            }
            setProgress(pct);
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 font-body">
          <span>{fmt(progress)}</span>
          <span>{fmt(100)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={replay}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 active:scale-90 transition-all text-sm"
        >
          ↩
        </button>

        <button
          onClick={toggle}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl hover:scale-110 active:scale-95 transition-all shadow-md"
        >
          {playing ? "⏸" : done ? "↺" : "▶"}
        </button>

        {!compact && (
          <div className="flex gap-1">
            {[0.75, 1, 1.25].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSpeed(s);
                  if (audioRef.current) audioRef.current.playbackRate = s;
                }}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${speed === s ? "bg-cyan-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
              >
                {s}×
              </button>
            ))}
          </div>
        )}
      </div>

      {playing && (
        <div className="flex items-center justify-center gap-0.5 h-6">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-cyan-400 rounded-full animate-pulse"
              style={{ height: `${8 + ((i * 7) % 12)}px`, animationDelay: `${i * 0.06}s` }}
            />
          ))}
        </div>
      )}
      {audioError && (
        <div role="alert" className="space-y-2 text-center">
          <p className="text-sm font-bold text-red-600">{audioError}</p>
          {src && <button onClick={replay} className="rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100">Coba lagi</button>}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// SHARED: MicRecorder (real MediaRecorder API with UI fallback)
// ────────────────────────────────────────────────────────────────
type RecordState = "idle" | "requesting" | "recording" | "done";

function microphoneErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") return "Izin mikrofon ditolak. Izinkan akses mikrofon, lalu coba lagi.";
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") return "Mikrofon tidak ditemukan. Sambungkan mikrofon, lalu coba lagi.";
    if (error.name === "NotReadableError" || error.name === "TrackStartError") return "Mikrofon sedang digunakan aplikasi lain atau tidak dapat dibuka.";
  }
  return error instanceof Error ? `Perekaman gagal: ${error.message}` : "Perekaman gagal. Periksa mikrofon dan coba lagi.";
}

function MicRecorder({
  onSubmit,
  submitLabel = "✓ Selesai",
}: {
  onSubmit?: (blob: Blob | null) => void;
  submitLabel?: string;
}) {
  const [state, setState] = useState<RecordState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [blobData, setBlobData] = useState<Blob | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const recorderContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state === "recording" || state === "done") {
      recorderContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [state]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);

  const startTimer = () => {
    setSeconds(0);
    timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  const stopTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

  const startRecording = async () => {
    setRecordingError(null);
    setState("requesting");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setState("idle");
      setRecordingError("Perekaman mikrofon tidak didukung di browser ini. Gunakan browser terbaru melalui koneksi HTTPS.");
      return;
    }

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const supportedMimeType = typeof MediaRecorder.isTypeSupported === "function"
        ? ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((mimeType) => MediaRecorder.isTypeSupported(mimeType))
        : undefined;
      const recorder = new MediaRecorder(stream, supportedMimeType ? { mimeType: supportedMimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stopTimer();
        stream?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (!chunksRef.current.length) {
          setState("idle");
          setRecordingError("Tidak ada audio yang terekam. Periksa mikrofon, lalu rekam lagi.");
          return;
        }
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || chunksRef.current[0].type || "audio/webm" });
        const nextAudioUrl = URL.createObjectURL(blob);
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = nextAudioUrl;
        setAudioUrl(nextAudioUrl);
        setBlobData(blob);
        setState("done");
      };
      recorder.onerror = () => {
        stopTimer();
        stream?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setState("idle");
        setRecordingError("Perekaman terhenti karena kesalahan mikrofon. Coba lagi.");
      };
      recorder.start();
      setState("recording");
      startTimer();
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setState("idle");
      setRecordingError(microphoneErrorMessage(error));
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    } else {
      stopTimer();
      setState("idle");
      setRecordingError("Perekaman tidak aktif. Mulai rekam lagi.");
    }
  };

  const reset = () => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
    setState("idle");
    setSeconds(0);
    setAudioUrl(null);
    setBlobData(null);
    setRecordingError(null);
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div ref={recorderContainerRef} className="bg-white rounded-2xl border-2 border-rose-200 p-5 space-y-4">
      {recordingError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-center text-sm font-bold text-red-700">{recordingError}</p>}
      {state === "idle" && (
        <div className="text-center space-y-3">
          <button onClick={startRecording}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-5xl mx-auto shadow-lg hover:scale-110 active:scale-95 transition-all">
            🎤
          </button>
          <p className="text-gray-400 font-body text-sm">Tekan untuk mulai merekam</p>
        </div>
      )}
      {state === "requesting" && <p role="status" className="text-center text-sm font-bold text-rose-600">Meminta izin mikrofon...</p>}
      {state === "recording" && (
        <div className="text-center space-y-3">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-red-400 opacity-25 animate-ping" />
            <button onClick={stopRecording}
              className="relative w-24 h-24 rounded-full bg-red-500 flex items-center justify-center text-4xl shadow-lg hover:bg-red-600 active:scale-95 transition-all">
              ⏹
            </button>
          </div>
          <div className="text-red-500 font-black text-2xl" style={{ fontFamily: "Nunito, sans-serif" }}>{fmt(seconds)}</div>
          <p className="text-gray-400 font-body text-xs flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
            Sedang merekam...
          </p>
          <div className="flex items-center justify-center gap-0.5 h-8">
            {Array.from({ length: 22 }).map((_, i) => (
              <div key={i} className="w-1.5 bg-red-400 rounded-full animate-pulse"
                style={{ height: `${12 + ((i * 5 + 3) % 16)}px`, animationDelay: `${i * 0.04}s`, animationDuration: `${0.5 + (i % 3) * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}
      {state === "done" && (
        <div className="text-center space-y-4">
          <div className="text-5xl bounce-in">✅</div>
          <p className="font-bold text-green-600 font-body text-sm">Rekaman selesai! ({fmt(seconds)})</p>
          {audioUrl && <audio
            controls
            src={audioUrl}
            className="w-full rounded-xl"
            onPlay={(event) => claimAudioPlayback(event.currentTarget)}
            onPause={(event) => stopExclusiveAudio(event.currentTarget)}
            onEnded={(event) => stopExclusiveAudio(event.currentTarget)}
            onError={() => setRecordingError("Rekaman tidak dapat diputar. Rekam ulang sebelum mengirim.")}
          />}
          <div className="flex gap-2">
            <button onClick={reset}
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold font-body hover:bg-gray-200 active:scale-95 transition-all text-sm">
              ↩ Rekam Ulang
            </button>
            <button onClick={() => { if (blobData) onSubmit?.(blobData); }}
              disabled={!blobData}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-600 text-white font-black hover:scale-105 active:scale-95 transition-all"
              style={{ fontFamily: "Nunito, sans-serif" }}>
              {submitLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// SHARED UI
// ────────────────────────────────────────────────────────────────
function ArabicText({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <span dir="rtl" className={className} style={{ fontFamily: "'Noto Naskh Arabic', 'Arial', serif", ...style }}>
      {children}
    </span>
  );
}

function GeomShapes() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
      <div className="absolute top-8 left-8 w-20 h-20 rounded-full bg-yellow-200 opacity-50" />
      <div className="absolute top-28 right-16 w-12 h-12 rotate-45 bg-pink-200 opacity-60" />
      <div className="absolute bottom-48 left-1/4 w-16 h-16 rounded-full bg-cyan-200 opacity-50" />
      <div className="absolute bottom-16 right-8 w-28 h-28 rounded-full bg-purple-200 opacity-40" />
      <div className="absolute top-1/2 left-4 w-10 h-10 rotate-12 bg-green-200 opacity-60" />
      <div className="absolute top-16 left-1/2 w-8 h-8 rounded-full bg-orange-200 opacity-50" />
      <div className="absolute bottom-1/3 right-1/3 w-12 h-12 rotate-45 bg-yellow-300 opacity-35" />
    </div>
  );
}

function NavBar({ page, onHome, onMaterials, materialTitle = "الأَيَّامُ" }: { page: Page; onHome: () => void; onMaterials: () => void; materialTitle?: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const labels: Record<Page, string> = {
    home: "", about: "👤 Tentang Pembuat", info: "ℹ️ Tujuan Pembelajaran",
    profile: "✨ Profil Pelajar", welcome: "🌟 Selamat Datang", materials: "📚 Pilih Materi",
    mindful: "🧠 Mindful Learning",
    meaningful: `📖 Materi ${materialTitle}`,
    listening: "🎧 Istimā' — Mendengar",
    reading: "📖 Qirā'ah — Membaca",
    speaking: "🎤 Kalām — Berbicara",
    writing: "✍️ Kitābah — Menulis",
    joyful: "🎮 Mini Game",
    evaluation: "📝 Evaluasi",
    reflection: "💭 Refleksi",
    result: "🏆 Hasil Belajar",
  };
  const learningPages: Page[] = ["mindful", "meaningful", "listening", "reading", "speaking", "writing", "joyful", "evaluation", "reflection", "result"];
  const showWarning = learningPages.includes(page);

  if (page === "home") return null;
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b-2 border-cyan-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => showWarning ? setShowConfirm(true) : onHome()}
          className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 text-lg font-bold hover:bg-cyan-200 active:scale-90 transition-all">
          ←
        </button>
        <span className="font-bold text-gray-700" style={{ fontFamily: "Nunito, sans-serif" }}>{labels[page]}</span>
      </div>
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full space-y-4 pop-in">
            <div className="text-center space-y-2">
              <div className="text-4xl">⚠️</div>
              <h3 className="text-xl font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>Kembali ke Pilih Materi?</h3>
              <p className="text-gray-500 font-body text-sm">Progress materi ini akan ditutup, tetapi nama, kelas, dan avatarmu tetap tersimpan.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="py-3 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                style={{ fontFamily: "Nunito, sans-serif" }}>
                Batalkan
              </button>
              <button onClick={() => { setShowConfirm(false); onMaterials(); }}
                className="py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black hover:scale-105 active:scale-95 transition-all"
                style={{ fontFamily: "Nunito, sans-serif" }}>
                Pilih Materi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StepBar(_props: { page: Page }) {
  return null;
}

// ────────────────────────────────────────────────────────────────
// HOME PAGE
// ────────────────────────────────────────────────────────────────
function HomePage({ onStart, onNav }: { onStart: () => void; onNav: (p: Page) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <GeomShapes />
      {/* Hamburger button */}
      <button onClick={() => setMenuOpen(true)}
        className="fixed top-5 right-5 z-50 w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-sm shadow-md border border-gray-200 flex flex-col items-center justify-center gap-1.5 hover:bg-gray-50 active:scale-95 transition-all">
        <div className="w-5 h-0.5 bg-gray-600 rounded-full" />
        <div className="w-5 h-0.5 bg-gray-600 rounded-full" />
        <div className="w-5 h-0.5 bg-gray-600 rounded-full" />
      </button>
      {/* Hamburger menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setMenuOpen(false)}>
          <div className="flex-1" />
          <div className="w-64 bg-white shadow-2xl flex flex-col p-6 space-y-2 pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-black text-gray-800 text-lg" style={{ fontFamily: "Nunito, sans-serif" }}>Menu</span>
              <button onClick={() => setMenuOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 active:scale-90 transition-all text-sm font-bold">✕</button>
            </div>
            {[
              { icon: "🏠", label: "Home", action: () => { setMenuOpen(false); } },
              { icon: "👤", label: "About", action: () => { setMenuOpen(false); onNav("about"); } },
              { icon: "ℹ️", label: "Info", action: () => { setMenuOpen(false); onNav("info"); } },
            ].map((item) => (
              <button key={item.label} onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-amber-50 active:scale-95 transition-all text-left">
                <span className="text-xl">{item.icon}</span>
                <span className="font-bold text-gray-700" style={{ fontFamily: "Nunito, sans-serif" }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="relative z-10 max-w-lg w-full text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent leading-tight" style={{ fontFamily: "Nunito, sans-serif", textWrap: "balance" }}>
            Hai! Siap belajar Bahasa Arab dengan cara yang seru dan menyenangkan?
          </h1>
        </div>
        <button onClick={onStart}
          className="w-full py-5 rounded-3xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-2xl font-black shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200"
          style={{ fontFamily: "Nunito, sans-serif" }}>
          🚀 Mulai Belajar!
        </button>
        <p className="text-gray-400 text-sm font-body">Deep Learning · 4 Maharah Bahasa</p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// MATERIALS PAGE
// ────────────────────────────────────────────────────────────────
function MaterialsPage({ onSelect }: { onSelect: (material: MaterialId) => void }) {
  const materials: { id: MaterialId; arabic: string; title: string; description: string; icon: string; count: string; theme: string }[] = [
    { id: "taaruf", arabic: "التَّعَارُفُ", title: "Perkenalan", description: "Berkenalan, menanyakan kabar, tempat tinggal, alamat, dan sekolah.", icon: "👋", count: "4 Situasi", theme: "from-orange-400 to-pink-500" },
    { id: "ayyam", arabic: "الْأَيَّامُ", title: "Hari-hari dalam Seminggu", description: "Pelajari nama hari dan ungkapan waktu melalui empat keterampilan bahasa.", icon: "📅", count: "13 Kosakata", theme: "from-cyan-400 to-purple-500" },
    { id: "alwan", arabic: "الْأَلْوَانُ", title: "Warna", description: "Kenali warna melalui benda-benda yang dekat dengan kehidupan sehari-hari.", icon: "🎨", count: "8 Kosakata", theme: "from-emerald-400 to-cyan-500" },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-sky-100 p-6 pt-20">
      <GeomShapes />
      <div className="relative z-10 max-w-lg mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>Pilih Materi</h2>
          <p className="text-gray-500 font-body mt-1">Klik materi yang ingin kamu pelajari!</p>
        </div>
        <div className="space-y-4">
          {materials.map((material, index) => (
            <button key={material.id} onClick={() => onSelect(material.id)} className="w-full bg-white rounded-3xl shadow-xl border-2 border-cyan-300 p-6 space-y-4 hover:scale-105 active:scale-95 transition-all duration-200 text-left">
              <div className="flex items-start gap-4">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${material.theme} flex items-center justify-center text-4xl shrink-0`}>{material.icon}</div>
                <div className="flex-1">
                  <div className="text-xs font-black text-cyan-500 mb-1" style={{ fontFamily: "Nunito, sans-serif" }}>MATERI {index + 1}</div>
                  <ArabicText className="block text-3xl font-black text-gray-800">{material.arabic}</ArabicText>
                  <div className="text-xl font-bold text-cyan-600" style={{ fontFamily: "Nunito, sans-serif" }}>{material.title}</div>
                  <p className="text-gray-500 font-body text-sm mt-1">{material.description}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {["Pemula", material.count, "4 Maharah"].map((badge) => <span key={badge} className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-bold">{badge}</span>)}
              </div>
              <div className={`w-full py-4 rounded-2xl bg-gradient-to-r ${material.theme} text-white text-lg font-black text-center`} style={{ fontFamily: "Nunito, sans-serif" }}>Mulai Belajar →</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudentWelcomePage({ profile, progress, exp, awarded, onStart, onNewProfile }: { profile: StudentProfile; progress: LearningProgress; exp: number; awarded: Record<string, true>; onStart: () => void; onNewProfile: () => void }) {
  const [showProfile, setShowProfile] = useState(false);
  const materials: { id: MaterialId; arabic: string; name: string; icon: string; color: string }[] = [
    { id: "taaruf", arabic: "التَّعَارُفُ", name: "Ta'aruf", icon: "👋", color: "border-orange-200 bg-orange-50" },
    { id: "ayyam", arabic: "الْأَيَّامُ", name: "Al-Ayyam", icon: "📅", color: "border-cyan-200 bg-cyan-50" },
    { id: "alwan", arabic: "الْأَلْوَانُ", name: "Al-Alwan", icon: "🎨", color: "border-emerald-200 bg-emerald-50" },
  ];
  const completed = materials.filter(({ id }) => progress[id].status === "Selesai").length;
  const level = Math.min(10, Math.floor(exp / 100) + 1);
  const nextLevelExp = level === 10 ? 1000 : level * 100;
  const levelBase = (level - 1) * 100;
  const levelProgress = level === 10 ? 100 : ((exp - levelBase) / 100) * 100;
  const targetActivities: Record<MaterialId, number> = { taaruf: 42, ayyam: 34, alwan: 57 };
  const materialPercent = (id: MaterialId) => progress[id].status === "Selesai" ? 100 : Math.min(99, Math.round((Object.keys(awarded).filter((key) => key.startsWith(`${id}:`)).length / targetActivities[id]) * 100));
  const overallPercent = Math.round(materials.reduce((sum, { id }) => sum + materialPercent(id), 0) / 3);
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-cyan-50 to-purple-50 p-6 pt-24 pb-12">
      <GeomShapes />
      <div className="relative z-10 max-w-lg mx-auto space-y-5">
        <div className="bg-white rounded-3xl shadow-xl border-2 border-cyan-200 p-6 text-center bounce-in">
          <div className="text-6xl mb-2">{profile.avatar}</div>
          <h1 className="text-3xl font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>Hi, {profile.name}!</h1>
          <p className="text-gray-700 font-bold mt-1">Apa yang mau kamu pelajari hari ini?</p>
          <p className="text-gray-500 font-body text-sm mt-3">Mari lanjutkan petualangan belajar Bahasa Arab dengan penuh semangat!</p>
          <button onClick={() => setShowProfile(true)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 text-cyan-700 font-bold text-sm"><span>{profile.avatar}</span> Profil · Level {level} · {exp} EXP</button>
        </div>
        <div className="bg-gradient-to-r from-cyan-500 to-purple-600 rounded-3xl p-5 text-white">
          <div className="flex items-center justify-between"><div><p className="text-xs text-white/70 font-bold">PROGRES KESELURUHAN</p><p className="text-2xl font-black" style={{ fontFamily: "Nunito, sans-serif" }}>{completed}/3 Materi Selesai</p></div><div className="text-4xl">📊</div></div>
          <div className="h-3 bg-white/20 rounded-full mt-3 overflow-hidden"><div className="h-full bg-white rounded-full transition-all" style={{ width: `${(completed / 3) * 100}%` }} /></div>
        </div>
        <div className="space-y-3">
          {materials.map((item) => {
            const result = progress[item.id];
            const statusColor = result.status === "Selesai" ? "text-green-700 bg-green-100" : result.status === "Sedang dikerjakan" ? "text-orange-700 bg-orange-100" : "text-gray-500 bg-gray-100";
            const percent = materialPercent(item.id);
            return <div key={item.id} className={`rounded-3xl border-2 p-4 ${item.color} shadow-sm`}>
              <div className="flex items-center gap-3"><div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-3xl shadow-sm">{item.icon}</div><div className="flex-1"><ArabicText className="block text-xl font-black text-gray-800">{item.arabic}</ArabicText><p className="text-sm font-bold text-gray-600">{item.name}</p></div><span className={`px-3 py-1.5 rounded-full text-[11px] font-black ${statusColor}`}>{result.status}</span></div>
              <div className="grid grid-cols-2 gap-2 mt-3"><div className="bg-white/80 rounded-xl p-2 text-center"><p className="text-[10px] text-gray-400">Nilai Evaluasi Terbaru</p><p className="font-black text-gray-700">{result.latestScore === null ? "—" : `${result.latestScore}/${result.maxScore}`}</p></div><div className="bg-white/80 rounded-xl p-2 text-center"><p className="text-[10px] text-gray-400">Jumlah Percobaan</p><p className="font-black text-gray-700">{result.attempts}</p></div></div>
              <div className="mt-3"><div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>Progres materi</span><b>{percent}%</b></div><div className="h-2 bg-white rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500" style={{ width: `${percent}%` }} /></div></div>
            </div>;
          })}
        </div>
        <button onClick={onStart} className="w-full py-5 rounded-3xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all" style={{ fontFamily: "Nunito, sans-serif" }}>🚀 Mulai Belajar</button>
        <button onClick={onNewProfile} className="w-full py-3 rounded-2xl bg-white border-2 border-gray-200 text-gray-500 font-bold hover:border-cyan-300 active:scale-95 transition-all">Gunakan Profil Siswa Lain</button>
        {showProfile && <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-6" onClick={() => setShowProfile(false)}><div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full space-y-5 pop-in" onClick={(event) => event.stopPropagation()}><div className="text-center"><div className="text-6xl">{profile.avatar}</div><h2 className="text-2xl font-black text-gray-800">{profile.name}</h2><p className="text-gray-500">Kelas {profile.kelas}</p></div><div className="flex justify-center"><div className="w-36 h-36 rounded-full flex items-center justify-center" style={{ background: `conic-gradient(#06b6d4 ${overallPercent * 3.6}deg, #e5e7eb 0deg)` }}><div className="w-28 h-28 bg-white rounded-full flex flex-col items-center justify-center"><b className="text-3xl text-cyan-600">{overallPercent}%</b><span className="text-[10px] text-gray-400">progres belajar</span></div></div></div><div className="bg-purple-50 rounded-2xl p-4 border-2 border-purple-200"><div className="flex justify-between font-black text-purple-700"><span>Level {level}</span><span>{exp} / {nextLevelExp} EXP</span></div><div className="h-3 bg-white rounded-full overflow-hidden mt-2"><div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${levelProgress}%` }} /></div><p className="text-xs text-purple-600 mt-2 text-center">{level === 10 ? "Hebat! Kamu sudah mencapai Level Maksimum! Kamu telah mencapai level tertinggi. Pertahankan semangat belajarmu!" : "Sedikit lagi menuju level berikutnya!"}</p></div><button onClick={() => setShowProfile(false)} className="w-full py-3 rounded-2xl bg-cyan-500 text-white font-black">Tutup</button></div></div>}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// STUDENT PROFILE PAGE
// ────────────────────────────────────────────────────────────────
const AVATARS = ["🐱", "🐼", "🐰", "🦊", "🐻", "🐧", "🐸", "🐥", "🍎", "🍌", "🍓", "🍊", "🍇", "🍉", "🍒"];
const KELAS_OPTIONS = ["7A", "7B", "7C", "7D", "7E", "7F", "7G", "7H", "7I"];

function StudentProfilePage({ onComplete }: { onComplete: (p: StudentProfile) => void }) {
  const [name, setName] = useState("");
  const [kelas, setKelas] = useState("");
  const [avatar, setAvatar] = useState("");
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  const canContinue = name.trim().length > 0 && kelas !== "" && avatar !== "";

  useEffect(() => {
    if (avatar) {
      setTimeout(() => saveButtonRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
    }
  }, [avatar]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50 p-6 pt-20 pb-10">
      <GeomShapes />
      <div className="relative z-10 max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl">✨</div>
          <h2 className="text-2xl font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>Sebelum mulai belajar, kenalan dulu yuk!</h2>
          <p className="text-gray-500 font-body text-sm">Isi nama, kelas, dan pilih avatar kamu sebelum memulai pembelajaran.</p>
        </div>

        {/* Name */}
        <div className="bg-white rounded-3xl shadow-lg border-2 border-sky-200 p-5 space-y-3">
          <label className="block font-black text-gray-700" style={{ fontFamily: "Nunito, sans-serif" }}>Nama</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama kamu"
            className="w-full px-4 py-3.5 rounded-2xl border-2 border-sky-200 text-gray-700 font-body text-base focus:outline-none focus:border-sky-400 transition-all"
          />
        </div>

        {/* Class */}
        <div className="bg-white rounded-3xl shadow-lg border-2 border-sky-200 p-5 space-y-3">
          <label className="block font-black text-gray-700" style={{ fontFamily: "Nunito, sans-serif" }}>Kelas</label>
          <select
            value={kelas}
            onChange={(e) => setKelas(e.target.value)}
            className="w-full px-4 py-3.5 rounded-2xl border-2 border-sky-200 text-gray-700 font-body text-base focus:outline-none focus:border-sky-400 transition-all bg-white appearance-none cursor-pointer"
            style={{ fontFamily: "Nunito, sans-serif" }}>
            <option value="">Pilih kelas ▾</option>
            {KELAS_OPTIONS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        {/* Avatar */}
        <div className="bg-white rounded-3xl shadow-lg border-2 border-sky-200 p-5 space-y-3">
          <label className="block font-black text-gray-700" style={{ fontFamily: "Nunito, sans-serif" }}>Pilih Avatar</label>
          <div className="grid grid-cols-5 gap-2">
            {AVATARS.map((a) => (
              <button key={a} onClick={() => setAvatar(a)}
                className={`w-full aspect-square rounded-2xl border-2 flex items-center justify-center text-3xl transition-all ${avatar === a ? "border-sky-500 bg-sky-50 scale-110 shadow-md" : "border-gray-200 bg-gray-50 hover:border-sky-300 hover:bg-sky-50"}`}>
                {a}
              </button>
            ))}
          </div>
          {avatar && (
            <div className="flex items-center gap-3 bg-sky-50 rounded-2xl p-3 border border-sky-200 pop-in">
              <span className="text-4xl">{avatar}</span>
              <div>
                <p className="font-bold text-sky-700 text-sm" style={{ fontFamily: "Nunito, sans-serif" }}>Avatar dipilih!</p>
                <p className="text-xs text-sky-400 font-body">Kamu terlihat keren 🌟</p>
              </div>
            </div>
          )}
        </div>

        <button ref={saveButtonRef} onClick={() => canContinue && onComplete({ name: name.trim(), kelas, avatar })}
          disabled={!canContinue}
          className={`w-full py-5 rounded-3xl text-xl font-black shadow-xl transition-all duration-200 ${canContinue ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:scale-105 active:scale-95 hover:shadow-2xl" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
          style={{ fontFamily: "Nunito, sans-serif" }}>
          💾 Simpan & Lanjutkan
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// ABOUT PAGE
// ────────────────────────────────────────────────────────────────
function AboutPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6 pt-20">
      <GeomShapes />
      <div className="relative z-10 max-w-lg mx-auto space-y-5">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 text-white text-center">
          <div className="text-4xl mb-2">👤</div>
          <h2 className="text-2xl font-black" style={{ fontFamily: "Nunito, sans-serif" }}>Tentang Pembuat</h2>
        </div>
        <div className="bg-white rounded-3xl shadow-lg border-2 border-amber-200 p-8 space-y-5 text-center">
          <div className="w-32 h-32 rounded-full overflow-hidden mx-auto shadow-xl border-4 border-amber-300 bg-amber-100 flex items-center justify-center">
            <img src="/src/imports/PERSONAL_PHOTO.jpg.jpeg" alt="Jihan Naziiha" loading="lazy" decoding="async" className="w-full h-full object-cover object-center" style={{ display: "block" }} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>Jihan Naziiha</h3>
            <p className="text-amber-600 font-bold font-body text-sm mt-1">Mahasiswi Pendidikan Bahasa Arab</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-5 border-2 border-amber-200 text-left">
            <p className="text-gray-700 font-body text-sm leading-relaxed">
              Jihan Naziiha adalah seorang mahasiswi Program Studi Pendidikan Bahasa Arab, Fakultas Bahasa dan Seni, Universitas Negeri Jakarta.
            </p>
          </div>
        </div>
        <button onClick={onBack} className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-lg hover:scale-105 active:scale-95 transition-all" style={{ fontFamily: "Nunito, sans-serif" }}>
          ← Kembali
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// INFO PAGE
// ────────────────────────────────────────────────────────────────
function InfoPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-6 pt-20 pb-10">
      <GeomShapes />
      <div className="relative z-10 max-w-lg mx-auto space-y-5">
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-3xl p-6 text-white text-center">
          <div className="text-4xl mb-2">ℹ️</div>
          <h2 className="text-2xl font-black" style={{ fontFamily: "Nunito, sans-serif" }}>Tujuan Pembelajaran</h2>
        </div>
        <div className="bg-white rounded-3xl shadow-lg border-2 border-teal-200 p-6 space-y-4">
          <p className="text-gray-700 font-body text-sm leading-relaxed">
            Website ini dirancang sebagai media pembelajaran Bahasa Arab berbasis pendekatan <strong>Deep Learning</strong> untuk siswa Kelas 7 <strong>SMP Islam Panglima Besar Soedirman</strong>. Pembelajaran dirancang agar bermakna, menyenangkan, dan penuh kesadaran.
          </p>
          <div className="space-y-2">
            <p className="font-black text-gray-800 text-sm" style={{ fontFamily: "Nunito, sans-serif" }}>Pendekatan Deep Learning:</p>
            {[["🧠", "Mindful Learning", "Mengaktifkan pengetahuan awal sebelum belajar"], ["📖", "Meaningful Learning", "Menghubungkan materi dengan konteks nyata kehidupan sehari-hari"], ["🎉", "Joyful Learning", "Belajar melalui permainan yang menyenangkan dan kreatif"]].map(([icon, title, desc]) => (
              <div key={String(title)} className="flex items-start gap-3 bg-teal-50 rounded-2xl p-3 border border-teal-200">
                <span className="text-xl shrink-0">{icon}</span>
                <div>
                  <div className="font-bold text-teal-700 text-sm" style={{ fontFamily: "Nunito, sans-serif" }}>{String(title)}</div>
                  <div className="text-xs text-gray-500 font-body">{String(desc)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="font-black text-gray-800 text-sm" style={{ fontFamily: "Nunito, sans-serif" }}>4 Maharah yang Dikembangkan:</p>
            {[["🎧", "الِاسْتِمَاعُ — Istimā'", "Mendengarkan"], ["🎤", "الْكَلَامُ — Kalām", "Berbicara"], ["📖", "الْقِرَاءَةُ — Qirā'ah", "Membaca"], ["✍️", "الْكِتَابَةُ — Kitābah", "Menulis"]].map(([icon, ar, id]) => (
              <div key={String(ar)} className="flex items-center gap-3 bg-cyan-50 rounded-2xl px-4 py-3 border border-cyan-200">
                <span className="text-xl">{icon}</span>
                <ArabicText className="font-bold text-cyan-700 text-sm flex-1">{String(ar)}</ArabicText>
                <span className="text-xs text-gray-500 font-body">{String(id)}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={onBack} className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-black text-lg hover:scale-105 active:scale-95 transition-all" style={{ fontFamily: "Nunito, sans-serif" }}>
          ← Kembali
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// MINDFUL LEARNING
// ────────────────────────────────────────────────────────────────
type MindfulStep = "q1" | "q2a" | "q2b" | "response";

function MindfulPage({ onComplete, onSave }: { onComplete: () => void; onSave: (d: MindfulData) => void }) {
  const [experience, setExperience] = useState<"yes" | "no" | null>(null);
  const [memory, setMemory] = useState("");
  const [guess, setGuess] = useState("");
  const mindfulLanjutRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (experience) {
      setTimeout(() => mindfulLanjutRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }
  }, [experience]);

  const handleContinue = () => {
    if (!experience || (experience === "yes" ? !memory.trim() : !guess.trim())) return;
    onSave({ experience, memory: experience === "yes" ? memory.trim() : null, guess: experience === "no" ? guess.trim() : null });
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6 pt-28">
      <GeomShapes />
      <div className="relative z-10 max-w-lg mx-auto space-y-5">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-5 text-white text-center">
          <div className="text-4xl mb-1">🧠</div>
          <h2 className="text-2xl font-black" style={{ fontFamily: "Nunito, sans-serif" }}>Mindful Learning</h2>
          <p className="text-indigo-100 font-body text-sm mt-1">Sebelum belajar, mari pikirkan dulu apa yang sudah kamu tahu!</p>
        </div>
        <div className="bg-white rounded-3xl shadow-lg p-6 space-y-5 pop-in">
          <p className="text-xl font-black text-gray-800 text-center leading-snug" style={{ fontFamily: "Nunito, sans-serif" }}>Apakah kamu pernah belajar tentang materi ini?</p>
          <p className="text-center text-gray-400 font-body text-sm">Materi: <ArabicText className="font-bold text-gray-600">الْأَيَّامُ</ArabicText> (Hari-hari dalam Seminggu)</p>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setExperience("yes")} className={`py-8 rounded-2xl border-2 font-black text-lg hover:scale-105 active:scale-95 transition-all ${experience === "yes" ? "bg-green-200 border-green-500 text-green-800" : "bg-green-100 border-green-300 text-green-700"}`} style={{ fontFamily: "Nunito, sans-serif" }}>✅<br />Ya, pernah!</button>
            <button onClick={() => setExperience("no")} className={`py-8 rounded-2xl border-2 font-black text-lg hover:scale-105 active:scale-95 transition-all ${experience === "no" ? "bg-orange-200 border-orange-500 text-orange-800" : "bg-orange-100 border-orange-300 text-orange-700"}`} style={{ fontFamily: "Nunito, sans-serif" }}>🆕<br />Belum pernah</button>
          </div>
          {experience === "yes" && (
            <div className="space-y-2 pop-in">
              <label className="block font-black text-gray-700" style={{ fontFamily: "Nunito, sans-serif" }}>Apa kosakata bahasa Arab tentang nama-nama hari yang masih kamu ingat?</label>
              <textarea value={memory} onChange={(e) => setMemory(e.target.value)} placeholder="Ketik jawabanmu di sini..." className="w-full min-h-28 rounded-2xl border-2 border-indigo-200 p-4 font-body focus:outline-none focus:border-indigo-500" />
            </div>
          )}
          {experience === "no" && (
            <div className="space-y-2 pop-in">
              <label className="block font-black text-gray-700" style={{ fontFamily: "Nunito, sans-serif" }}>Menurut kamu, materi ini berkaitan tentang apa?</label>
              <textarea value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="Ketik jawabanmu di sini..." className="w-full min-h-28 rounded-2xl border-2 border-orange-200 p-4 font-body focus:outline-none focus:border-orange-500" />
            </div>
          )}
          {experience && <button ref={mindfulLanjutRef} onClick={handleContinue} disabled={experience === "yes" ? !memory.trim() : !guess.trim()} className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-lg disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all" style={{ fontFamily: "Nunito, sans-serif" }}>Lanjut ke Materi →</button>}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// MEANINGFUL LEARNING — Vocabulary with audio
// ────────────────────────────────────────────────────────────────
function MeaningfulPage({ onComplete }: { onComplete: () => void }) {
  const ALL_VOCAB = [...DAYS, ...EXTRA_VOCAB];
  const [idx, setIdx] = useState(0);
  const [showExample, setShowExample] = useState(false);
  const [audioKey, setAudioKey] = useState(0);
  const [playingVocab, setPlayingVocab] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const exampleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showExample) {
      setTimeout(() => exampleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }
  }, [showExample]);

  const item = ALL_VOCAB[idx];
  const itemAudio = AYYAM_VOCAB_AUDIO[idx];
  const isExtraPhase = idx >= DAYS.length;

  const goNext = () => {
    setShowExample(false);
    setPlayingVocab(false);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (idx < ALL_VOCAB.length - 1) setIdx(idx + 1);
    else onComplete();
  };

  return (
    <div ref={topRef} className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-6 pt-20 pb-10">
      <GeomShapes />
      <div className="relative z-10 max-w-lg mx-auto space-y-4">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-4 text-white text-center">
          <div className="text-2xl mb-1">📖</div>
          <h2 className="text-xl font-black" style={{ fontFamily: "Nunito, sans-serif" }}>Materi — الأيام</h2>
          <p className="text-emerald-100 font-body text-xs">{isExtraPhase ? "Kosakata Tambahan" : "Hari-hari dalam Seminggu"}</p>
        </div>
        <div className="flex justify-between items-center">
          <div className="bg-white rounded-2xl px-4 py-2 shadow-sm border-2 border-emerald-200 font-bold text-emerald-600 text-sm" style={{ fontFamily: "Nunito, sans-serif" }}>{idx + 1} / {ALL_VOCAB.length}</div>
          <div className="text-xs text-gray-400 font-body">{isExtraPhase ? "🗓️ Kosakata Waktu" : "📖 Kosakata Hari"}</div>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500" style={{ width: `${((idx + 1) / ALL_VOCAB.length) * 100}%` }} />
        </div>
        <div className={`bg-white rounded-3xl shadow-xl border-2 ${item.border} p-5 space-y-4 pop-in`} key={idx}>
          <div className="text-center space-y-2">
            <ArabicText className="block text-5xl sm:text-6xl font-black text-gray-800">{item.arabic}</ArabicText>
            <div className={`text-sm font-bold ${item.accent} font-body`}>/{item.transliteration}/</div>
          </div>
          <div className="border-t-2 border-dashed border-gray-100" />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>{item.indonesian}</div>
            <div className="text-gray-400 font-body text-xs mt-1">dalam Bahasa Indonesia</div>
          </div>
          {/* Direct audio button for vocabulary */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => { setAudioKey((k) => k + 1); setPlayingVocab(true); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 font-bold text-sm transition-all active:scale-95 ${playingVocab ? `${item.bg} ${item.border} ${item.accent} shadow-md` : "bg-gray-50 border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600"}`}>
              <span className="text-lg">🔊</span>
              <span>{playingVocab ? "Memutar..." : item.arabic}</span>
            </button>
          </div>
          {playingVocab && (
            <div className="pop-in">
              <AudioPlayer key={audioKey} label={`${item.arabic}`} duration={2} compact src={itemAudio.vocabulary} onComplete={() => setPlayingVocab(false)} />
            </div>
          )}
        </div>
        <div className={`${item.bg} rounded-2xl p-4 border-2 ${item.border} flex items-start gap-3`}>
          <span className="text-xl">💡</span>
          <div>
            <p className={`font-bold ${item.accent} text-xs font-body`}>Konteks Nyata:</p>
            <p className="text-gray-700 font-body text-sm">{item.context}</p>
          </div>
        </div>
        <button onClick={() => setShowExample(!showExample)} className="w-full py-3 rounded-2xl border-2 border-gray-200 text-gray-500 font-bold font-body text-sm hover:border-teal-300 hover:text-teal-600 active:scale-95 transition-all">
          {showExample ? "🙈 Sembunyikan Contoh" : "👀 Lihat Contoh Kalimat"}
        </button>
        {showExample && (
          <div ref={exampleRef} className="bg-white rounded-2xl shadow-md p-4 border-l-4 border-teal-400 space-y-2 pop-in">
            <ArabicText className="block text-xl font-bold text-gray-800 text-right">{item.sentence}</ArabicText>
            <p className="text-gray-500 font-body text-sm italic">"{item.sentenceId}"</p>
            <AudioPlayer label="🔊 Contoh kalimat" duration={4} compact src={itemAudio.example} />
          </div>
        )}
        <div className="grid grid-cols-5 gap-3">
          <button onClick={() => { setShowExample(false); setPlayingVocab(false); if (idx > 0) setIdx(idx - 1); }} disabled={idx === 0}
            className="col-span-2 py-4 rounded-2xl border-2 border-gray-200 text-gray-500 font-bold font-body disabled:opacity-30 hover:border-teal-300 active:scale-95 transition-all">
            ← Kembali
          </button>
          <button onClick={goNext} className="col-span-3 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-md" style={{ fontFamily: "Nunito, sans-serif" }}>
            {idx === ALL_VOCAB.length - 1 ? "Selesai!" : "Lanjut →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// PRACTICE — Click-to-Match
// ────────────────────────────────────────────────────────────────
function PracticePage({ onComplete }: { onComplete: () => void }) {
  const [leftItems] = useState(() => DAYS.slice(0, 5));
  const [rightItems] = useState(() => [...DAYS.slice(0, 5)].sort(() => Math.random() - 0.5));
  const [selLeft, setSelLeft] = useState<number | null>(null);
  const [selRight, setSelRight] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [wrongPair, setWrongPair] = useState<[number, number] | null>(null);

  const matchedLeft = Object.keys(matches).map(Number);
  const matchedRight = Object.values(matches);

  const checkMatch = (li: number, ri: number) => {
    if (leftItems[li].arabic === rightItems[ri].arabic) { playSound("correct"); setMatches((p) => ({ ...p, [li]: ri })); }
    else { playSound("wrong"); setWrongPair([li, ri]); setTimeout(() => setWrongPair(null), 700); }
    setSelLeft(null); setSelRight(null);
  };

  const handleLeft = (i: number) => { if (matchedLeft.includes(i)) return; if (selLeft === i) { setSelLeft(null); return; } if (selRight !== null) { checkMatch(i, selRight); return; } setSelLeft(i); };
  const handleRight = (i: number) => { if (matchedRight.includes(i)) return; if (selRight === i) { setSelRight(null); return; } if (selLeft !== null) { checkMatch(selLeft, i); return; } setSelRight(i); };
  const allDone = Object.keys(matches).length === leftItems.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6 pt-28">
      <GeomShapes />
      <div className="relative z-10 max-w-lg mx-auto space-y-5">
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>Cocokkan Kata!</h2>
          <p className="text-gray-500 font-body text-sm mt-1">Klik Arab → klik artinya dalam Indonesia</p>
          <div className="mt-2 text-orange-600 font-bold" style={{ fontFamily: "Nunito, sans-serif" }}>{Object.keys(matches).length}/{leftItems.length} pasangan ✓</div>
        </div>
        {!allDone ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Arab</div>
                {leftItems.map((item, i) => {
                  const isMatched = matchedLeft.includes(i); const isSel = selLeft === i; const isWrong = wrongPair?.[0] === i;
                  return (
                    <button key={i} onClick={() => handleLeft(i)} disabled={isMatched}
                      className={`w-full py-5 rounded-2xl border-2 font-black text-xl transition-all ${isMatched ? "bg-green-100 border-green-400 text-green-600" : isWrong ? "bg-red-100 border-red-400 text-red-600 shake" : isSel ? "bg-orange-100 border-orange-400 text-orange-700 scale-105 shadow-md" : "bg-white border-gray-200 text-gray-700 hover:border-orange-300 active:scale-95"}`}>
                      {isMatched ? "✓" : <ArabicText>{item.arabic}</ArabicText>}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-3">
                <div className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Indonesia</div>
                {rightItems.map((item, i) => {
                  const isMatched = matchedRight.includes(i); const isSel = selRight === i; const isWrong = wrongPair?.[1] === i;
                  return (
                    <button key={i} onClick={() => handleRight(i)} disabled={isMatched}
                      className={`w-full py-5 rounded-2xl border-2 font-bold font-body transition-all ${isMatched ? "bg-green-100 border-green-400 text-green-600" : isWrong ? "bg-red-100 border-red-400 text-red-600 shake" : isSel ? "bg-orange-100 border-orange-400 text-orange-700 scale-105 shadow-md" : "bg-white border-gray-200 text-gray-700 hover:border-orange-300 active:scale-95"}`}>
                      {isMatched ? "✓" : item.indonesian}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="text-center text-gray-400 font-body text-xs">Pilih kata Arab, lalu pilih artinya!</p>
          </>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center space-y-4 bounce-in">
            <div className="text-6xl">🎊</div>
            <h3 className="text-2xl font-black text-green-600" style={{ fontFamily: "Nunito, sans-serif" }}>Sempurna!</h3>
            <p className="text-gray-500 font-body">Kamu berhasil mencocokkan semua pasangan dengan benar!</p>
            <button onClick={onComplete} className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-lg hover:scale-105 active:scale-95 transition-all" style={{ fontFamily: "Nunito, sans-serif" }}>
              🎧 Lanjut ke Istimā'!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// LISTENING PAGE — Istimā'
// ────────────────────────────────────────────────────────────────
type ListeningQuestion = { q: string; opts: string[]; ans: string; arabic: boolean; type: string };
type DialogueLine = { speaker: string; arabic: string; indonesian: string; side: string };

const LISTENING_QS: ListeningQuestion[] = [
  { q: "أَيُّ يَوْمٍ الْآنَ؟", opts: ["يَوْمُ الْأَحَدِ", "يَوْمُ الِاثْنَيْنِ", "يَوْمُ الثُّلَاثَاءِ"], ans: "يَوْمُ الِاثْنَيْنِ", arabic: true, type: "mc" },
  { q: "أَيُّ يَوْمٍ أَمْسِ؟", opts: ["يَوْمُ الْأَحَدِ", "يَوْمُ السَّبْتِ", "يَوْمُ الْأَرْبِعَاءِ"], ans: "يَوْمُ الْأَحَدِ", arabic: true, type: "mc" },
  { q: "أَيُّ يَوْمٍ غَدًا؟", opts: ["يَوْمُ الثُّلَاثَاءِ", "يَوْمُ الْخَمِيسِ", "يَوْمُ الْجُمُعَةِ"], ans: "يَوْمُ الثُّلَاثَاءِ", arabic: true, type: "mc" },
];

const TAARUF_LISTENING_QS: ListeningQuestion[] = [
  { q: "مَا اسْمُهُ؟", opts: ["أَحْمَدُ", "عَلِيٌّ", "حَسَنٌ"], ans: "عَلِيٌّ", arabic: true, type: "mc" },
  { q: "أَيْنَ يَسْكُنُ؟", opts: ["فِي جَاكَرْتَا", "فِي بَانْدُونْجَ", "فِي سُورَابَايَا"], ans: "فِي جَاكَرْتَا", arabic: true, type: "mc" },
  { q: "مَا رَقْمُ عُنْوَانِهِ؟", opts: ["رَقْمُ عَشَرَةَ", "رَقْمُ حَادِي عَشَرَ", "رَقْمُ اثْنَيْ عَشَرَ"], ans: "رَقْمُ حَادِي عَشَرَ", arabic: true, type: "mc" },
];

const ALWAN_LISTENING_QS: ListeningQuestion[] = [
  { q: "مَا لَوْنُ قَلَمِ أَحْمَدَ؟", opts: ["أَزْرَقُ", "أَخْضَرُ", "أَسْوَدُ"], ans: "أَزْرَقُ", arabic: true, type: "mc" },
  { q: "مَا لَوْنُ حَقِيبَةِ فَاطِمَةَ؟", opts: ["سَوْدَاءُ", "بَيْضَاءُ", "حَمْرَاءُ"], ans: "سَوْدَاءُ", arabic: true, type: "mc" },
  { q: "مَا لَوْنُ كِتَابِ أَحْمَدَ؟", opts: ["أَحْمَرُ", "أَزْرَقُ", "أَصْفَرُ"], ans: "أَحْمَرُ", arabic: true, type: "mc" },
  { q: "مَنْ صَاحِبَةُ الْحَقِيبَةِ الْجَمِيلَةِ؟", opts: ["فَاطِمَةُ", "عَلِيٌّ", "أَحْمَدُ"], ans: "فَاطِمَةُ", arabic: true, type: "mc" },
];

const TAARUF_DIALOGUE: DialogueLine[] = [
  ["مَا اسْمُكَ؟", "Siapa namamu?"], ["اِسْمِي عَلِيٌّ.", "Namaku Ali."], ["كَيْفَ حَالُكَ؟", "Bagaimana kabarmu?"], ["الْحَمْدُ لِلَّهِ، أَنَا بِخَيْرٍ، شُكْرًا.", "Alhamdulillah, aku baik, terima kasih."], ["مَا وَظِيفَتُكَ؟", "Apa pekerjaanmu?"], ["أَنَا تِلْمِيذٌ.", "Saya seorang siswa."], ["أَيْنَ تَسْكُنُ الْآنَ؟", "Di mana kamu tinggal sekarang?"], ["أَسْكُنُ فِي جَاكَرْتَا.", "Saya tinggal di Jakarta."], ["مَا عُنْوَانُكَ؟", "Apa alamatmu?"], ["عُنْوَانِي شَارِعُ أَحْمَدَ يَانِي، رَقْمُ حَادِي عَشَرَ.", "Alamatku Jalan Ahmad Yani nomor sebelas."], ["أَيْنَ مَدْرَسَتُكَ؟", "Di mana sekolahmu?"], ["مَدْرَسَتِي فِي سُودِيرْمَانَ.", "Sekolahku di Sudirman."],
].map(([arabic, indonesian], index) => ({ speaker: index % 2 ? "ع" : "أ", arabic, indonesian, side: index % 2 ? "right" : "left" }));

const ALWAN_DIALOGUE: DialogueLine[] = [
  { speaker: "ع", arabic: "عَلِيٌّ: مَا لَوْنُ قَلَمِكَ؟", indonesian: "Ali: Apa warna pulpenmu?", side: "left" },
  { speaker: "أ", arabic: "أَحْمَدُ: قَلَمِي أَزْرَقُ. وَمَا لَوْنُ حَقِيبَتِكِ يَا فَاطِمَةُ؟", indonesian: "Ahmad: Pulpenku berwarna biru. Apa warna tasmu, Fatimah?", side: "right" },
  { speaker: "ف", arabic: "فَاطِمَةُ: حَقِيبَتِي سَوْدَاءُ. وَمَا لَوْنُ كِتَابِكَ؟", indonesian: "Fatimah: Tasku berwarna hitam. Apa warna bukumu?", side: "left" },
  { speaker: "أ", arabic: "أَحْمَدُ: كِتَابِي أَحْمَرُ.", indonesian: "Ahmad: Bukuku berwarna merah.", side: "right" },
  { speaker: "أ", arabic: "أَحْمَدُ: حَقِيبَتُكِ جَمِيلَةٌ!", indonesian: "Ahmad: Tasmu cantik!", side: "right" },
];

function PendingIllustration({ label, src }: { label: string; src?: string }) {
  return <div className={`rounded-2xl overflow-hidden border-2 border-sky-100 shadow-sm bg-sky-50 flex flex-col items-center justify-center text-center ${src ? "p-3" : "p-5"}`} style={{ minHeight: 160 }}>{src ? <img src={src} alt={label} loading="lazy" decoding="async" className="block w-full max-h-64 object-contain" /> : <><div className="w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-sky-300 flex items-center justify-center text-sky-500 text-2xl">▧</div><p className="text-xs text-gray-400 mt-1">Siap dihubungkan ke ilustrasi yang akan diunggah.</p></>}<p className="font-bold text-sky-700 text-sm mt-3">{label}</p></div>;
}

function ListeningPage({ onComplete, dialogue = DIALOGUE, questions = LISTENING_QS, illustration, descriptiveText, audioFirst = false, audioSrc, rewardPrefix, onReward }: { onComplete: () => void; dialogue?: DialogueLine[]; questions?: ListeningQuestion[]; illustration?: React.ReactNode; descriptiveText?: { arabic: string; indonesian: string }; audioFirst?: boolean; audioSrc?: string; rewardPrefix?: string; onReward?: (id: string, correct: boolean) => void }) {
  const [phase, setPhase] = useState<"story" | "dialogue" | "questions" | "done">("dialogue");
  const [showStoryText, setShowStoryText] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [hideDialogue, setHideDialogue] = useState(true);
  const [showDialogueTranslation, setShowDialogueTranslation] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const storyTextRef = useRef<HTMLDivElement>(null);
  const storyTranslationRef = useRef<HTMLDivElement>(null);
  const dialogueTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showStoryText) setTimeout(() => storyTextRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  }, [showStoryText]);

  useEffect(() => {
    if (showTranslation && storyTranslationRef.current) {
      setTimeout(() => storyTranslationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }
  }, [showTranslation]);

  useEffect(() => {
    if (!hideDialogue) setTimeout(() => dialogueTextRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, [hideDialogue]);

  useEffect(() => {
    if (showDialogueTranslation) setTimeout(() => dialogueTextRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, [showDialogueTranslation]);

  const q = questions[qIdx];

  useEffect(() => {
    if (chosen) scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [chosen]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [phase, qIdx]);

  const handleAnswer = (opt: string) => {
    if (chosen) return;
    setChosen(opt);
    const correct = opt === q.ans;
    playSound(correct ? "correct" : "wrong");
    if (rewardPrefix) onReward?.(`${rewardPrefix}:q${qIdx + 1}`, correct);
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      if (qIdx + 1 >= questions.length) setPhase("done");
      else { setQIdx((i) => i + 1); setChosen(null); }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-cyan-50 p-6 pt-20 pb-10">
      <GeomShapes />
      <div className="relative z-10 max-w-lg mx-auto space-y-4">
        <div className="bg-gradient-to-r from-cyan-600 to-sky-500 rounded-3xl p-5 text-white text-center">
          <div className="text-3xl mb-1">🎧</div>
          <h2 className="text-2xl font-black" style={{ fontFamily: "Nunito, sans-serif" }}>الِاسْتِمَاعُ — Istimā'</h2>
          <p className="text-cyan-100 font-body text-sm">{descriptiveText ? "Dengarkan dengan saksama dan pahami isi teks pendek." : "Dengarkan dengan saksama dan pahami isi percakapan atau cerita."}</p>
        </div>

        {/* Phase indicator */}
        <div className="flex gap-2">
          {[[descriptiveText ? "📄" : "💬", descriptiveText ? "Teks" : "Dialog"], ["❓", "Pertanyaan"]].map(([icon, label], i) => {
            const phases = ["dialogue", "questions"];
            const isActive = phases[i] === phase;
            const isDone = phases.indexOf(phase) > i;
            return (
              <div key={String(label)} className={`flex-1 rounded-xl py-2 text-center text-xs font-bold transition-all ${isActive ? "bg-cyan-500 text-white" : isDone ? "bg-green-100 text-green-700 border border-green-300" : "bg-white text-gray-400 border border-gray-200"}`}>
                {isDone ? "✓ " : ""}{icon} {String(label)}
              </div>
            );
          })}
        </div>

        {/* STORY phase */}
        {phase === "story" && (
          <div className="space-y-4 pop-in">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-4 text-white text-center">
              <ArabicText className="block text-xl font-black">قصة قصيرة</ArabicText>
              <p className="text-teal-100 text-xs font-body mt-1">Cerita Pendek tentang Hari-hari</p>
            </div>
            <StoryIllustration />
            <div className="bg-white rounded-3xl shadow-lg border-2 border-teal-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-teal-600 font-body">🔊 Dengarkan Cerita</span>
                <button onClick={() => setShowTranslation((v) => !v)}
                  className="text-xs px-3 py-1.5 rounded-full bg-teal-100 text-teal-600 font-bold hover:bg-teal-200 transition-all">
                  {showTranslation ? "Sembunyikan" : "Terjemahan"}
                </button>
              </div>
              <AudioPlayer label="Narasi Cerita" duration={18} onComplete={() => setShowStoryText(true)} />
              {showStoryText && (
                <div className="space-y-3 pop-in">
                  <div ref={storyTextRef} className="bg-teal-50 rounded-2xl p-4 border-2 border-teal-200 text-right" dir="rtl">
                    {STORY.arabic.split("\n").map((line, i) => (
                      <p key={i} className="text-base text-gray-800 leading-loose" style={{ fontFamily: "'Noto Naskh Arabic', Arial, serif" }}>{line}</p>
                    ))}
                  </div>
                  {showTranslation && (
                    <div ref={storyTranslationRef} className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                      {STORY.indonesian.split("\n").map((line, i) => (
                        <p key={i} className="text-sm text-gray-600 font-body italic">{line}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!showStoryText && <p className="text-xs text-gray-400 font-body text-center">Tekan ▶ untuk mendengarkan cerita</p>}
            </div>
            <button onClick={() => setPhase("dialogue")}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-black text-lg hover:scale-105 active:scale-95 transition-all"
              style={{ fontFamily: "Nunito, sans-serif" }}>
              💬 Lanjut ke Dialog →
            </button>
          </div>
        )}

        {/* DIALOGUE phase */}
        {phase === "dialogue" && (
          <div className="space-y-4 pop-in">
            <div className="bg-white rounded-2xl border-2 border-cyan-200 p-3 text-center">
              <ArabicText className="block text-lg font-black text-cyan-700">استمع جيدًا!</ArabicText>
              <p className="text-gray-500 font-body text-xs">{descriptiveText ? "Dengarkan teks deskriptif dengan saksama" : "Dengarkan dialog dengan saksama"}</p>
            </div>
            {illustration ?? <DialogueIllustration />}
            <div className="bg-white rounded-3xl shadow-lg border-2 border-cyan-200 p-5 space-y-3">
              {descriptiveText ? (
                <>
                  <span className="text-sm font-bold text-cyan-600 font-body">النَّصُّ — Teks Pendek</span>
                  <AudioPlayer label="اِسْتَمِعْ إِلَى النَّصِّ — Dengarkan teks" duration={16} />
                  <div className="bg-cyan-50 rounded-2xl p-4 border-2 border-cyan-200 text-right"><ArabicText className="block text-xl leading-loose font-bold text-gray-800">{descriptiveText.arabic}</ArabicText></div>
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200"><p className="text-sm text-gray-600 font-body italic">{descriptiveText.indonesian}</p></div>
                </>
              ) : <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-cyan-600 font-body">الحوار — Dialog</span>
                  <div className="flex gap-2">
                  <button onClick={() => { if (!audioFirst) setHideDialogue((v) => !v); }} disabled={audioFirst}
                    className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 font-bold hover:bg-gray-200 transition-all">
                    {audioFirst ? (hideDialogue ? "🔒 Dengarkan Dulu" : "✓ Teks Terbuka") : hideDialogue ? "👁 Tampilkan" : "🙈 Sembunyikan"}
                  </button>
                  <button onClick={() => setShowDialogueTranslation((v) => !v)} disabled={audioFirst && hideDialogue}
                    className="text-xs px-3 py-1.5 rounded-full bg-cyan-100 text-cyan-600 font-bold hover:bg-cyan-200 transition-all">
                    🇮🇩
                  </button>
                </div>
                </div>
                <AudioPlayer label="استمع إلى الحوار — Dengarkan dialog" duration={22} src={audioSrc} onComplete={() => { if (audioFirst) setHideDialogue(false); }} />
                {!hideDialogue && (
                  <div ref={dialogueTextRef} className="space-y-2 pop-in">
                    {dialogue.map((line, i) => (
                      <div key={i} className={`flex items-start gap-2 ${line.side === "right" ? "flex-row-reverse" : ""}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${line.side === "left" ? "bg-cyan-200 text-cyan-700" : "bg-green-200 text-green-700"}`}
                          style={{ fontFamily: "'Noto Naskh Arabic', Arial, serif" }}>
                          {line.speaker.slice(0, 1)}
                        </div>
                        <div className={`rounded-2xl p-2.5 max-w-[75%] ${line.side === "left" ? "bg-cyan-50 border border-cyan-200" : "bg-green-50 border border-green-200"}`}>
                          <ArabicText className="block text-sm text-gray-800">{line.arabic}</ArabicText>
                          {showDialogueTranslation && <p className="text-xs text-gray-400 font-body mt-0.5 italic">{line.indonesian}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>}
            </div>
            <button onClick={() => setPhase("questions")} disabled={audioFirst && hideDialogue}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-500 text-white font-black text-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
              style={{ fontFamily: "Nunito, sans-serif" }}>
              ❓ Jawab Pertanyaan →
            </button>
          </div>
        )}

        {/* QUESTIONS phase */}
        {phase === "questions" && (
          <div className="space-y-4 pop-in">
            <div className="flex justify-between items-center bg-white rounded-2xl p-4 shadow-sm border-2 border-cyan-100">
              <span className="font-body text-gray-500 text-sm">Pertanyaan {qIdx + 1}/{questions.length}</span>
              <span className="font-black text-cyan-600" style={{ fontFamily: "Nunito, sans-serif" }}>⭐ {score} benar</span>
            </div>
            <div className={`bg-white rounded-3xl shadow-xl border-2 border-cyan-200 p-6 text-center`} key={qIdx}>
              <p className="text-base font-black text-gray-800 leading-relaxed" dir={q.arabic ? "rtl" : "ltr"} style={q.arabic ? { fontFamily: "'Noto Naskh Arabic', Arial, serif", fontSize: "1.2rem" } : { fontFamily: "Nunito, sans-serif" }}>
                {q.q}
              </p>
            </div>
            <div className={`grid ${q.type === "tf" ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
              {q.opts.map((opt) => {
                const isCorrect = opt === q.ans; const isSel = chosen === opt;
                return (
                  <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!chosen}
                    dir={q.arabic ? "rtl" : "ltr"}
                    className={`py-4 px-5 rounded-2xl border-2 font-bold transition-all text-left ${!chosen ? "bg-white border-gray-200 text-gray-700 hover:border-cyan-400 active:scale-95" : isCorrect ? "bg-green-100 border-green-400 text-green-700" : isSel ? "bg-red-100 border-red-400 text-red-600" : "bg-gray-50 border-gray-200 text-gray-300 opacity-50"}`}
                    style={q.arabic ? { fontFamily: "'Noto Naskh Arabic', Arial, serif" } : { fontFamily: "Nunito, sans-serif" }}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {chosen && (
              <div ref={scrollAnchorRef} className={`rounded-2xl p-4 text-center font-bold font-body pop-in ${chosen === q.ans ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                {chosen === q.ans ? "Benar!" : `Jawaban benar: ${q.ans}`}
              </div>
            )}
          </div>
        )}

        {phase === "done" && (
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center space-y-5 bounce-in">
            <div className="text-6xl">{score === questions.length ? "🏆" : score >= 2 ? "🌟" : "💪"}</div>
            <h3 className="text-2xl font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>Istimā' Selesai!</h3>
            <div className="bg-cyan-50 rounded-2xl p-4 border-2 border-cyan-200">
              <div className="text-4xl font-black text-cyan-600" style={{ fontFamily: "Nunito, sans-serif" }}>{score}/{questions.length}</div>
              <div className="text-gray-400 font-body text-sm">jawaban benar</div>
            </div>
            <button onClick={onComplete} className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-500 text-white font-black text-lg hover:scale-105 active:scale-95 transition-all" style={{ fontFamily: "Nunito, sans-serif" }}>
              🎤 Lanjut ke Qirā’ah!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const READING_CONTENT = {
  taaruf: {
    arabic: "اِسْمِي فَاطِمَةُ، أَنَا تِلْمِيذَةٌ، أَسْكُنُ فِي بَانْدُونْغَ، وَعُنْوَانِي فِي شَارِعِ أَحْمَدَ دَحْلَانَ، رَقْمُ سِتَّةَ عَشَرَ.",
    indonesian: "Namaku Fatimah. Aku seorang siswi. Aku tinggal di Bandung. Alamatku berada di Jalan Ahmad Dahlan, nomor 16.",
    questions: [
      { q: "مَا اسْمُ التِّلْمِيذَةِ؟", opts: ["فَاطِمَةُ", "عَائِشَةُ", "مَرْيَمُ"], ans: "فَاطِمَةُ" },
      { q: "أَيْنَ تَسْكُنُ فَاطِمَةُ؟", opts: ["فِي بَانْدُونْغَ", "فِي جَاكَرْتَا", "فِي سُورَابَايَا"], ans: "فِي بَانْدُونْغَ" },
      { q: "مَا رَقْمُ عُنْوَانِهَا؟", opts: ["سِتَّةَ عَشَرَ", "حَادِي عَشَرَ", "عِشْرُونَ"], ans: "سِتَّةَ عَشَرَ" },
    ],
  },
  alwan: {
    arabic: "هٰذِهِ حَقِيبَتِي. لَوْنُهَا أَسْوَدُ. فِيهَا كِتَابٌ أَبْيَضُ، وَقَلَمٌ أَزْرَقُ، وَدَفْتَرٌ أَحْمَرُ.",
    indonesian: "Ini tasku. Warnanya hitam. Di dalamnya ada buku berwarna putih, pena berwarna biru, dan buku tulis berwarna merah.",
    questions: [
      { q: "مَا لَوْنُ الْحَقِيبَةِ؟", opts: ["أَسْوَدُ", "أَبْيَضُ", "أَحْمَرُ"], ans: "أَسْوَدُ" },
      { q: "مَا لَوْنُ الْكِتَابِ؟", opts: ["أَبْيَضُ", "أَزْرَقُ", "أَصْفَرُ"], ans: "أَبْيَضُ" },
      { q: "مَا لَوْنُ الدَّفْتَرِ؟", opts: ["أَحْمَرُ", "أَخْضَرُ", "أَسْوَدُ"], ans: "أَحْمَرُ" },
    ],
  },
  ayyam: {
    arabic: "أَحْمَدُ يَذْهَبُ إِلَى الْمَدْرَسَةِ فِي يَوْمِ الِاثْنَيْنِ. وَيَذْهَبُ إِلَى الْمَسْجِدِ فِي يَوْمِ الْجُمُعَةِ. وَيَسْتَرِيحُ فِي الْبَيْتِ فِي يَوْمِ السَّبْتِ.",
    indonesian: "Ahmad pergi ke sekolah pada hari Senin. Ia pergi ke masjid pada hari Jumat. Ia beristirahat di rumah pada hari Sabtu.",
    questions: [
      { q: "مَتَى يَذْهَبُ أَحْمَدُ إِلَى الْمَدْرَسَةِ؟", opts: ["يَوْمَ الْأَحَدِ", "يَوْمَ الِاثْنَيْنِ", "يَوْمَ الثُّلَاثَاءِ", "يَوْمَ الْأَرْبِعَاءِ"], ans: "يَوْمَ الِاثْنَيْنِ" },
      { q: "إِلَى أَيْنَ يَذْهَبُ أَحْمَدُ فِيْ يَوْمِ الْجُمْعَةِ؟", opts: ["إِلَى الْمَدْرَسَةِ", "إِلَى الْبَيْتِ", "إِلَى الْمَسْجِدِ", "إِلَى السُّوقِ"], ans: "إِلَى الْمَسْجِدِ" },
      { q: "أَيْنَ يَسْتَرِيحُ أَحْمَدُ فِيْ يَوْمِ السَّبْتِ؟", opts: ["فِي الْمَدْرَسَةِ", "فِي الْمَسْجِدِ", "فِي السُّوقِ", "فِي الْبَيْتِ"], ans: "فِي الْبَيْتِ" },
    ],
  },
};

function ReadingPage({ material, onComplete, onReward }: { material: MaterialId; onComplete: () => void; onReward?: (id: string, correct: boolean) => void }) {
  const content = READING_CONTENT[material];
  const [showTranslation, setShowTranslation] = useState(false);
  const [question, setQuestion] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "smooth" }); }, [question]);
  if (question >= content.questions.length) return <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-6 pt-20"><GeomShapes /><div className="relative z-10 max-w-lg mx-auto"><div className="bg-white rounded-3xl shadow-xl p-8 text-center space-y-5 bounce-in"><div className="text-6xl">📖</div><h2 className="text-2xl font-black">Qirā’ah Selesai!</h2><div className="text-4xl font-black text-emerald-600">{score}/3</div><button onClick={onComplete} className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-lg">Lanjut ke Kalām →</button></div></div></div>;
  const current = content.questions[question];
  const answer = (option: string) => {
    if (chosen) return;
    const correct = option === current.ans;
    setChosen(option); playSound(correct ? "correct" : "wrong");
    onReward?.(`${material}:reading:q${question + 1}`, correct);
    if (correct) setScore((value) => value + 1);
    setTimeout(() => { setQuestion((value) => value + 1); setChosen(null); }, 900);
  };
  const illustration = material === "taaruf" ? qiraahTaarufIllustration : material === "alwan" ? qiraahAlwanIllustration : qiraahAyyamIllustration;
  return <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-6 pt-20 pb-10"><GeomShapes /><div className="relative z-10 max-w-lg mx-auto space-y-4"><div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-5 text-white text-center"><div className="text-3xl">📖</div><h2 className="text-2xl font-black">الْقِرَاءَةُ — Qirā’ah</h2><p className="text-emerald-100 text-sm">Baca dan pahami teks berikut dengan saksama.</p></div><PendingIllustration label={material === "taaruf" ? "Ilustrasi Fatimah memperkenalkan diri di kelas" : material === "alwan" ? "Ilustrasi tas dan benda-benda berwarna" : "Ilustrasi Ahmad melakukan kegiatan pada hari yang berbeda"} src={illustration} /><div className="bg-white rounded-3xl shadow-lg border-2 border-emerald-200 p-5 space-y-3"><ArabicText className="block text-xl leading-loose text-right font-bold text-gray-800">{content.arabic}</ArabicText><button onClick={() => setShowTranslation((value) => !value)} className="w-full py-2.5 rounded-xl bg-emerald-100 text-emerald-700 font-bold">{showTranslation ? "Sembunyikan Terjemahan" : "Lihat Terjemahan"}</button>{showTranslation && <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 italic pop-in">{content.indonesian}</div>}</div><div className="flex justify-between bg-white rounded-2xl p-3 border-2 border-emerald-100 text-sm"><span>Pertanyaan {question + 1}/3</span><b className="text-emerald-600">Skor {score}</b></div><div className="bg-white rounded-3xl shadow-lg border-2 border-emerald-200 p-5 text-center"><ArabicText className="text-xl font-black">{current.q}</ArabicText></div><div className="space-y-2">{current.opts.map((option) => <button key={option} onClick={() => answer(option)} disabled={!!chosen} className={`w-full py-3 px-4 rounded-2xl border-2 text-right font-bold ${!chosen ? "bg-white border-gray-200" : option === current.ans ? "bg-green-100 border-green-400 text-green-700" : chosen === option ? "bg-red-100 border-red-400 text-red-600" : "bg-gray-50 text-gray-300"}`}><ArabicText>{option}</ArabicText></button>)}</div></div></div>;
}

// ────────────────────────────────────────────────────────────────
// SPEAKING PAGE — Kalām
// ────────────────────────────────────────────────────────────────
type SpeakingPrompt = { arabic: string; indonesian: string; hasAudio: boolean; audioSrc?: string };
type SpeakingLevel = { level: number; title: string; icon: string; color: string; desc: string; prompts: SpeakingPrompt[] };

const SPEAKING_LEVELS: SpeakingLevel[] = [
  {
    level: 1, title: "Dengar & Ulangi", icon: "🔊", color: "from-rose-500 to-pink-600",
    desc: "Dengarkan audio berikut, lalu ulangi pengucapannya.",
    prompts: [
      { arabic: "أَذْهَبُ إِلَى الْمَدْرَسَةِ فِي يَوْمِ الِاثْنَيْنِ.", indonesian: "Aku pergi ke sekolah pada hari Senin.", hasAudio: true },
    ],
  },
  {
    level: 2, title: "Baca & Ucapkan", icon: "📖", color: "from-orange-500 to-amber-500",
    desc: "Baca kalimat Arab ini dengan lantang, lalu rekam!",
    prompts: [
      { arabic: "أَذْهَبُ إِلَى الْمَسْجِدِ فِي يَوْمِ الْجُمُعَةِ.", indonesian: "Hari Jumat aku pergi ke masjid.", hasAudio: true },
    ],
  },
  {
    level: 3, title: "Jawab Pertanyaan", icon: "💬", color: "from-violet-500 to-purple-600",
    desc: "Jawab pertanyaan ini secara lisan dengan Bahasa Arabmu sendiri!",
    prompts: [
      { arabic: "مَاذَا تَفْعَلُ يَوْمَ الِاثْنَيْنِ؟", indonesian: "Apa yang kamu lakukan hari Senin?", hasAudio: true },
    ],
  },
];

const TAARUF_SPEAKING_LEVELS: SpeakingLevel[] = [
  { level: 1, title: "Dengar & Ulangi", icon: "🔊", color: "from-rose-500 to-pink-600", desc: "Dengarkan audio, lalu ulangi pengucapannya!", prompts: [{ arabic: "عُنْوَانِي فِي شَارِعِ أَحْمَدَ يَانِي، رَقْمُ ١١.", indonesian: "Alamatku di Jalan Ahmad Yani, nomor 11.", hasAudio: true, audioSrc: kalamLevel1AudioUrl }] },
  { level: 2, title: "Baca & Ucapkan", icon: "📖", color: "from-orange-500 to-amber-500", desc: "Baca kalimat ini dan ucapkan dengan jelas!", prompts: [{ arabic: "أَسْكُنُ فِي جَاكَرْتَا.", indonesian: "Aku tinggal di Jakarta.", hasAudio: false }] },
  { level: 3, title: "Perkenalkan Diri", icon: "💬", color: "from-violet-500 to-purple-600", desc: "Perkenalkan nama, identitas, tempat tinggal, dan sekolahmu secara singkat.", prompts: [{ arabic: "اِسْمِي ...، أَنَا تِلْمِيذٌ / تِلْمِيذَةٌ، أَسْكُنُ فِي ...، وَمَدْرَسَتِي فِي ...", indonesian: "Gunakan panduan Arab ini untuk memperkenalkan dirimu.", hasAudio: false }] },
];

const ALWAN_SPEAKING_LEVELS: SpeakingLevel[] = [
  { level: 1, title: "Dengar & Ulangi", icon: "🔊", color: "from-rose-500 to-pink-600", desc: "Dengarkan audio berikut, lalu ulangi pengucapannya.", prompts: [{ arabic: "الْحَقِيبَةُ سَوْدَاءُ.", indonesian: "Tas itu berwarna hitam.", hasAudio: true, audioSrc: kalamLevel1AlwanAudioUrl }] },
  { level: 2, title: "Baca & Ucapkan", icon: "📖", color: "from-orange-500 to-amber-500", desc: "Baca pertanyaan dan ucapkan jawabanmu!", prompts: [{ arabic: "مَا لَوْنُ السَّمَاءِ؟", indonesian: "Jawab: السَّمَاءُ زَرْقَاءُ.", hasAudio: false }] },
  { level: 3, title: "Jawab Pertanyaan", icon: "💬", color: "from-violet-500 to-purple-600", desc: "Jawab pertanyaan ini secara lisan!", prompts: [{ arabic: "مَا لَوْنُ قَمِيصِكَ؟", indonesian: "Jawab: قَمِيصِي أَبْيَضُ.", hasAudio: false }] },
];

const AYYAM_SPEAKING_LEVELS: SpeakingLevel[] = [
  { level: 1, title: "Dengar & Ulangi", icon: "🔊", color: "from-rose-500 to-pink-600", desc: "Dengarkan audio berikut, lalu ulangi pengucapannya.", prompts: [{ arabic: "أَذْهَبُ إِلَى الْمَدْرَسَةِ فِي يَوْمِ الِاثْنَيْنِ.", indonesian: "Aku pergi ke sekolah pada hari Senin.", hasAudio: true, audioSrc: kalamLevel1AyyamAudioUrl }] },
  { level: 2, title: "Baca & Ucapkan", icon: "📖", color: "from-orange-500 to-amber-500", desc: "Baca kalimat Arab ini dengan lantang, lalu rekam!", prompts: [{ arabic: "أَذْهَبُ إِلَى الْمَسْجِدِ فِي يَوْمِ الْجُمُعَةِ.", indonesian: "Hari Jumat aku pergi ke masjid.", hasAudio: false }] },
  { level: 3, title: "Jawab Pertanyaan", icon: "💬", color: "from-violet-500 to-purple-600", desc: "Jawab pertanyaan ini secara lisan dengan Bahasa Arabmu sendiri!", prompts: [{ arabic: "مَاذَا تَفْعَلُ يَوْمَ الِاثْنَيْنِ؟", indonesian: "Apa yang kamu lakukan hari Senin?", hasAudio: false }] },
];

function SpeakingPage({ onComplete, levels = SPEAKING_LEVELS, scrollOnResult = false, rewardPrefix, onReward }: { onComplete: () => void; levels?: SpeakingLevel[]; scrollOnResult?: boolean; rewardPrefix?: string; onReward?: (id: string, correct: boolean) => void }) {
  const [levelIdx, setLevelIdx] = useState(0);
  const [promptIdx, setPromptIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [levelDone, setLevelDone] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const level = levels[levelIdx];
  const prompt = level.prompts[promptIdx];

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [levelIdx]);

  useEffect(() => {
    if (scrollOnResult && allDone) window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [allDone, scrollOnResult]);

  useEffect(() => {
    if (submitted || levelDone) feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [submitted, levelDone]);

  const handleSubmit = () => {
    if (rewardPrefix) onReward?.(`${rewardPrefix}:level${levelIdx + 1}:prompt${promptIdx + 1}`, false);
    setSubmitted(true);
    if (promptIdx + 1 >= level.prompts.length) {
      setLevelDone(true);
      setCompletedLevels((prev) => [...prev, levelIdx]);
    }
  };

  const nextPrompt = () => { setSubmitted(false); setPromptIdx((i) => i + 1); };

  const nextLevel = () => {
    if (levelIdx + 1 >= levels.length) { setAllDone(true); return; }
    setLevelIdx((i) => i + 1);
    setPromptIdx(0);
    setSubmitted(false);
    setLevelDone(false);
  };

  if (allDone) return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 p-6 pt-28">
      <GeomShapes />
      <div className="relative z-10 max-w-lg mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center space-y-5 bounce-in">
          <div className="text-6xl">🌟</div>
          <h3 className="text-2xl font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>Kalām Selesai!</h3>
          <p className="text-gray-500 font-body">Kamu sudah menyelesaikan semua level latihan berbicara!</p>
          <div className="grid grid-cols-3 gap-3">
            {levels.map((lv, i) => (
              <div key={i} className={`rounded-2xl p-3 text-center ${completedLevels.includes(i) ? "bg-green-100 border-2 border-green-300" : "bg-gray-100 border-2 border-gray-200"}`}>
                <div className="text-lg">{lv.icon}</div>
                <div className="text-xs font-bold text-gray-600 mt-1" style={{ fontFamily: "Nunito, sans-serif" }}>L{i + 1}</div>
                {completedLevels.includes(i) && <div className="text-xs text-green-600">✓</div>}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-green-600 font-body">
            <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</span>
            Maharah Kalām — Selesai!
          </div>
          <button onClick={onComplete} className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black text-lg hover:scale-105 active:scale-95 transition-all" style={{ fontFamily: "Nunito, sans-serif" }}>
            ✍️ Lanjut ke Kitābah!
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 p-6 pt-28">
      <GeomShapes />
      <div className="relative z-10 max-w-lg mx-auto space-y-5">
        <div className={`bg-gradient-to-r ${level.color} rounded-3xl p-5 text-white`}>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">{level.icon}</span>
            <div>
              <div className="text-xs opacity-70 font-body">Level {level.level} dari {levels.length}</div>
              <h2 className="text-xl font-black" style={{ fontFamily: "Nunito, sans-serif" }}>{level.title}</h2>
            </div>
          </div>
          <p className="text-white/80 font-body text-sm">{level.desc}</p>
        </div>

        {/* Level selector tabs — sequential locking */}
        <div className="grid grid-cols-3 gap-2">
          {levels.map((lv, i) => {
            const isUnlocked = i === 0 || completedLevels.includes(i - 1);
            const isDone = completedLevels.includes(i);
            return (
              <button key={i}
                onClick={() => { if (!isUnlocked) return; setLevelIdx(i); setPromptIdx(0); setSubmitted(false); setLevelDone(false); }}
                disabled={!isUnlocked}
                className={`min-h-12 px-2 py-2 rounded-xl text-xs font-bold transition-all ${i === levelIdx ? "bg-rose-500 text-white shadow-md" : isDone ? "bg-green-100 text-green-700 border-2 border-green-300" : isUnlocked ? "bg-white text-gray-500 border-2 border-gray-200 hover:border-rose-300" : "bg-gray-100 text-gray-300 border-2 border-gray-200 cursor-not-allowed"}`}
                style={{ fontFamily: "Nunito, sans-serif" }}>
                {isDone ? "✓ " : !isUnlocked ? "🔒 " : ""}{lv.icon} L{i + 1}
              </button>
            );
          })}
        </div>

        {/* Prompt card */}
        <div className="bg-white rounded-3xl shadow-lg border-2 border-rose-200 p-6 space-y-4">
          <div className="text-center space-y-2">
            <p className="text-xs font-bold text-rose-400 font-body uppercase tracking-wide">
              {promptIdx + 1}/{level.prompts.length} — {level.level === 4 ? "مُحَمَّدٌ يَقُولُ:" : level.level === 3 ? "Pertanyaan:" : "Ucapkan:"}
            </p>
            <ArabicText className="block text-2xl font-black text-gray-800">{prompt.arabic}</ArabicText>
            <p className="text-gray-500 font-body text-sm italic whitespace-pre-line">{prompt.indonesian}</p>
          </div>
          {prompt.hasAudio && (
            <AudioPlayer label="🔊 Dengarkan contoh pengucapan" duration={4} compact src={prompt.audioSrc} />
          )}
        </div>

        {/* Recorder */}
        {!levelDone ? (
          <>
            {!submitted ? (
              <MicRecorder onSubmit={handleSubmit} submitLabel="✓ Kirim Rekaman" />
            ) : (
              <div ref={feedbackRef} className="bg-green-50 rounded-2xl border-2 border-green-300 p-5 text-center space-y-3 pop-in">
                <div className="text-4xl">✅</div>
                <p className="font-bold text-green-700 font-body">Bagus! Rekaman diterima! Terus berlatih!</p>
                {promptIdx + 1 < level.prompts.length && (
                  <button onClick={nextPrompt} className="w-full py-3 rounded-xl bg-green-500 text-white font-black hover:scale-105 active:scale-95 transition-all" style={{ fontFamily: "Nunito, sans-serif" }}>
                    Kalimat Berikutnya →
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div ref={feedbackRef} className="bg-white rounded-3xl shadow-xl p-6 text-center space-y-4 bounce-in">
            <div className="text-5xl">🎉</div>
            <p className="text-xl font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>Level {level.level} Selesai!</p>
            <button onClick={nextLevel} className={`w-full py-4 rounded-2xl bg-gradient-to-r ${level.color} text-white font-black text-lg hover:scale-105 active:scale-95 transition-all`} style={{ fontFamily: "Nunito, sans-serif" }}>
              {levelIdx + 1 >= levels.length ? "Semua Level Selesai!" : `Level ${levelIdx + 2} →`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// WRITING PAGE — Kitābah (3 levels)
// ────────────────────────────────────────────────────────────────
type WritingWord = { arabic: string; indonesian: string; transliteration: string; emoji: string };
type WritingLevel = { level: number; title: string; icon: string; desc: string; color: string; words: WritingWord[] };

const WRITING_LEVELS: WritingLevel[] = [
  { level: 1, title: "Menelusuri", icon: "👆", desc: "Telusuri kata Arab berikut!", color: "from-indigo-500 to-purple-600", words: [DAYS[0]] },
  { level: 2, title: "Menyalin", icon: "✏️", desc: "Lihat dan salin kata Arab!", color: "from-sky-500 to-indigo-500", words: [DAYS[2]] },
  { level: 3, title: "Mengingat", icon: "🧠", desc: "Tulis bahasa Arab dari artinya!", color: "from-violet-500 to-purple-700", words: [DAYS[3]] },
];

const TAARUF_WRITING_LEVELS: WritingLevel[] = [
  { level: 1, title: "Menelusuri", icon: "👆", desc: "Telusuri kalimat Arab berikut!", color: "from-indigo-500 to-purple-600", words: [{ arabic: "أَنَا تِلْمِيذٌ", indonesian: "Saya seorang siswa.", transliteration: "anā tilmīdhun", emoji: "✍️" }] },
  { level: 2, title: "Menyalin", icon: "✏️", desc: "Lihat dan salin kalimat Arab!", color: "from-sky-500 to-indigo-500", words: [{ arabic: "أَنَا بِخَيْرٍ، الْحَمْدُ لِلَّهِ.", indonesian: "Aku baik, alhamdulillah.", transliteration: "anā bikhairin, alḥamdulillāh", emoji: "✍️" }] },
  { level: 3, title: "Mengingat", icon: "🧠", desc: "Tulis bahasa Arab dari artinya!", color: "from-violet-500 to-purple-700", words: [{ arabic: "أَسْكُنُ فِي جَاكَرْتَا.", indonesian: "Saya tinggal di Jakarta.", transliteration: "askunu fī Jākartā", emoji: "✍️" }] },
];

const ALWAN_WRITING_LEVELS: WritingLevel[] = [
  { level: 1, title: "Menelusuri", icon: "👆", desc: "Telusuri kalimat Arab berikut!", color: "from-indigo-500 to-purple-600", words: [{ arabic: "الْحَقِيبَةُ سَوْدَاءُ.", indonesian: "Tas itu hitam.", transliteration: "al-ḥaqībatu saudā’u", emoji: "✍️" }] },
  { level: 2, title: "Menyalin", icon: "✏️", desc: "Lihat dan salin kalimat Arab!", color: "from-sky-500 to-indigo-500", words: [{ arabic: "السَّمَاءُ زَرْقَاءُ.", indonesian: "Langit berwarna biru.", transliteration: "as-samā’u zarqā’u", emoji: "✍️" }] },
  { level: 3, title: "Mengingat", icon: "🧠", desc: "Tulis bahasa Arab dari artinya!", color: "from-violet-500 to-purple-700", words: [{ arabic: "الْعِنَبُ بَنَفْسَجِيٌّ.", indonesian: "Anggur berwarna ungu.", transliteration: "al-‘inabu banafsajiyyun", emoji: "✍️" }] },
];

function drawWritingGuide(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.setLineDash([6, 10]);
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1.5;
  [0.3, 0.5, 0.7].forEach((r) => {
    ctx.beginPath(); ctx.moveTo(16, h * r); ctx.lineTo(w - 16, h * r); ctx.stroke();
  });
  ctx.restore();
}

function WritingPage({ onComplete, onWritingDone, levels = WRITING_LEVELS, rewardPrefix, onReward }: { onComplete: () => void; onWritingDone: () => void; levels?: WritingLevel[]; rewardPrefix?: string; onReward?: (id: string, correct: boolean) => void }) {
  const [levelIdx, setLevelIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [color, setColor] = useState("#1e293b");
  const [strokeW, setStrokeW] = useState(5);
  const [drawing, setDrawing] = useState(false);
  const [lastPt, setLastPt] = useState<{ x: number; y: number } | null>(null);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const writingFeedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [levelIdx, wordIdx]);

  useEffect(() => {
    if (submitted) writingFeedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [submitted]);

  const currentLevel = levels[levelIdx];
  const word = currentLevel.words[wordIdx];

  useEffect(() => {
    requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);
      drawWritingGuide(ctx, rect.width, rect.height);
    });
  }, [levelIdx, wordIdx]);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const sx = (canvas.width / dpr) / rect.width;
    const sy = (canvas.height / dpr) / rect.height;
    if ("touches" in e) return { x: (e.touches[0].clientX - rect.left) * sx, y: (e.touches[0].clientY - rect.top) * sy };
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    setHistory((h) => [...h.slice(-19), ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height)]);
    setDrawing(true); setLastPt(getPos(e));
  };
  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!drawing || !lastPt) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath(); ctx.moveTo(lastPt.x, lastPt.y); ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = color; ctx.lineWidth = strokeW; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
    setLastPt(pos);
  };
  const endDraw = () => { setDrawing(false); setLastPt(null); };

  const undo = () => {
    if (!history.length) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(history[history.length - 1], 0, 0);
    setHistory((h) => h.slice(0, -1));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    drawWritingGuide(ctx, canvas.width / dpr, canvas.height / dpr);
    setHistory([]);
  };

  const nextWord = () => {
    setSubmitted(false); setHistory([]);
    if (wordIdx + 1 < currentLevel.words.length) {
      setWordIdx((i) => i + 1);
    } else {
      setCompletedLevels((prev) => [...prev, levelIdx]);
      if (levelIdx + 1 >= levels.length) {
        onWritingDone();
        onComplete();
      } else {
        setLevelIdx((i) => i + 1); setWordIdx(0);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50 p-6 pt-28">
      <GeomShapes />
      <div className="relative z-10 max-w-lg mx-auto space-y-4">
        <div className={`bg-gradient-to-r ${currentLevel.color} rounded-3xl p-5 text-white`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentLevel.icon}</span>
              <div>
                <div className="text-xs opacity-70 font-body">Level {currentLevel.level} dari {levels.length}</div>
                <h2 className="text-lg font-black" style={{ fontFamily: "Nunito, sans-serif" }}>{currentLevel.title}</h2>
              </div>
            </div>
            <span className="text-sm font-bold opacity-80">Kata {wordIdx + 1}/{currentLevel.words.length}</span>
          </div>
          <p className="text-white/80 font-body text-xs">{currentLevel.desc}</p>
        </div>

        {/* Level tabs */}
        <div className="flex gap-2">
          {levels.map((lv, i) => (
            <button key={i}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${i === levelIdx ? "bg-indigo-500 text-white shadow-md" : completedLevels.includes(i) ? "bg-green-100 text-green-700 border-2 border-green-300" : i > levelIdx + 1 ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-white text-gray-500 border-2 border-gray-200"}`}
              style={{ fontFamily: "Nunito, sans-serif" }}
              disabled={i > levelIdx && !completedLevels.includes(i)}
              onClick={() => { if (completedLevels.includes(i) || i <= levelIdx) { setLevelIdx(i); setWordIdx(0); setSubmitted(false); setHistory([]); } }}>
              {completedLevels.includes(i) ? "✓ " : ""}{lv.icon} L{i + 1}
            </button>
          ))}
        </div>

        {/* Prompt */}
        <div className={`${currentLevel.level === 3 ? "bg-gradient-to-r from-violet-100 to-purple-100 border-violet-300" : "bg-gradient-to-r from-indigo-100 to-blue-100 border-indigo-300"} rounded-3xl border-2 p-5 text-center`}>
          {currentLevel.level === 3 ? (
            <>
              <p className="text-xs text-violet-500 font-bold font-body mb-1">Tulis bahasa Arab dari:</p>
              <div className="text-4xl font-black text-violet-700" style={{ fontFamily: "Nunito, sans-serif" }}>{word.indonesian}</div>
              <p className="text-xs text-violet-400 font-body mt-1">{word.emoji} — /{word.transliteration}/</p>
            </>
          ) : (
            <>
              <p className="text-xs text-indigo-500 font-bold font-body mb-2">{currentLevel.level === 1 ? "Telusuri kata ini:" : "Salin kata ini:"}</p>
              <ArabicText className="block text-5xl font-black text-gray-800">{word.arabic}</ArabicText>
              <p className="text-indigo-400 font-body text-xs mt-1">/{word.transliteration}/ — {word.indonesian} {word.emoji}</p>
            </>
          )}
        </div>

        {/* Tools */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-indigo-100 p-3 flex flex-wrap items-center gap-3">
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-400 font-body">Warna:</span>
            {["#1e293b", "#3b82f6", "#ef4444", "#10b981"].map((c) => (
              <button key={c} onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? "scale-125 border-gray-700" : "border-gray-300"}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="flex gap-1.5 ml-auto">
            <button onClick={undo} className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs hover:bg-gray-200 active:scale-95 transition-all">↩</button>
            <button onClick={clearCanvas} className="px-3 py-1.5 rounded-xl bg-red-100 text-red-600 font-bold text-xs hover:bg-red-200 active:scale-95 transition-all">🗑</button>
          </div>
        </div>

        {/* Canvas with guide overlay for Level 1 */}
        <div className="relative bg-white rounded-3xl shadow-xl border-2 border-indigo-200 overflow-hidden">
          {currentLevel.level === 1 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" aria-hidden>
              <ArabicText className="text-gray-100 select-none" style={{ fontSize: "clamp(56px, 16vw, 90px)", fontWeight: 900 }}>
                {word.arabic}
              </ArabicText>
            </div>
          )}
          {currentLevel.level === 3 && (
            <div className="absolute top-2 right-3 text-xs text-gray-200 font-bold z-0 pointer-events-none" style={{ fontFamily: "'Noto Naskh Arabic', Arial, serif", fontSize: "11px" }}>
              {word.arabic}
            </div>
          )}
          <canvas ref={canvasRef} className="relative z-10 w-full touch-none block" style={{ height: 260, cursor: "crosshair" }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
        </div>

        {/* Stroke width */}
        <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 border-2 border-indigo-100">
          <span className="text-xs text-gray-400 font-body">Ketebalan:</span>
          {[2, 5, 9, 14].map((w) => (
            <button key={w} onClick={() => setStrokeW(w)}
              className={`rounded-full bg-gray-800 transition-all ${strokeW === w ? "ring-2 ring-indigo-400 ring-offset-1" : ""}`}
              style={{ width: w + 8, height: w + 8 }} />
          ))}
        </div>

        {!submitted ? (
          <button onClick={() => { setSubmitted(true); if (rewardPrefix) onReward?.(`${rewardPrefix}:level${levelIdx + 1}:word${wordIdx + 1}`, false); }}
            className={`w-full py-4 rounded-2xl bg-gradient-to-r ${currentLevel.color} text-white font-black text-lg hover:scale-105 active:scale-95 transition-all`}
            style={{ fontFamily: "Nunito, sans-serif" }}>
            📤 Kirim Tulisan
          </button>
        ) : (
          <div ref={writingFeedbackRef} className="bg-green-50 rounded-2xl border-2 border-green-300 p-4 text-center space-y-3 pop-in">
            <div className="text-3xl">✅</div>
            <p className="font-bold text-green-700 font-body text-sm">Tulisanmu berhasil disimpan! Bagus sekali!</p>
            {currentLevel.level === 3 && (
              <div className="bg-white rounded-xl p-2 border border-green-200">
                <p className="text-xs text-gray-400 font-body">Jawaban: <ArabicText className="text-lg font-black text-gray-700">{word.arabic}</ArabicText></p>
              </div>
            )}
            <button onClick={nextWord}
              className={`w-full py-3 rounded-xl bg-gradient-to-r ${currentLevel.color} text-white font-black hover:scale-105 active:scale-95 transition-all`}
              style={{ fontFamily: "Nunito, sans-serif" }}>
              {wordIdx + 1 < currentLevel.words.length ? "Kata Berikutnya →" : levelIdx + 1 >= levels.length ? "Selesai!" : `Level ${levelIdx + 2} →`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// JOYFUL LEARNING — Game Menu + 3 Games
// ────────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────
// ILLUSTRATION COMPONENTS
// ────────────────────────────────────────────────────────────────
function DialogueIllustration() {
  return (
    <div className="rounded-2xl overflow-hidden border-2 border-sky-100 shadow-sm bg-sky-50 flex items-center justify-center" style={{ minHeight: 160 }}>
      <img
        src="/src/imports/DIALOG_ILLUSTRATION__D3BD579_.png"
        alt="Dialog illustration"
        loading="lazy"
        decoding="async"
        className="w-full h-auto block"
        style={{ maxHeight: 260, objectFit: "contain", display: "block" }}
      />
    </div>
  );
}

function StoryIllustration() {
  return (
    <div className="rounded-2xl overflow-hidden border-2 border-teal-100 shadow-sm bg-teal-50 flex items-center justify-center" style={{ minHeight: 160 }}>
      <img
        src="/src/imports/STORY_ILLUSTRATION.jpg.jpeg"
        alt="Story illustration"
        loading="lazy"
        decoding="async"
        className="w-full h-auto block"
        style={{ maxHeight: 240, objectFit: "contain", display: "block" }}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// GAMBAR KEGIATAN GAME — data
// ────────────────────────────────────────────────────────────────
const DRAW_PROMPTS = [
  { day: DAYS[0], activity: "Berlibur bersama keluarga", prompt: "Gambarkan kegiatan berlibur bersama keluarga!", sentence: "أَسْتَرِيحُ مَعَ أُسْرَتِي يَوْمَ الْأَحَدِ.", sentenceId: "Aku beristirahat bersama keluargaku di hari Minggu." },
  { day: DAYS[1], activity: "Upacara di sekolah", prompt: "Gambarkan siswa yang sedang mengikuti upacara di sekolah!", sentence: "أَذْهَبُ إِلَى الْمَدْرَسَةِ يَوْمَ الإِثْنَيْنِ.", sentenceId: "Aku pergi ke sekolah hari Senin." },
  { day: DAYS[2], activity: "Belajar di kelas", prompt: "Gambarkan kegiatan belajar di kelas!", sentence: "أَدْرُسُ فِي الْفَصْلِ يَوْمَ الثُّلَاثَاءِ.", sentenceId: "Aku belajar di kelas hari Selasa." },
  { day: DAYS[3], activity: "Bermain bersama teman", prompt: "Gambarkan kegiatan bermain bersama teman-teman!", sentence: "أَلْعَبُ مَعَ أَصْدِقَائِي يَوْمَ الْأَرْبِعَاءِ.", sentenceId: "Aku bermain bersama teman-temanku hari Rabu." },
  { day: DAYS[4], activity: "Belajar bahasa Arab", prompt: "Gambarkan kegiatan belajar bahasa Arab!", sentence: "أَتَعَلَّمُ اللُّغَةَ الْعَرَبِيَّةَ يَوْمَ الْخَمِيسِ.", sentenceId: "Aku belajar bahasa Arab hari Kamis." },
  { day: DAYS[5], activity: "Beribadah bersama keluarga", prompt: "Gambarkan kegiatan beribadah atau berkumpul bersama keluarga!", sentence: "أُصَلِّي مَعَ أُسْرَتِي يَوْمَ الْجُمُعَةِ.", sentenceId: "Aku shalat bersama keluargaku hari Jumat." },
  { day: DAYS[6], activity: "Bermain atau melakukan hobi", prompt: "Gambarkan kegiatan bermain atau hobi kesukaanmu!", sentence: "أَسْتَرِيحُ وَأَلْعَبُ فِي يَوْمِ السَّبْتِ.", sentenceId: "Aku beristirahat dan bermain di hari Sabtu." },
];

const ACTIVITY_OPTIONS = [
  { label: "bermain", arabic: "أَلْعَبُ", emoji: "🎮" },
  { label: "belajar", arabic: "أَدْرُسُ", emoji: "📚" },
  { label: "membaca", arabic: "أَقْرَأُ", emoji: "📖" },
  { label: "bermain bersama teman", arabic: "أَلْعَبُ مَعَ الْأَصْدِقَاءِ", emoji: "👫" },
  { label: "berkumpul dengan keluarga", arabic: "أَجْتَمِعُ مَعَ الْأُسْرَةِ", emoji: "👨‍👩‍👧" },
  { label: "berolahraga", arabic: "أُمَارِسُ الرِّيَاضَةَ", emoji: "⚽" },
  { label: "pergi berlibur", arabic: "أَذْهَبُ فِي إِجَازَةٍ", emoji: "🏖️" },
  { label: "melakukan hobi", arabic: "أُمَارِسُ هِوَايَتِي", emoji: "🎨" },
];

type JoyfulGame = "menu" | "cocokkan" | "arrange" | "draw";

function CocokkanGame({ onBack, onComplete }: { onBack: () => void; onComplete: (score: number) => void }) {
  const initialLeft = [DAYS[0], EXTRA_VOCAB[2], EXTRA_VOCAB[1], DAYS[1], DAYS[2], DAYS[3]];
  const [leftItems] = useState(initialLeft);
  const [rightItems] = useState(() => [...initialLeft].sort(() => Math.random() - 0.5));
  const [selLeft, setSelLeft] = useState<number | null>(null);
  const [selRight, setSelRight] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [wrongPair, setWrongPair] = useState<[number, number] | null>(null);

  const matchedLeft = Object.keys(matches).map(Number);
  const matchedRight = Object.values(matches);

  const checkMatch = (li: number, ri: number) => {
    if (leftItems[li].arabic === rightItems[ri].arabic) { playSound("correct"); setMatches((p) => ({ ...p, [li]: ri })); }
    else { playSound("wrong"); setWrongPair([li, ri]); setTimeout(() => setWrongPair(null), 700); }
    setSelLeft(null); setSelRight(null);
  };

  const handleLeft = (i: number) => { if (matchedLeft.includes(i)) return; if (selLeft === i) { setSelLeft(null); return; } if (selRight !== null) { checkMatch(i, selRight); return; } setSelLeft(i); };
  const handleRight = (i: number) => { if (matchedRight.includes(i)) return; if (selRight === i) { setSelRight(null); return; } if (selLeft !== null) { checkMatch(selLeft, i); return; } setSelRight(i); };
  const allDone = Object.keys(matches).length === leftItems.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6 pt-20 pb-10">
      <GeomShapes />
      <div className="relative z-10 max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white border-2 border-orange-200 flex items-center justify-center text-orange-500 hover:bg-orange-50 transition-all">←</button>
          <div className="flex-1 text-center">
            <h2 className="text-xl font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>🔗 Cocokkan Kata!</h2>
            <p className="text-gray-500 font-body text-xs">Klik Arab → klik artinya dalam Indonesia</p>
          </div>
        </div>
        <div className="text-center text-orange-600 font-bold" style={{ fontFamily: "Nunito, sans-serif" }}>{Object.keys(matches).length}/{leftItems.length} pasangan ✓</div>
        {!allDone ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Arab</div>
                {leftItems.map((item, i) => {
                  const isMatched = matchedLeft.includes(i); const isSel = selLeft === i; const isWrong = wrongPair?.[0] === i;
                  return (
                    <button key={i} onClick={() => handleLeft(i)} disabled={isMatched}
                      className={`w-full py-5 rounded-2xl border-2 font-black text-xl transition-all ${isMatched ? "bg-green-100 border-green-400 text-green-600" : isWrong ? "bg-red-100 border-red-400 text-red-600 shake" : isSel ? "bg-orange-100 border-orange-400 text-orange-700 scale-105 shadow-md" : "bg-white border-gray-200 text-gray-700 hover:border-orange-300 active:scale-95"}`}>
                      {isMatched ? "✓" : <ArabicText>{item.arabic}</ArabicText>}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-3">
                <div className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Indonesia</div>
                {rightItems.map((item, i) => {
                  const isMatched = matchedRight.includes(i); const isSel = selRight === i; const isWrong = wrongPair?.[1] === i;
                  return (
                    <button key={i} onClick={() => handleRight(i)} disabled={isMatched}
                      className={`w-full py-5 rounded-2xl border-2 font-bold font-body transition-all ${isMatched ? "bg-green-100 border-green-400 text-green-600" : isWrong ? "bg-red-100 border-red-400 text-red-600 shake" : isSel ? "bg-orange-100 border-orange-400 text-orange-700 scale-105 shadow-md" : "bg-white border-gray-200 text-gray-700 hover:border-orange-300 active:scale-95"}`}>
                      {isMatched ? "✓" : item.indonesian}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="text-center text-gray-400 font-body text-xs">Pilih kata Arab, lalu pilih artinya!</p>
          </>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center space-y-4 bounce-in">
            <div className="text-6xl">🎊</div>
            <h3 className="text-2xl font-black text-green-600" style={{ fontFamily: "Nunito, sans-serif" }}>Sempurna!</h3>
            <p className="text-gray-500 font-body">Kamu berhasil mencocokkan semua pasangan!</p>
            <button onClick={() => onComplete(leftItems.length)} className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-400 to-amber-500 text-white font-black text-lg hover:scale-105 active:scale-95 transition-all" style={{ fontFamily: "Nunito, sans-serif" }}>
              Selesai!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function JoyfulPage({ onComplete, onSaveScore, onReward }: { onComplete: () => void; onSaveScore: (s: number) => void; onReward?: (id: string, correct: boolean) => void }) {
  const [game, setGame] = useState<JoyfulGame>("menu");
  const [cocokkanScore, setCocokkanScore] = useState<number | null>(null);
  const [arrangeScore, setArrangeScore] = useState<number | null>(null);
  const [drawDone, setDrawDone] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [game]);

  const played = [cocokkanScore !== null, arrangeScore !== null, drawDone].filter(Boolean).length;

  const GAME_MAX = 6 + 5 + 1; // cocokkan + susun + draw

  const handleFinish = () => {
    const rawScore = (cocokkanScore ?? 0) + (arrangeScore ?? 0) + (drawDone ? 1 : 0);
    onSaveScore(rawScore);
    onComplete();
  };

  if (game === "cocokkan") return <CocokkanGame onBack={() => setGame("menu")} onComplete={(s) => { onReward?.("ayyam:game:cocokkan", true); setCocokkanScore(s); setGame("menu"); }} />;
  if (game === "arrange") return <SusunKataGame onBack={() => setGame("menu")} onComplete={(s) => { onReward?.("ayyam:game:arrange", true); setArrangeScore(s); setGame("menu"); }} />;
  if (game === "draw") return <GambarKegiatanGame onBack={() => setGame("menu")} onComplete={() => { onReward?.("ayyam:game:draw", false); setDrawDone(true); setGame("menu"); }} />;

  const games = [
    { id: "cocokkan" as JoyfulGame, icon: "🔗", title: "Cocokkan Kata!", desc: "Cocokkan Arab dengan artinya", color: "border-orange-300 bg-orange-50", done: cocokkanScore !== null, score: cocokkanScore !== null ? `${cocokkanScore}/6` : null },
    { id: "arrange" as JoyfulGame, icon: "📝", title: "Susun Kalimat!", desc: "Susun kalimat Arab yang benar", color: "border-amber-300 bg-amber-50", done: arrangeScore !== null, score: arrangeScore !== null ? `${arrangeScore}/5` : null },
    { id: "draw" as JoyfulGame, icon: "🎨", title: "Gambar Kegiatan!", desc: "Ekspresikan kegiatanmu melalui gambar", color: "border-violet-300 bg-violet-50", done: drawDone, score: drawDone ? "Selesai" : null },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 p-6 pt-20 pb-10">
      <GeomShapes />
      <div className="relative z-10 max-w-lg mx-auto space-y-5">
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-3xl p-5 text-white text-center">
          <div className="text-3xl mb-1">🎮</div>
          <h2 className="text-2xl font-black" style={{ fontFamily: "Nunito, sans-serif" }}>Mini Game</h2>
          <p className="text-pink-100 font-body text-sm">Belajar sambil bermain!</p>
        </div>

        <div className="flex justify-center gap-3 text-sm font-body items-center">
          <span className="text-gray-400">{played}/3 game dimainkan</span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => <div key={i} className={`w-3 h-3 rounded-full ${i < played ? "bg-green-400" : "bg-gray-200"}`} />)}
          </div>
        </div>

        <div className="space-y-3">
          {games.map((g) => (
            <button key={g.id} onClick={() => setGame(g.id)}
              className={`w-full rounded-2xl border-2 p-4 text-left flex items-center gap-4 hover:scale-105 active:scale-95 transition-all ${g.color} ${g.done ? "opacity-80" : ""}`}>
              <div className="w-14 h-14 rounded-2xl bg-white/80 flex items-center justify-center text-3xl shrink-0 shadow-sm">{g.icon}</div>
              <div className="flex-1">
                <div className="font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>{g.title}</div>
                <div className="text-xs text-gray-500 font-body">{g.desc}</div>
              </div>
              {g.done ? (
                <div className="text-right">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm">✓</div>
                  {g.score && <div className="text-xs text-green-600 font-bold mt-0.5">{g.score}</div>}
                </div>
              ) : (
                <div className="text-gray-400 text-xl">→</div>
              )}
            </button>
          ))}
        </div>

        {played < 3 ? (
          <div className="bg-gray-100 rounded-2xl p-4 text-center border-2 border-gray-200">
            <div className="text-2xl mb-1">🔒</div>
            <p className="font-bold text-gray-500 font-body text-sm">Selesaikan semua permainan terlebih dahulu</p>
            <p className="text-xs text-gray-400 font-body mt-1">{played}/3 game selesai</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-green-100 rounded-2xl p-3 text-center border-2 border-green-300">
              <p className="font-black text-green-700 font-body">🎉 Semua permainan selesai!</p>
            </div>
            <button onClick={handleFinish}
              className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:scale-105 active:scale-95 shadow-lg transition-all"
              style={{ fontFamily: "Nunito, sans-serif" }}>
              📝 Lanjut ke Evaluasi →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TebakHariGame({ onBack, onComplete }: { onBack: () => void; onComplete: (score: number) => void }) {
  const ALL_VOCAB = [...DAYS, ...EXTRA_VOCAB];
  const TOTAL = 7;
  const [questions] = useState(() => {
    const shuffled = [...ALL_VOCAB].sort(() => Math.random() - 0.5).slice(0, TOTAL);
    return shuffled.map((correct) => {
      const wrongs = ALL_VOCAB.filter((d) => d.arabic !== correct.arabic).sort(() => Math.random() - 0.5).slice(0, 3);
      return { correct, options: [...wrongs, correct].sort(() => Math.random() - 0.5) };
    });
  });
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const tebakFeedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [qIdx]);

  useEffect(() => {
    if (chosen) tebakFeedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [chosen]);

  const q = questions[qIdx];
  const handleAnswer = (opt: (typeof DAYS)[0]) => {
    if (chosen) return;
    const correct = opt.arabic === q.correct.arabic;
    const ns = correct ? score + 1 : score;
    setChosen(opt.arabic);
    playSound(correct ? "correct" : "wrong");
    if (correct) setScore(ns);
    setTimeout(() => {
      if (qIdx + 1 >= TOTAL) { setFinalScore(ns); setDone(true); }
      else { setQIdx((i) => i + 1); setChosen(null); }
    }, 1100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 p-6 pt-28">
      <GeomShapes />
      <div className="relative z-10 max-w-lg mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white border-2 border-pink-200 flex items-center justify-center text-pink-600 font-bold hover:bg-pink-50 active:scale-90 transition-all">←</button>
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl px-4 py-2 flex-1 text-white text-center">
            <span className="font-black" style={{ fontFamily: "Nunito, sans-serif" }}>🎯 Tebak Hari! — {qIdx + 1}/{TOTAL}</span>
          </div>
          <div className="bg-white rounded-2xl px-3 py-2 border-2 border-pink-200 font-black text-pink-600" style={{ fontFamily: "Nunito, sans-serif" }}>⭐{score}</div>
        </div>
        {!done ? (
          <>
            <div className="bg-white rounded-3xl shadow-xl border-2 border-pink-200 p-8 text-center" key={qIdx}>
              <ArabicText className="block text-5xl sm:text-6xl font-black text-gray-800">{q.correct.arabic}</ArabicText>
              <p className="text-gray-400 font-body text-sm mt-2">Apa arti kata ini?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {q.options.map((opt, i) => {
                const isC = opt.arabic === q.correct.arabic; const isSel = chosen === opt.arabic;
                return (
                  <button key={i} onClick={() => handleAnswer(opt)} disabled={!!chosen}
                    className={`py-6 rounded-2xl border-2 font-black text-lg transition-all ${!chosen ? "bg-white border-gray-200 text-gray-700 hover:border-pink-400 hover:scale-105 active:scale-95" : isC ? "bg-green-100 border-green-400 text-green-700 scale-105" : isSel ? "bg-red-100 border-red-400 text-red-600" : "bg-gray-50 border-gray-200 text-gray-300 opacity-50"}`}
                    style={{ fontFamily: "Nunito, sans-serif" }}>
                    {opt.indonesian}
                  </button>
                );
              })}
            </div>
            {chosen && <div ref={tebakFeedbackRef} className={`rounded-2xl p-4 text-center font-bold font-body pop-in ${chosen === q.correct.arabic ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{chosen === q.correct.arabic ? "Benar! +1" : `Jawaban: ${q.correct.indonesian}`}</div>}
          </>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center space-y-5 bounce-in">
            <div className="text-6xl">{finalScore >= TOTAL ? "🏆" : finalScore >= TOTAL * 0.6 ? "🌟" : "💪"}</div>
            <h3 className="text-2xl font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>Skor: {finalScore}/{TOTAL}</h3>
            <button onClick={() => onComplete(finalScore)} className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-lg hover:scale-105 active:scale-95 transition-all" style={{ fontFamily: "Nunito, sans-serif" }}>Kembali ke Menu</button>
          </div>
        )}
      </div>
    </div>
  );
}

function SusunKataGame({ onBack, onComplete }: { onBack: () => void; onComplete: (score: number) => void }) {
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [arrangement, setArrangement] = useState<string[]>([]);
  const [pool, setPool] = useState(() => [...ARRANGE_DATA[0].words].sort(() => Math.random() - 0.5));
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [done, setDone] = useState(false);
  const susunFeedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [qIdx]);

  useEffect(() => {
    if (checked) susunFeedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [checked]);

  const q = ARRANGE_DATA[qIdx];

  const clickPool = (w: string, i: number) => {
    if (checked) return;
    setArrangement((a) => [...a, w]);
    setPool((p) => p.filter((_, j) => j !== i));
  };
  const clickArranged = (w: string, i: number) => {
    if (checked) return;
    setPool((p) => [...p, w]);
    setArrangement((a) => a.filter((_, j) => j !== i));
  };
  const check = () => {
    const isCorrect = arrangement.join(" ") === q.correct.join(" ");
    setCorrect(isCorrect);
    setChecked(true);
    playSound(isCorrect ? "correct" : "wrong");
    if (isCorrect) setScore((s) => s + 1);
  };
  const next = () => {
    if (qIdx + 1 >= ARRANGE_DATA.length) { setDone(true); return; }
    const nextQ = ARRANGE_DATA[qIdx + 1];
    setQIdx((i) => i + 1);
    setArrangement([]);
    setPool([...nextQ.words].sort(() => Math.random() - 0.5));
    setChecked(false); setCorrect(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 p-6 pt-28">
      <GeomShapes />
      <div className="relative z-10 max-w-lg mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white border-2 border-amber-200 flex items-center justify-center text-amber-600 font-bold hover:bg-amber-50 active:scale-90 transition-all">←</button>
          <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl px-4 py-2 flex-1 text-white text-center">
            <span className="font-black" style={{ fontFamily: "Nunito, sans-serif" }}>📝 Susun Kata! — {qIdx + 1}/{ARRANGE_DATA.length}</span>
          </div>
          <div className="bg-white rounded-2xl px-3 py-2 border-2 border-amber-200 font-black text-amber-600" style={{ fontFamily: "Nunito, sans-serif" }}>⭐{score}</div>
        </div>
        {!done ? (
          <>
            <div className="bg-white rounded-3xl shadow-lg border-2 border-amber-200 p-5 text-center" key={qIdx}>
              <p className="text-xs text-gray-400 font-body mb-2">Susun kata Arab ini dengan urutan yang benar!</p>
              <p className="text-sm text-amber-600 font-bold font-body">Makna: "{q.meaning}"</p>
            </div>
            {/* Answer area */}
            <div className="bg-amber-50 rounded-2xl border-2 border-amber-200 p-4 min-h-16 flex items-center justify-end flex-wrap gap-2" dir="rtl">
              {arrangement.length === 0 && <p className="text-gray-300 font-body text-sm w-full text-center" dir="ltr">Klik kata untuk disusun di sini...</p>}
              {arrangement.map((w, i) => (
                <button key={i} onClick={() => clickArranged(w, i)} disabled={checked}
                  className={`px-4 py-2 rounded-xl font-black text-lg border-2 transition-all ${checked ? (correct ? "bg-green-100 border-green-400 text-green-700" : "bg-red-100 border-red-400 text-red-600") : "bg-white border-amber-400 text-gray-700 hover:bg-amber-100 active:scale-95"}`}
                  style={{ fontFamily: "'Noto Naskh Arabic', Arial, serif" }}>
                  {w}
                </button>
              ))}
            </div>
            {/* Word pool */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 flex flex-wrap gap-2 justify-center" dir="rtl">
              {pool.map((w, i) => (
                <button key={i} onClick={() => clickPool(w, i)} disabled={checked}
                  className="px-4 py-2 rounded-xl bg-gray-100 border-2 border-gray-300 text-gray-700 font-black text-lg hover:bg-amber-100 hover:border-amber-400 active:scale-95 transition-all"
                  style={{ fontFamily: "'Noto Naskh Arabic', Arial, serif" }}>
                  {w}
                </button>
              ))}
              {pool.length === 0 && !checked && <p className="text-gray-300 text-sm font-body" dir="ltr">Semua kata sudah dipilih!</p>}
            </div>
            {!checked ? (
              <button onClick={check} disabled={arrangement.length !== q.words.length}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-black text-lg disabled:opacity-40 hover:scale-105 active:scale-95 transition-all"
                style={{ fontFamily: "Nunito, sans-serif" }}>
                Periksa Jawaban
              </button>
            ) : (
              <>
                <div ref={susunFeedbackRef} className={`rounded-2xl p-4 text-center font-bold font-body pop-in ${correct ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {correct ? "Benar! Urutan kata tepat!" : `Urutan yang benar: ${q.correct.join(" — ")}`}
                </div>
                <button onClick={next} className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-black text-lg hover:scale-105 active:scale-95 transition-all" style={{ fontFamily: "Nunito, sans-serif" }}>
                  {qIdx + 1 >= ARRANGE_DATA.length ? "Selesai!" : "Kalimat Berikutnya →"}
                </button>
              </>
            )}
          </>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center space-y-5 bounce-in">
            <div className="text-6xl">{score === ARRANGE_DATA.length ? "🏆" : "🌟"}</div>
            <h3 className="text-2xl font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>Skor: {score}/{ARRANGE_DATA.length}</h3>
            <button onClick={() => onComplete(score)} className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-black text-lg hover:scale-105 active:scale-95 transition-all" style={{ fontFamily: "Nunito, sans-serif" }}>Kembali ke Menu</button>
          </div>
        )}
      </div>
    </div>
  );
}

function GambarKegiatanGame({ onBack, onComplete }: { onBack: () => void; onComplete: () => void }) {
  type GambarMode = "select" | "modeA" | "modeB-day" | "modeB-activity" | "draw";
  const [gambarMode, setGambarMode] = useState<GambarMode>("select");
  const [prompt] = useState(() => DRAW_PROMPTS[Math.floor(Math.random() * DRAW_PROMPTS.length)]);
  const [favDay, setFavDay] = useState<(typeof DAYS)[0] | null>(null);
  const [favActivity, setFavActivity] = useState<(typeof ACTIVITY_OPTIONS)[0] | null>(null);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [brushSize, setBrushSize] = useState(5);
  const [color, setColor] = useState("#1e293b");
  const [hasDrawn, setHasDrawn] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSentence, setShowSentence] = useState(false);
  const [customSentence, setCustomSentence] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const histRef = useRef<ImageData[]>([]);
  const futRef = useRef<ImageData[]>([]);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  const COLORS = ["#1e293b", "#EF4444", "#3B82F6", "#22C55E", "#F97316", "#8B5CF6", "#EC4899", "#EAB308"];

  useEffect(() => {
    if (submitted) document.getElementById("gambar-result")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [submitted]);

  useEffect(() => {
    if (gambarMode !== "draw") return;
    requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#FFFBF0";
      ctx.fillRect(0, 0, rect.width, rect.height);
      histRef.current = [];
      futRef.current = [];
    });
  }, [gambarMode]);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const t = (e as React.TouchEvent).touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    histRef.current = [...histRef.current.slice(-19), ctx.getImageData(0, 0, rect.width * dpr, rect.height * dpr)];
    futRef.current = [];
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    drawingRef.current = true;
    const pt = getPos(e);
    lastRef.current = pt;
    saveHistory();
    const ctx = canvasRef.current!.getContext("2d")!;
    const r = tool === "eraser" ? brushSize * 3 : brushSize;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, r / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === "eraser" ? "#FFFBF0" : color;
    ctx.fill();
    setHasDrawn(true);
  };

  const moveDraw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!drawingRef.current || !lastRef.current) return;
    e.preventDefault();
    const pt = getPos(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.strokeStyle = tool === "eraser" ? "#FFFBF0" : color;
    ctx.lineWidth = tool === "eraser" ? brushSize * 3 : brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastRef.current = pt;
  };

  const endDraw = () => { drawingRef.current = false; lastRef.current = null; };

  const undo = () => {
    if (!histRef.current.length) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    futRef.current = [...futRef.current, ctx.getImageData(0, 0, rect.width * dpr, rect.height * dpr)];
    ctx.putImageData(histRef.current[histRef.current.length - 1], 0, 0);
    histRef.current = histRef.current.slice(0, -1);
  };

  const redo = () => {
    if (!futRef.current.length) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    histRef.current = [...histRef.current, ctx.getImageData(0, 0, rect.width * dpr, rect.height * dpr)];
    ctx.putImageData(futRef.current[futRef.current.length - 1], 0, 0);
    futRef.current = futRef.current.slice(0, -1);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    saveHistory();
    ctx.fillStyle = "#FFFBF0";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
  };

  const currentDay = favDay ?? prompt.day;
  const modelSentence = favDay && favActivity
    ? `${favActivity.arabic} في يوم ${favDay.arabic}.`
    : prompt.sentence;
  const modelSentenceId = favDay && favActivity
    ? `Aku ${favActivity.label} di hari ${favDay.indonesian}.`
    : prompt.sentenceId;
  const currentPrompt = favDay
    ? `Gambarkan kegiatanmu di hari ${favDay.indonesian}!`
    : prompt.prompt;

  // MODE SELECT
  if (gambarMode === "select") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-fuchsia-50 p-6 pt-28">
        <GeomShapes />
        <div className="relative z-10 max-w-lg mx-auto space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-10 h-10 rounded-full bg-white border-2 border-violet-200 flex items-center justify-center text-violet-600 font-bold hover:bg-violet-50 active:scale-90 transition-all">←</button>
            <div className="bg-gradient-to-r from-violet-500 to-fuchsia-600 rounded-2xl px-4 py-2 flex-1 text-white text-center">
              <span className="font-black" style={{ fontFamily: "Nunito, sans-serif" }}>🎨 Gambar Kegiatan</span>
            </div>
          </div>
          <div className="bg-white rounded-3xl shadow-lg border-2 border-violet-200 p-6 text-center space-y-2">
            <div className="text-5xl">🎨</div>
            <h2 className="text-xl font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>Gambar Kegiatan</h2>
            <p className="text-gray-500 font-body text-sm">Ekspresikan kegiatanmu melalui gambar!</p>
          </div>
          <div className="space-y-3">
            <button onClick={() => setGambarMode("modeA")}
              className="w-full rounded-2xl border-2 border-violet-300 bg-violet-50 p-5 text-left flex items-center gap-4 hover:scale-105 active:scale-95 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-white/80 flex items-center justify-center text-3xl shrink-0 shadow-sm">🎯</div>
              <div className="flex-1">
                <div className="font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>Tantangan Hari Ini</div>
                <div className="text-xs text-gray-500 font-body">Gambarkan kegiatan yang dipilih sistem!</div>
              </div>
              <div className="text-gray-400 text-xl">→</div>
            </button>
            <button onClick={() => setGambarMode("modeB-day")}
              className="w-full rounded-2xl border-2 border-fuchsia-300 bg-fuchsia-50 p-5 text-left flex items-center gap-4 hover:scale-105 active:scale-95 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-white/80 flex items-center justify-center text-3xl shrink-0 shadow-sm">🌟</div>
              <div className="flex-1">
                <div className="font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>Hari Favoritku</div>
                <div className="text-xs text-gray-500 font-body">Pilih hari favoritmu dan gambar kegiatannya!</div>
              </div>
              <div className="text-gray-400 text-xl">→</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MODE A prompt card
  if (gambarMode === "modeA") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-fuchsia-50 p-6 pt-28">
        <GeomShapes />
        <div className="relative z-10 max-w-lg mx-auto space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setGambarMode("select")} className="w-10 h-10 rounded-full bg-white border-2 border-violet-200 flex items-center justify-center text-violet-600 font-bold hover:bg-violet-50 active:scale-90 transition-all">←</button>
            <div className="bg-gradient-to-r from-violet-500 to-fuchsia-600 rounded-2xl px-4 py-2 flex-1 text-white text-center">
              <span className="font-black" style={{ fontFamily: "Nunito, sans-serif" }}>🎯 Tantangan Hari Ini</span>
            </div>
          </div>
          <div className={`bg-white rounded-3xl shadow-xl border-2 ${prompt.day.border} p-6 space-y-4 text-center`}>
            <div className="text-4xl">{prompt.day.emoji}</div>
            <ArabicText className="block text-5xl font-black text-gray-800">{prompt.day.arabic}</ArabicText>
            <div className="text-xl font-black text-gray-700" style={{ fontFamily: "Nunito, sans-serif" }}>{prompt.day.indonesian}</div>
            <div className={`${prompt.day.bg} rounded-2xl p-3 border-2 ${prompt.day.border}`}>
              <p className="text-sm text-gray-600 font-body">Kegiatan di hari <strong>{prompt.day.indonesian}</strong>:</p>
              <p className={`font-bold mt-1 ${prompt.day.accent}`} style={{ fontFamily: "Nunito, sans-serif" }}>{prompt.activity}</p>
            </div>
            <div className="bg-violet-50 rounded-2xl p-4 border-2 border-violet-200">
              <p className="text-violet-700 font-bold font-body">🎨 {prompt.prompt}</p>
            </div>
          </div>
          <button onClick={() => setGambarMode("draw")}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-md"
            style={{ fontFamily: "Nunito, sans-serif" }}>
            ✏️ Mulai Menggambar!
          </button>
        </div>
      </div>
    );
  }

  // MODE B — day selection
  if (gambarMode === "modeB-day") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 to-pink-50 p-6 pt-28">
        <GeomShapes />
        <div className="relative z-10 max-w-lg mx-auto space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setGambarMode("select")} className="w-10 h-10 rounded-full bg-white border-2 border-fuchsia-200 flex items-center justify-center text-fuchsia-600 font-bold hover:bg-fuchsia-50 active:scale-90 transition-all">←</button>
            <div className="bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-2xl px-4 py-2 flex-1 text-white text-center">
              <span className="font-black" style={{ fontFamily: "Nunito, sans-serif" }}>🌟 Hari Favoritku</span>
            </div>
          </div>
          <div className="bg-white rounded-3xl shadow-lg border-2 border-fuchsia-200 p-5 text-center space-y-1">
            <ArabicText className="block text-2xl font-black text-gray-800">ما يومك المفضل؟</ArabicText>
            <p className="text-gray-500 font-body text-sm">Pilih hari favoritmu!</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {DAYS.map((day) => (
              <button key={day.arabic} onClick={() => { setFavDay(day); setGambarMode("modeB-activity"); }}
                className={`${day.bg} border-2 ${day.border} rounded-2xl p-4 text-center hover:scale-105 active:scale-95 transition-all`}>
                <div className="text-3xl mb-1">{day.emoji}</div>
                <ArabicText className={`block text-xl font-black ${day.accent}`}>{day.arabic}</ArabicText>
                <div className="text-xs text-gray-500 font-body mt-1">{day.indonesian}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // MODE B — activity selection
  if (gambarMode === "modeB-activity") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 to-pink-50 p-6 pt-28">
        <GeomShapes />
        <div className="relative z-10 max-w-lg mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setGambarMode("modeB-day")} className="w-10 h-10 rounded-full bg-white border-2 border-fuchsia-200 flex items-center justify-center text-fuchsia-600 font-bold hover:bg-fuchsia-50 active:scale-90 transition-all">←</button>
            <div className="bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-2xl px-4 py-2 flex-1 text-white text-center">
              <span className="font-black" style={{ fontFamily: "Nunito, sans-serif" }}>✨ Kegiatan Favoritku</span>
            </div>
          </div>
          {favDay && (
            <div className={`${favDay.bg} border-2 ${favDay.border} rounded-2xl p-3 flex items-center gap-3`}>
              <span className="text-3xl">{favDay.emoji}</span>
              <div>
                <ArabicText className={`block text-xl font-black ${favDay.accent}`}>{favDay.arabic}</ArabicText>
                <p className="text-xs text-gray-500 font-body">{favDay.indonesian}</p>
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl border-2 border-fuchsia-200 p-4 text-center">
            <ArabicText className="block text-base font-black text-gray-700">ما النشاط الذي تحب أن تفعله في هذا اليوم؟</ArabicText>
            <p className="text-gray-400 font-body text-xs mt-1">Pilih kegiatan yang kamu suka!</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ACTIVITY_OPTIONS.map((act) => (
              <button key={act.label} onClick={() => { setFavActivity(act); setGambarMode("draw"); }}
                className="bg-white border-2 border-fuchsia-200 rounded-2xl p-3 text-center hover:bg-fuchsia-50 hover:border-fuchsia-400 active:scale-95 transition-all">
                <div className="text-2xl mb-1">{act.emoji}</div>
                <div className="text-xs font-bold text-gray-700 font-body">{act.label}</div>
                <ArabicText className="block text-xs text-fuchsia-600 mt-0.5">{act.arabic}</ArabicText>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // DRAW canvas
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-fuchsia-50 p-4 pt-28">
      <GeomShapes />
      <div className="relative z-10 max-w-lg mx-auto space-y-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setGambarMode(favDay ? "modeB-activity" : "modeA")} className="w-10 h-10 rounded-full bg-white border-2 border-violet-200 flex items-center justify-center text-violet-600 font-bold hover:bg-violet-50 active:scale-90 transition-all">←</button>
          <div className={`border-2 ${currentDay.border} ${currentDay.bg} rounded-2xl px-4 py-2 flex-1 text-center flex items-center justify-center gap-2`}>
            <span className="text-xl">{currentDay.emoji}</span>
            <ArabicText className={`font-black text-sm ${currentDay.accent}`}>{currentDay.arabic}</ArabicText>
            <span className="text-xs text-gray-500 font-body">— {currentDay.indonesian}</span>
          </div>
        </div>
        <div className="bg-violet-50 rounded-2xl border-2 border-violet-200 p-3 text-center">
          <p className="text-violet-700 font-bold font-body text-sm">🎨 {currentPrompt}</p>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border-2 border-violet-200 p-3 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-body shrink-0">Warna:</span>
            {COLORS.map((c) => (
              <button key={c} onClick={() => { setColor(c); setTool("pen"); }}
                className={`w-7 h-7 rounded-full border-2 transition-all ${color === c && tool === "pen" ? "border-gray-800 scale-125 shadow-md" : "border-gray-200"}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setTool("pen")} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${tool === "pen" ? "bg-violet-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>✏️ Pensil</button>
            <button onClick={() => setTool("eraser")} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${tool === "eraser" ? "bg-gray-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>🧹 Hapus</button>
            <div className="flex-1" />
            {[2, 5, 10, 16].map((s) => (
              <button key={s} onClick={() => setBrushSize(s)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border-2 ${brushSize === s ? "border-violet-400 bg-violet-100" : "border-transparent bg-gray-100"}`}>
                <div className="rounded-full bg-gray-600" style={{ width: Math.min(s + 4, 18), height: Math.min(s + 4, 18) }} />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={undo} className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs hover:bg-gray-200 active:scale-95 transition-all">↩ Undo</button>
            <button onClick={redo} className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs hover:bg-gray-200 active:scale-95 transition-all">↪ Redo</button>
            <button onClick={clearCanvas} className="flex-1 py-2 rounded-xl bg-red-50 text-red-500 font-bold text-xs hover:bg-red-100 active:scale-95 transition-all">🗑️ Hapus</button>
          </div>
        </div>

        {/* Canvas */}
        <div className="bg-amber-50 rounded-2xl border-2 border-violet-200 overflow-hidden shadow-inner" style={{ height: "280px" }}>
          <canvas ref={canvasRef} className="w-full h-full touch-none cursor-crosshair"
            onMouseDown={startDraw} onMouseMove={moveDraw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={moveDraw} onTouchEnd={endDraw} />
        </div>

        {!submitted ? (
          <button onClick={() => setSubmitted(true)} disabled={!hasDrawn}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-black text-lg disabled:opacity-40 hover:scale-105 active:scale-95 transition-all shadow-md"
            style={{ fontFamily: "Nunito, sans-serif" }}>
            🎨 Kirim Gambar!
          </button>
        ) : (
          <div id="gambar-result" className="bg-white rounded-3xl shadow-xl border-2 border-violet-200 p-6 space-y-4 pop-in">
            <div className="text-center">
              <div className="text-5xl mb-2">🎉</div>
              <h3 className="text-xl font-black text-violet-700" style={{ fontFamily: "Nunito, sans-serif" }}>Hebat! Kamu sudah menyelesaikan gambar kegiatanmu! 🎨</h3>
            </div>
            <div className="bg-violet-50 rounded-2xl border-2 border-violet-200 p-4 space-y-3">
              <ArabicText className="block text-center text-lg font-black text-gray-700">اكتب جملة عن صورتك!</ArabicText>
              <p className="text-center text-xs text-gray-500 font-body">Tulis satu kalimat tentang gambarmu! (opsional)</p>
              <button onClick={() => setShowSentence((v) => !v)}
                className="w-full py-2 rounded-xl bg-violet-100 text-violet-700 font-bold text-sm hover:bg-violet-200 transition-all">
                {showSentence ? "🙈 Sembunyikan Contoh" : "👀 Lihat Contoh Kalimat Arab"}
              </button>
              {showSentence && (
                <div className="bg-white rounded-xl p-3 border border-violet-200 text-center pop-in">
                  <ArabicText className="block text-lg font-bold text-gray-800">{modelSentence}</ArabicText>
                  <p className="text-xs text-gray-400 font-body italic mt-1">{modelSentenceId}</p>
                </div>
              )}
              <input type="text" value={customSentence} onChange={(e) => setCustomSentence(e.target.value)}
                placeholder="اكتب جملتك هنا... (opsional)"
                className="w-full px-4 py-3 rounded-xl border-2 border-violet-200 text-gray-700 text-sm focus:outline-none focus:border-violet-400"
                dir="rtl" style={{ fontFamily: "'Noto Naskh Arabic', Arial, serif" }} />
            </div>
            <button onClick={onComplete}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-black text-lg hover:scale-105 active:scale-95 transition-all"
              style={{ fontFamily: "Nunito, sans-serif" }}>
              Kembali ke Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// EVALUATION — 4 Maharah
// ────────────────────────────────────────────────────────────────
type EvalSection = "listening" | "reading" | "speaking" | "writing" | "vocab" | "done";

const MATERIAL_EVAL = {
  taaruf: {
    listening: { q: "أَيْنَ يَسْكُنُ؟", opts: ["فِي جَاكَرْتَا", "فِي بَانْدُونْجَ", "فِي سُورَابَايَا"], ans: "فِي جَاكَرْتَا" },
    speaking: { q: "مَا اسْمُكَ؟", translation: "Siapa namamu?" },
    reading: { text: READING_CONTENT.taaruf.arabic, q: "أَيْنَ تَسْكُنُ فَاطِمَةُ؟", opts: ["فِي بُوْغُوْرَ", "فِي بَانْدُونْغَ", "فِي جَاكَرْتَا", "فِي سُورَابَايَا"], ans: "فِي بَانْدُونْغَ" },
    writing: { label: "أَنَا تِلْمِيذٌ", guide: "أَنَا تِلْمِيذٌ" },
    vocab: [
      { q: "Kamu ingin mengetahui alamat teman. Pertanyaan apa yang tepat?", opts: ["مَا عُنْوَانُكَ؟", "مَا اسْمُكَ؟", "كَيْفَ حَالُكَ؟"], ans: "مَا عُنْوَانُكَ؟" },
      { q: "Ketika kamu ingin mengunjungi rumah temanmu, pertanyaan apa yang akan kamu tanyakan?", opts: ["أَيْنَ تَسْكُنُ؟", "مَا وَظِيفَتُكَ؟", "أَيْنَ مَدْرَسَتُكَ؟"], ans: "أَيْنَ تَسْكُنُ؟" },
      { q: "Apa pertanyaan pertama yang kamu tanyakan ketika bertemu teman baru?", opts: ["مَا اسْمُكَ؟", "مَا عُنْوَانُكَ؟", "أَيْنَ تَسْكُنُ؟"], ans: "مَا اسْمُكَ؟" },
      { q: "Apa jawabanmu ketika seseorang bertanya أَيْنَ تَسْكُنُ؟", opts: ["أَسْكُنُ فِي جَاكَرْتَا.", "اِسْمِي عَلِيٌّ.", "أَنَا بِخَيْرٍ."], ans: "أَسْكُنُ فِي جَاكَرْتَا." },
      { q: "Apa jawabanmu ketika seseorang bertanya مَا وَظِيفَتُكَ؟", opts: ["أَنَا تِلْمِيذٌ.", "مَدْرَسَتِي فِي سُودِيرْمَانَ.", "عُنْوَانِي فِي جَاكَرْتَا."], ans: "أَنَا تِلْمِيذٌ." },
    ],
  },
  alwan: {
    listening: { q: "مَا لَوْنُ الْقَلَمِ؟", opts: ["أَزْرَقُ", "أَحْمَرُ", "أَسْوَدُ"], ans: "أَزْرَقُ" },
    speaking: { q: "مَا لَوْنُ قَمِيصِكَ؟", translation: "Apa warna bajumu?" },
    reading: { text: READING_CONTENT.alwan.arabic, q: "مَا لَوْنُ الدَّفْتَرِ؟", opts: ["أَخْضَرُ", "أَحْمَرُ", "أَزْرَقُ", "أَسْوَدُ"], ans: "أَحْمَرُ" },
    writing: { label: "التُّفَّاحَةُ حَمْرَاءُ", guide: "التُّفَّاحَةُ حَمْرَاءُ." },
    vocab: [
      { q: "Jika kamu ingin membeli tas berwarna hitam, bagaimana menyebutkannya?", opts: ["حَقِيبَةٌ سَوْدَاءُ", "حَقِيبَةٌ أَسْوَدُ", "قَلَمٌ أَسْوَدُ"], ans: "حَقِيبَةٌ سَوْدَاءُ" },
      { q: "Kalimat apa yang tepat untuk pulpen berwarna biru?", opts: ["قَلَمٌ أَزْرَقُ", "قَلَمٌ زَرْقَاءُ", "حَقِيبَةٌ زَرْقَاءُ"], ans: "قَلَمٌ أَزْرَقُ" },
      { q: "Jika kata benda berbentuk muannats, bentuk warna apa yang digunakan?", opts: ["Bentuk muannats", "Bentuk mudzakkar", "Keduanya selalu sama"], ans: "Bentuk muannats" },
      { q: "Bagaimana menanyakan warna sebuah benda dalam bahasa Arab?", opts: ["مَا لَوْنُهُ؟", "مَا اسْمُكَ؟", "أَيْنَ تَسْكُنُ؟"], ans: "مَا لَوْنُهُ؟" },
      { q: "Jika kamu melihat sebuah buku berwarna merah, bagaimana menyebutkannya?", opts: ["كِتَابٌ أَحْمَرُ", "كِتَابٌ حَمْرَاءُ", "حَقِيبَةٌ حَمْرَاءُ"], ans: "كِتَابٌ أَحْمَرُ" },
    ],
  },
};

function EvaluationPage({ onComplete, onSaveScore, material = "ayyam", onReward }: { onComplete: () => void; onSaveScore: (s: number) => void; material?: MaterialId; onReward?: (id: string, correct: boolean) => void }) {
  const [section, setSection] = useState<EvalSection>("listening");
  const [listeningAns, setListeningAns] = useState<string | null>(null);
  const [readingAns, setReadingAns] = useState<string | null>(null);
  const [speakingDone, setSpeakingDone] = useState(false);
  const [writingDone, setWritingDone] = useState(false);
  const [vocabAnswers, setVocabAnswers] = useState<(string | null)[]>(
    () => new Array(material === "ayyam" ? 7 : MATERIAL_EVAL[material].vocab.length).fill(null),
  );
  const [vocabIdx, setVocabIdx] = useState(0);
  const [vocabChosen, setVocabChosen] = useState<string | null>(null);
  const [writingHistory, setWritingHistory] = useState<ImageData[]>([]);
  const [drawColor] = useState("#1e293b");
  const [drawStroke] = useState(5);
  const [drawing, setDrawing] = useState(false);
  const [lastPt, setLastPt] = useState<{ x: number; y: number } | null>(null);
  const miniCanvasRef = useRef<HTMLCanvasElement>(null);
  const evalFeedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (vocabChosen || listeningAns || readingAns || speakingDone || writingDone) {
      evalFeedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [vocabChosen, listeningAns, readingAns, speakingDone, writingDone]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [vocabIdx]);

  const AYYAM_VOCAB_QS = [
    { q: "Pada hari apa upacara bendera biasanya dilaksanakan?", opts: ["Senin", "Jumat", "Minggu"], ans: "Senin" },
    { q: "Jika hari ini Sabtu, maka غَدًا adalah hari apa?", opts: ["Minggu", "Senin", "Jumat"], ans: "Minggu" },
    { q: "Bagaimana mengungkapkan 'Aku pergi ke sekolah pada hari Senin'?", opts: ["أَذْهَبُ إِلَى الْمَدْرَسَةِ فِي يَوْمِ الِاثْنَيْنِ.", "أَذْهَبُ إِلَى الْمَسْجِدِ فِي يَوْمِ الْجُمُعَةِ.", "أَسْتَرِيحُ فِي يَوْمِ السَّبْتِ."], ans: "أَذْهَبُ إِلَى الْمَدْرَسَةِ فِي يَوْمِ الِاثْنَيْنِ." },
    { q: "Jika الْآنَ hari Rabu, maka بِالْأَمْسِ hari apa?", opts: ["Selasa", "Kamis", "Senin"], ans: "Selasa" },
    { q: "Jika غَدًا hari Jumat, maka الْآنَ hari apa?", opts: ["Kamis", "Sabtu", "Rabu"], ans: "Kamis" },
    { q: "Jika hari ini Jumat, maka بَعْدَ غَدٍ hari apa?", opts: ["Minggu", "Sabtu", "Senin"], ans: "Minggu" },
    { q: "Jika أَوَّلُ الْأَمْسِ adalah hari Selasa, maka الْآنَ hari apa?", opts: ["Kamis", "Rabu", "Jumat"], ans: "Kamis" },
  ];
  const materialEval = material === "ayyam" ? null : MATERIAL_EVAL[material];
  const VOCAB_QS = materialEval?.vocab ?? AYYAM_VOCAB_QS;
  const listeningQuestion = materialEval?.listening.q ?? "مَاذَا يَفْعَلُ أَحْمَدُ يَوْمَ الِاثْنَيْنِ؟";
  const listeningOptions = materialEval?.listening.opts ?? ["يَذْهَبُ إِلَى الْمَسْجِدِ", "يَذْهَبُ إِلَى الْمَدْرَسَةِ", "يَسْتَرِيحُ فِي الْبَيْتِ", "يَقْرَأُ الْكُتُبَ"];
  const listeningCorrect = materialEval?.listening.ans ?? "يَذْهَبُ إِلَى الْمَدْرَسَةِ";
  const speakingQuestion = materialEval?.speaking.q ?? "مَاذَا تَفْعَلُ يَوْمَ الْجُمُعَةِ؟";
  const speakingTranslation = materialEval?.speaking.translation ?? "Apa yang kamu lakukan hari Jumat?";
  const writingLabel = materialEval?.writing.label ?? "Hari Jumat";
  const writingGuide = materialEval?.writing.guide ?? "يَوْمُ الْجُمُعَةِ";
  const readingText = materialEval?.reading.text ?? "أَحْمَدُ يَذْهَبُ إِلَى الْمَدْرَسَةِ فِي يَوْمِ الِاثْنَيْنِ. وَيَذْهَبُ إِلَى الْمَسْجِدِ فِي يَوْمِ الْجُمُعَةِ. وَيَسْتَرِيحُ فِي الْبَيْتِ فِي يَوْمِ السَّبْتِ.";
  const readingQuestion = materialEval?.reading.q ?? "أَحْمَدُ يَذْهَبُ إِلَى الْمَسْجِدِ فِي يَوْمِ ...؟";
  const readingOptions = materialEval?.reading.opts ?? ["الِاثْنَيْنِ", "الْأَحَدِ", "الْجُمُعَةِ", "السَّبْتِ"];
  const readingCorrect = materialEval?.reading.ans ?? "الْجُمُعَةِ";
  const includeReading = true;

  const sections: EvalSection[] = includeReading ? ["listening", "reading", "speaking", "writing", "vocab"] : ["listening", "speaking", "writing", "vocab"];
  const sectionLabels: Record<EvalSection, string> = { listening: "🎧 Istimā'", reading: "📖 Qirā'ah", speaking: "🎤 Kalām", writing: "✍️ Kitābah", vocab: "📝 Mufradāt", done: "" };
  const sectionDone: Record<EvalSection, boolean> = { listening: listeningAns !== null, reading: readingAns !== null, speaking: speakingDone, writing: writingDone, vocab: vocabAnswers[VOCAB_QS.length - 1] !== null, done: false };

  const isSectionUnlocked = (s: EvalSection) => {
    const order = sections;
    const idx = order.indexOf(s);
    if (idx <= 0) return true;
    return sectionDone[order[idx - 1]];
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [section]);

  useEffect(() => {
    if (section === "writing") {
      requestAnimationFrame(() => {
        const canvas = miniCanvasRef.current;
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width) return;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext("2d")!;
        ctx.scale(dpr, dpr);
        drawWritingGuide(ctx, rect.width, rect.height);
      });
    }
  }, [section]);

  const getMiniPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = miniCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const sx = (canvas.width / dpr) / rect.width, sy = (canvas.height / dpr) / rect.height;
    if ("touches" in e) return { x: (e.touches[0].clientX - rect.left) * sx, y: (e.touches[0].clientY - rect.top) * sy };
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  };
  const miniStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const ctx = miniCanvasRef.current?.getContext("2d");
    if (!ctx || !miniCanvasRef.current) return;
    setWritingHistory((h) => [...h.slice(-9), ctx.getImageData(0, 0, miniCanvasRef.current!.width, miniCanvasRef.current!.height)]);
    setDrawing(true); setLastPt(getMiniPos(e));
  };
  const miniDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!drawing || !lastPt) return;
    const ctx = miniCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getMiniPos(e);
    ctx.beginPath(); ctx.moveTo(lastPt.x, lastPt.y); ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = drawColor; ctx.lineWidth = drawStroke; ctx.lineCap = "round"; ctx.stroke();
    setLastPt(pos);
  };
  const miniEnd = () => { setDrawing(false); setLastPt(null); };
  const miniUndo = () => {
    if (!writingHistory.length) return;
    const ctx = miniCanvasRef.current?.getContext("2d"); if (!ctx) return;
    ctx.putImageData(writingHistory[writingHistory.length - 1], 0, 0);
    setWritingHistory((h) => h.slice(0, -1));
  };
  const miniClear = () => {
    const canvas = miniCanvasRef.current; const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    drawWritingGuide(ctx, canvas.width / dpr, canvas.height / dpr);
    setWritingHistory([]);
  };

  const handleVocabAnswer = (opt: string) => {
    if (vocabChosen) return;
    setVocabChosen(opt);
    const isCorrect = opt === VOCAB_QS[vocabIdx].ans;
    playSound(isCorrect ? "correct" : "wrong");
    onReward?.(`${material}:evaluation:vocab${vocabIdx + 1}`, isCorrect);
    const newAns = [...vocabAnswers]; newAns[vocabIdx] = opt; setVocabAnswers(newAns);
    setTimeout(() => {
      if (vocabIdx + 1 >= VOCAB_QS.length) {
        const sc = newAns.filter((a, i) => a === VOCAB_QS[i].ans).length;
        const listening = listeningAns === listeningCorrect ? 1 : 0;
        const reading = includeReading && readingAns === readingCorrect ? 1 : 0;
        const total = listening + reading + (speakingDone ? 1 : 0) + (writingDone ? 1 : 0) + sc;
        onSaveScore(total);
        setSection("done");
      } else {
        setVocabIdx((i) => i + 1); setVocabChosen(null);
      }
    }, 900);
  };

  if (section === "done") {
    const l = listeningAns === listeningCorrect ? 1 : 0;
    const r = includeReading && readingAns === readingCorrect ? 1 : 0;
    const v = vocabAnswers.filter((a, i) => a === VOCAB_QS[i].ans).length;
    const total = l + r + (speakingDone ? 1 : 0) + (writingDone ? 1 : 0) + v;
    const maxScore = 1 + (includeReading ? 1 : 0) + 1 + 1 + VOCAB_QS.length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 p-6 pt-20 pb-10">
        <GeomShapes />
        <div className="relative z-10 max-w-lg mx-auto space-y-5">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center space-y-5 bounce-in">
            <div className="text-6xl">{total >= maxScore * 0.8 ? "🏆" : total >= maxScore * 0.5 ? "⭐" : "💪"}</div>
            <h3 className="text-2xl font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>Evaluasi Selesai!</h3>
            <div className="grid grid-cols-2 gap-3">
              {([["🎧 Istimā'", listeningAns !== null, `${l}/1`], ...(includeReading ? [["📖 Qirā'ah", readingAns !== null, `${r}/1`]] : []), ["🎤 Kalām", speakingDone, speakingDone ? "✓" : "—"], ["✍️ Kitābah", writingDone, writingDone ? "✓" : "—"]] as [string, boolean, string][]).map(([label, done, sc]) => (
                <div key={label} className={`rounded-2xl p-3 border-2 text-center ${done ? "bg-green-50 border-green-300" : "bg-gray-50 border-gray-200"}`}>
                  <div className="text-sm font-bold text-gray-700" style={{ fontFamily: "Nunito, sans-serif" }}>{label}</div>
                  <div className={`text-xs font-bold mt-1 ${done ? "text-green-600" : "text-gray-400"}`}>{done ? `✓ ${sc}` : "—"}</div>
                </div>
              ))}
            </div>
            <div className="bg-violet-50 rounded-2xl p-4 border-2 border-violet-200">
              <div className="text-sm font-bold text-violet-500 font-body mb-1">📝 Mufradāt: {v}/{VOCAB_QS.length} benar</div>
              <div className="text-4xl font-black text-violet-600" style={{ fontFamily: "Nunito, sans-serif" }}>{total}/{maxScore}</div>
              <div className="text-gray-400 font-body text-sm">total poin</div>
            </div>
            <button onClick={onComplete} className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-black text-lg hover:scale-105 active:scale-95 transition-all" style={{ fontFamily: "Nunito, sans-serif" }}>
              💭 Lanjut ke Refleksi!
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 p-6 pt-20 pb-10">
      <GeomShapes />
      <div className="relative z-10 max-w-lg mx-auto space-y-4">
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-3xl p-5 text-white text-center">
          <div className="text-3xl mb-1">📝</div>
          <h2 className="text-2xl font-black" style={{ fontFamily: "Nunito, sans-serif" }}>Evaluasi — 4 Maharah</h2>
          <p className="text-violet-100 font-body text-sm">Uji keempat keterampilan bahasamu!</p>
        </div>

        {/* Sequential section tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {sections.map((s) => {
            const unlocked = isSectionUnlocked(s);
            const done = sectionDone[s];
            return (
              <button key={s} onClick={() => { if (unlocked) setSection(s); }} disabled={!unlocked}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all ${s === section ? "bg-violet-500 text-white shadow-md" : done ? "bg-green-100 text-green-700 border-2 border-green-300" : unlocked ? "bg-white text-gray-500 border-2 border-gray-200 hover:border-violet-300" : "bg-gray-100 text-gray-300 border-2 border-gray-200 cursor-not-allowed"}`}
                style={{ fontFamily: "Nunito, sans-serif" }}>
                {done ? "✓ " : !unlocked ? "🔒 " : ""}{sectionLabels[s]}
              </button>
            );
          })}
        </div>

        {section === "listening" && (
          <div className="space-y-4 pop-in">
            <div className="bg-cyan-50 rounded-2xl border-2 border-cyan-200 p-4">
              <p className="text-sm font-bold text-cyan-600 font-body mb-2">🎧 Istimā' — Dengarkan dan jawab:</p>
              <AudioPlayer label={listeningQuestion} duration={5} src={material === "ayyam" ? evaluasiIstimaAyyamAudioUrl : material === "alwan" ? evaluasiIstimaAlwanAudioUrl : evaluasiIstimaAudioUrl}/>
            </div>
            <p className="font-black text-gray-700 text-center" style={{ fontFamily: "'Noto Naskh Arabic', Arial, serif", fontSize: "1.2rem" }} dir="rtl">{listeningQuestion}</p>
            <div className="space-y-2">
              {listeningOptions.map((opt) => (
                <button key={opt} onClick={() => { if (!listeningAns) { const correct = opt === listeningCorrect; playSound(correct ? "correct" : "wrong"); onReward?.(`${material}:evaluation:listening`, correct); setListeningAns(opt); setTimeout(() => setSection(includeReading ? "reading" : "speaking"), 800); } }}
                  disabled={!!listeningAns}
                  className={`w-full py-3 px-4 rounded-2xl border-2 font-body text-right transition-all ${!listeningAns ? "bg-white border-gray-200 text-gray-700 hover:border-cyan-400" : opt === listeningCorrect ? "bg-green-100 border-green-400 text-green-700" : listeningAns === opt ? "bg-red-100 border-red-400 text-red-600" : "bg-gray-50 border-gray-200 text-gray-300 opacity-50"}`}
                  dir="rtl" style={{ fontFamily: "'Noto Naskh Arabic', Arial, serif" }}>
                  {opt}
                </button>
              ))}
            </div>
            {listeningAns && <div ref={evalFeedbackRef} className={`rounded-xl p-3 text-center font-bold font-body pop-in ${listeningAns === listeningCorrect ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{listeningAns === listeningCorrect ? "🎉 Benar!" : <>💡 Benar: <ArabicText>{listeningCorrect}</ArabicText></>}</div>}
          </div>
        )}

        {section === "reading" && (
          <div className="space-y-4 pop-in">
            <div className="bg-emerald-50 rounded-2xl border-2 border-emerald-200 p-4">
              <p className="text-xs font-bold text-emerald-600 font-body mb-2">📖 Qirā'ah — Baca dan jawab:</p>
              <div className="text-right space-y-1" dir="rtl"><p className="text-sm text-gray-700 leading-loose" style={{ fontFamily: "'Noto Naskh Arabic', Arial, serif" }}>{readingText}</p></div>
            </div>
            <p className="font-bold text-gray-700 text-center font-body" dir="rtl" style={{ fontFamily: "'Noto Naskh Arabic', Arial, serif" }}>{readingQuestion}</p>
            <div className="grid grid-cols-2 gap-3">
              {readingOptions.map((opt) => (
                <button key={opt} onClick={() => { if (!readingAns) { const correct = opt === readingCorrect; playSound(correct ? "correct" : "wrong"); onReward?.(`${material}:evaluation:reading`, correct); setReadingAns(opt); setTimeout(() => setSection("speaking"), 800); } }}
                  disabled={!!readingAns}
                  className={`py-4 rounded-2xl border-2 font-black text-xl transition-all ${!readingAns ? "bg-white border-gray-200 hover:border-emerald-400" : opt === readingCorrect ? "bg-green-100 border-green-400 text-green-700" : readingAns === opt ? "bg-red-100 border-red-400 text-red-600" : "bg-gray-50 border-gray-200 text-gray-300 opacity-50"}`}
                  style={{ fontFamily: "'Noto Naskh Arabic', Arial, serif" }}>
                  {opt}
                </button>
              ))}
            </div>
            {readingAns && <div ref={evalFeedbackRef} className={`rounded-xl p-3 text-center font-bold font-body pop-in ${readingAns === readingCorrect ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{readingAns === readingCorrect ? "🎉 Benar!" : <>💡 Benar: <ArabicText>{readingCorrect}</ArabicText></>}</div>}
          </div>
        )}

        {section === "speaking" && (
          <div className="space-y-4 pop-in">
            <div className="bg-rose-50 rounded-2xl border-2 border-rose-200 p-4 text-center">
              <p className="text-xs font-bold text-rose-600 font-body mb-2">🎤 Kalām — Rekam jawabanmu:</p>
              <ArabicText className="block text-2xl font-black text-gray-700">{speakingQuestion}</ArabicText>
              <p className="text-gray-400 font-body text-xs mt-1">{speakingTranslation}</p>
            </div>
            {!speakingDone
              ? <MicRecorder onSubmit={() => { onReward?.(`${material}:evaluation:speaking`, false); setSpeakingDone(true); setTimeout(() => setSection("writing"), 600); }} submitLabel="✓ Kirim Jawaban" />
              : <div ref={evalFeedbackRef} className="bg-green-100 rounded-2xl p-4 text-center font-bold text-green-700 font-body pop-in">Rekaman kalām selesai!</div>}
          </div>
        )}

        {section === "writing" && (
          <div className="space-y-4 pop-in">
            <div className="bg-indigo-50 rounded-2xl border-2 border-indigo-200 p-4 text-center">
              <p className="text-xs font-bold text-indigo-600 font-body mb-1">✍️ Kitābah — Tulis kata Arab:</p>
              <div className="text-2xl font-black text-indigo-700" style={{ fontFamily: material === "ayyam" ? "Nunito, sans-serif" : "'Noto Naskh Arabic', Arial, serif" }}>{writingLabel}</div>
              <p className="text-xs text-indigo-400 font-body">Tulis dalam Bahasa Arab di kanvas!</p>
            </div>
            <div className="flex gap-2">
              <button onClick={miniUndo} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs">↩ Undo</button>
              <button onClick={miniClear} className="px-3 py-2 rounded-xl bg-red-100 text-red-600 font-bold text-xs">🗑 Hapus</button>
            </div>
            <div className="relative bg-white rounded-2xl shadow-lg border-2 border-indigo-200 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.12]">
                <ArabicText className="font-black" style={{ fontSize: "clamp(36px, 10vw, 60px)" }}>{writingGuide}</ArabicText>
              </div>
              <canvas ref={miniCanvasRef} className="relative z-10 w-full touch-none block" style={{ height: 200, cursor: "crosshair" }}
                onMouseDown={miniStart} onMouseMove={miniDraw} onMouseUp={miniEnd} onMouseLeave={miniEnd}
                onTouchStart={miniStart} onTouchMove={miniDraw} onTouchEnd={miniEnd} />
            </div>
            {!writingDone
              ? <button onClick={() => { onReward?.(`${material}:evaluation:writing`, false); setWritingDone(true); setTimeout(() => setSection("vocab"), 400); }} className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-lg hover:scale-105 active:scale-95 transition-all" style={{ fontFamily: "Nunito, sans-serif" }}>📤 Kirim Tulisan</button>
              : <div ref={evalFeedbackRef} className="bg-green-100 rounded-2xl p-4 text-center font-bold text-green-700 font-body pop-in">Kitābah selesai!</div>}
          </div>
        )}

        {section === "vocab" && (
          <div className="space-y-4 pop-in">
            <div className="bg-purple-50 rounded-2xl border-2 border-purple-200 p-3 text-center">
              <p className="text-xs font-bold text-purple-600 font-body">📝 Mufradāt — Soal {vocabIdx + 1}/{VOCAB_QS.length}</p>
            </div>
            <div className="bg-white rounded-3xl shadow-lg border-2 border-purple-200 p-5 text-center" key={vocabIdx}>
              <p className="font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>{VOCAB_QS[vocabIdx].q}</p>
            </div>
            <div className="space-y-2">
              {VOCAB_QS[vocabIdx].opts.map((opt) => {
                const isC = opt === VOCAB_QS[vocabIdx].ans; const isSel = vocabChosen === opt; const isAr = /[؀-ۿ]/.test(opt);
                return (
                  <button key={opt} onClick={() => handleVocabAnswer(opt)} disabled={!!vocabChosen}
                    dir={isAr ? "rtl" : "ltr"}
                    className={`w-full py-3 px-4 rounded-2xl border-2 font-bold font-body text-left transition-all ${!vocabChosen ? "bg-white border-gray-200 text-gray-700 hover:border-purple-400 active:scale-95" : isC ? "bg-green-100 border-green-400 text-green-700" : isSel ? "bg-red-100 border-red-400 text-red-600" : "bg-gray-50 border-gray-200 text-gray-300 opacity-50"}`}
                    style={isAr ? { fontFamily: "'Noto Naskh Arabic', Arial, serif" } : {}}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {vocabChosen && <div ref={evalFeedbackRef} className={`rounded-xl p-3 text-center font-bold font-body pop-in ${vocabChosen === VOCAB_QS[vocabIdx].ans ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{vocabChosen === VOCAB_QS[vocabIdx].ans ? "🎉 Benar!" : `💡 Benar: ${VOCAB_QS[vocabIdx].ans}`}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// REFLECTION — Expanded with 4-skill self-assessment
// ────────────────────────────────────────────────────────────────
const REFLECT_QS = [
  { key: "learned" as const, q: "Apa yang kamu pelajari hari ini?", arabic: "مَاذَا تَعَلَّمْتَ الْيَوْمَ؟", emoji: "📚", opts: ["Nama-nama hari dalam Arab", "Cara mengucapkan hari", "Cara menulis hari dalam Arab", "Semua di atas! 🌟"] },
  { key: "remembered" as const, q: "Kosakata apa yang paling kamu ingat?", arabic: "مَا الْكَلِمَةُ الَّتِي تَتَذَكَّرُهَا أَكْثَرَ؟", emoji: "💡", opts: ["الْجُمُعَةُ (Jumat)", "الإِثْنَيْنِ (Senin)", "السَّبْتُ (Sabtu)", "الْأَحَدُ (Minggu)"] },
  { key: "liked" as const, q: "Aktivitas mana yang paling kamu sukai?", arabic: "أَيُّ نَشَاطٍ أَعْجَبَكَ أَكْثَرَ؟", emoji: "❤️", opts: ["📖 Belajar kosakata", "🎮 Mini game", "✍️ Menulis Arab", "🎧 Mendengarkan"] },
  { key: "difficult" as const, q: "Apa yang masih sulit untuk kamu pahami?", arabic: "مَا الَّذِي لَا يَزَالُ صَعْبًا عَلَيْكَ؟", emoji: "🤔", opts: ["Cara mengucapkan kata", "Cara menulis huruf Arab", "Memahami yang didengar", "Semuanya sudah mudah! 😊"] },
  { key: "feeling" as const, q: "Bagaimana perasaanmu setelah belajar hari ini?", arabic: "كَيْفَ تَشْعُرُ الْآنَ؟", emoji: "😊", opts: ["😄 Sangat senang!", "🙂 Cukup menyenangkan", "😐 Biasa saja", "🤩 Bersemangat belajar lagi!"] },
];

const TAARUF_REFLECT_QS = [
  { key: "learned" as const, q: "Apa yang kamu pelajari hari ini?", arabic: "مَاذَا تَعَلَّمْتَ الْيَوْمَ؟", emoji: "📚", opts: ["Ungkapan perkenalan", "Cara menanyakan identitas", "Semua di atas! 🌟"] },
  { key: "remembered" as const, q: "Kosakata apa yang paling kamu ingat?", arabic: "مَا الْكَلِمَةُ الَّتِي تَتَذَكَّرُهَا أَكْثَرَ؟", emoji: "💡", opts: ["مَا اسْمُكَ؟", "كَيْفَ حَالُكَ؟", "أَيْنَ تَسْكُنُ؟", "مَا عُنْوَانُكَ؟"] },
  ...REFLECT_QS.slice(2),
];

const ALWAN_REFLECT_QS = [
  { key: "learned" as const, q: "Apa yang kamu pelajari hari ini?", arabic: "مَاذَا تَعَلَّمْتَ الْيَوْمَ؟", emoji: "📚", opts: ["Nama-nama warna dalam Arab", "Warna benda sehari-hari", "Semua di atas! 🌟"] },
  { key: "remembered" as const, q: "Kosakata apa yang paling kamu ingat?", arabic: "مَا الْكَلِمَةُ الَّتِي تَتَذَكَّرُهَا أَكْثَرَ؟", emoji: "💡", opts: ["أَبْيَضُ (Putih)", "أَسْوَدُ (Hitam)", "أَحْمَرُ (Merah)", "أَزْرَقُ (Biru)"] },
  ...REFLECT_QS.slice(2),
];

const SKILL_QS = [
  { key: "skillReading" as const, q: "Apakah kamu sudah bisa membaca kata-kata Arab?", arabic: "هَلْ تَسْتَطِيعُ قِرَاءَةَ الْكَلِمَاتِ الْعَرَبِيَّةِ؟", emoji: "📖" },
  { key: "skillListening" as const, q: "Apakah kamu bisa memahami bahasa Arab yang kamu dengar?", arabic: "هَلْ تَسْتَطِيعُ فَهْمَ الْكَلَامِ الْمَسْمُوعِ؟", emoji: "🎧" },
  { key: "skillSpeaking" as const, q: "Apakah kamu sudah bisa berbicara menggunakan bahasa Arab?", arabic: "هَلْ تَسْتَطِيعُ التَّحَدُّثَ بِاللُّغَةِ الْعَرَبِيَّةِ؟", emoji: "🎤" },
  { key: "skillWriting" as const, q: "Apakah kamu sudah bisa menulis kata-kata Arab?", arabic: "هَلْ تَسْتَطِيعُ كِتَابَةَ الْكَلِمَاتِ الْعَرَبِيَّةِ؟", emoji: "✍️" },

];

const SKILL_OPTS = [
  { label: "Sudah bisa!", color: "bg-green-100 border-green-400 text-green-700" },
  { label: "Hampir bisa", color: "bg-yellow-100 border-yellow-400 text-yellow-700" },
  { label: "Belum bisa", color: "bg-red-100 border-red-400 text-red-600" },
];

function ReflectionPage({ onComplete, mindfulData, onSave, questions = REFLECT_QS, rewardPrefix, onReward }: { onComplete: () => void; mindfulData: MindfulData; onSave: (d: ReflectionData) => void; questions?: typeof REFLECT_QS; rewardPrefix?: string; onReward?: (id: string, correct: boolean) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<ReflectionData>>({});
  const totalSteps = questions.length + SKILL_QS.length;
  const isSkillPhase = step >= questions.length;
  const skillIdx = step - questions.length;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [step]);

  const handleSelect = (opt: string) => {
    if (rewardPrefix) onReward?.(`${rewardPrefix}:q${step + 1}`, false);
    const key = isSkillPhase ? SKILL_QS[skillIdx].key : questions[step].key;
    const newAns = { ...answers, [key]: opt } as ReflectionData;
    setAnswers(newAns);
    setTimeout(() => {
      if (step + 1 >= totalSteps) { onSave(newAns); onComplete(); }
      else setStep((s) => s + 1);
    }, 500);
  };

  const currentQ = isSkillPhase ? SKILL_QS[skillIdx] : questions[step];
  const currentKey = currentQ.key;
  const currentOpts = isSkillPhase ? SKILL_OPTS.map((o) => o.label) : questions[step].opts;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-rose-50 p-6 pt-28">
      <GeomShapes />
      <div className="relative z-10 max-w-lg mx-auto space-y-5">
        <div className="bg-gradient-to-r from-amber-500 to-rose-500 rounded-3xl p-5 text-white text-center">
          <div className="text-3xl mb-1">💭</div>
          <h2 className="text-2xl font-black" style={{ fontFamily: "Nunito, sans-serif" }}>Refleksi</h2>
          <p className="text-amber-100 font-body text-sm">Renungkan pengalaman belajarmu hari ini</p>
        </div>

        {step === 0 && mindfulData.experience && (
          <div className="bg-white rounded-2xl border-2 border-amber-200 p-4 pop-in">
            <p className="text-xs font-bold text-amber-600 mb-1 font-body">💾 Jawaban Mindful Learning-mu tadi:</p>
            <p className="text-gray-600 font-body text-sm">{mindfulData.experience === "yes" ? `Kamu bilang pernah belajar. Ingatan: "${mindfulData.memory}"` : `Kamu belum pernah belajar. Dugaanmu: "${mindfulData.guess}"`}</p>
            <p className="text-amber-500 text-xs font-bold mt-2">Sekarang bandingkan dengan yang sudah kamu pelajari! 🔍</p>
          </div>
        )}

        {isSkillPhase && step === questions.length && (
          <div className="bg-purple-50 rounded-2xl border-2 border-purple-200 p-4 pop-in">
            <p className="text-xs font-bold text-purple-600 font-body">📊 Penilaian Diri — 4 Maharah Bahasa Arab</p>
            <p className="text-gray-500 font-body text-xs mt-1">Nilai kemampuanmu sendiri setelah belajar hari ini!</p>
          </div>
        )}

        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all min-w-[8px] ${i < step ? "bg-amber-400" : i === step ? "bg-rose-500 scale-y-150" : "bg-gray-200"}`} />
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-xl border-2 border-amber-100 p-6 text-center" key={step}>
          <div className="text-4xl mb-3">{currentQ.emoji}</div>
          {isSkillPhase && (
            <ArabicText className="block text-sm text-amber-500 mb-2">{(currentQ as typeof SKILL_QS[0]).arabic}</ArabicText>
          )}
          {!isSkillPhase && (
            <ArabicText className="block text-sm text-amber-400 mb-1">{(currentQ as typeof questions[0]).arabic}</ArabicText>
          )}
          <p className="text-lg font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>{currentQ.q}</p>
        </div>

        <div className={`${isSkillPhase ? "grid grid-cols-1 gap-3" : "space-y-3"}`}>
          {currentOpts.map((opt) => {
            const skillStyle = isSkillPhase ? SKILL_OPTS.find((o) => o.label === opt)?.color : "";
            return (
              <button key={opt} onClick={() => handleSelect(opt)}
                className={`w-full py-4 px-5 rounded-2xl border-2 font-bold font-body text-left transition-all ${answers[currentKey as keyof ReflectionData] === opt ? (isSkillPhase ? skillStyle + " scale-102" : "bg-amber-100 border-amber-400 text-amber-800") : isSkillPhase ? "bg-white border-gray-200 text-gray-700 hover:border-amber-400" : "bg-white border-gray-200 text-gray-700 hover:border-amber-400 active:scale-95"}`}>
                {opt}
              </button>
            );
          })}
        </div>

        <p className="text-center text-gray-400 font-body text-xs">Pertanyaan {step + 1} dari {totalSteps}</p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// RESULT PAGE — with 4-Maharah tracker
// ────────────────────────────────────────────────────────────────
function ResultPage({ gameScore, evalScore, reflectionData, mindfulData, maharah, profile, onRestart, onMaterials, materialArabic = "الْأَيَّامُ", materialName = "Hari-hari dalam Seminggu", gameMax = 12, evalMax = 11, exp = 0 }: {
  gameScore: number; evalScore: number; reflectionData: ReflectionData | null; mindfulData: MindfulData;
  maharah: MaharahProgress; profile: StudentProfile | null; onRestart: () => void; onMaterials: () => void;
  materialArabic?: string; materialName?: string; gameMax?: number; evalMax?: number; exp?: number;
}) {
  const GAME_MAX = gameMax;
  const EVAL_MAX = evalMax;
  const total = Math.round(((gameScore / GAME_MAX + evalScore / EVAL_MAX) / 2) * 100);
  const badge = total >= 75 ? { emoji: "🏆", msg: "Luar biasa! Kamu bintang hari ini!", color: "from-yellow-400 to-orange-500" }
    : total >= 50 ? { emoji: "🌟", msg: "Bagus sekali! Kamu sudah belajar dengan baik!", color: "from-cyan-500 to-blue-500" }
    : { emoji: "💪", msg: "Semangat! Setiap usaha membawamu lebih maju!", color: "from-green-500 to-teal-500" };
  const materialActivityName = materialArabic === "التَّعَارُفُ" ? "Materi Ta'aruf + Konteks Nyata" : materialArabic === "الْأَلْوَانُ" ? "Materi Al-Alwan + Konteks Nyata" : "Materi Al-Ayyam + Konteks Nyata";

  const maharahData = [
    { skill: "الِاسْتِمَاعُ", name: "Istimā'", sub: "Mendengar", icon: "🎧", done: maharah.listening, skillKey: "skillListening" as keyof ReflectionData },
    { skill: "الْكَلَامُ", name: "Kalām", sub: "Berbicara", icon: "🎤", done: maharah.speaking, skillKey: "skillSpeaking" as keyof ReflectionData },
    { skill: "الْقِرَاءَةُ", name: "Qirā'ah", sub: "Membaca", icon: "📖", done: maharah.reading, skillKey: "skillReading" as keyof ReflectionData },
    { skill: "الْكِتَابَةُ", name: "Kitābah", sub: "Menulis", icon: "✍️", done: maharah.writing, skillKey: "skillWriting" as keyof ReflectionData },
  ];

  const selfScore = (key: keyof ReflectionData) => {
    const val = reflectionData?.[key];
    if (!val) return null;
    if (String(val).includes("Sudah")) return { label: "Sudah bisa!", color: "text-green-600" };
    if (String(val).includes("Hampir")) return { label: "Hampir bisa 🟡", color: "text-yellow-600" };
    return { label: "Belum bisa", color: "text-red-500" };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-rose-50 p-6 pt-20 pb-12">
      <GeomShapes />
      <div className="relative z-10 max-w-lg mx-auto space-y-5">
        {profile && (
          <div className="bg-white rounded-3xl shadow-lg border-2 border-yellow-200 p-5 text-center bounce-in">
            <div className="text-6xl mb-2">{profile.avatar}</div>
            <h2 className="text-2xl font-black text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>Hebat, {profile.name}! 🎉</h2>
            <p className="text-gray-500 font-body text-sm mt-1">Kelas {profile.kelas}</p>
            <p className="inline-block mt-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-black">Level {Math.min(10, Math.floor(exp / 100) + 1)} · {exp} EXP</p>
            <p className="text-gray-600 font-body text-sm mt-2">Kamu sudah menyelesaikan pembelajaran Bahasa Arab tentang <span className="font-bold" style={{ fontFamily: "'Noto Naskh Arabic', Arial, serif" }}>{materialArabic}</span> ({materialName}).</p>
          </div>
        )}
        <div className={`bg-gradient-to-r ${badge.color} rounded-3xl p-6 text-center text-white bounce-in`}>
          <div className="text-6xl mb-3">{badge.emoji}</div>
          <h2 className="text-3xl font-black" style={{ fontFamily: "Nunito, sans-serif" }}>Hasil Belajar</h2>
          <p className="text-white/80 font-body mt-2">{badge.msg}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[{ label: "Skor Game", val: `${gameScore}/${GAME_MAX}`, color: "border-pink-200 text-pink-600" }, { label: "Evaluasi", val: `${evalScore}/${EVAL_MAX}`, color: "border-purple-200 text-purple-600" }, { label: "Total", val: `${Math.min(100, total)}%`, color: "border-orange-200 text-orange-600" }].map(({ label, val, color }) => (
            <div key={label} className={`bg-white rounded-2xl border-2 ${color} p-4 text-center`}>
              <div className="text-2xl font-black" style={{ fontFamily: "Nunito, sans-serif" }}>{val}</div>
              <div className="text-xs text-gray-400 font-body mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* 4-Maharah Progress Tracker */}
        <div className="bg-white rounded-3xl shadow-lg border-2 border-purple-200 p-5">
          <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2" style={{ fontFamily: "Nunito, sans-serif" }}>
            📊 الْمَهَارَاتُ اللُّغَوِيَّةُ الْأَرْبَعُ
            <span className="text-sm text-gray-400 font-normal">4 Maharah Bahasa</span>
          </h3>
          <div className="space-y-3">
            {maharahData.map((m) => {
              const self = selfScore(m.skillKey);
              return (
                <div key={m.name} className={`rounded-2xl p-3 border-2 ${m.done ? "bg-green-50 border-green-300" : "bg-gray-50 border-gray-200"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{m.icon}</span>
                      <div>
                        <ArabicText className="block text-sm font-black text-gray-700">{m.skill}</ArabicText>
                        <div className="text-xs text-gray-500 font-body">{m.name} — {m.sub}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {m.done ? (
                        <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">—</div>
                      )}
                    </div>
                  </div>
                  {self && (
                    <div className={`text-xs font-bold mt-1.5 font-body ${self.color}`}>Penilaian diri: {self.label}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Activities */}
        <div className="bg-white rounded-3xl shadow-lg border-2 border-yellow-200 p-5">
          <h3 className="font-black text-gray-800 mb-3" style={{ fontFamily: "Nunito, sans-serif" }}>Aktivitas Selesai</h3>
          <div className="space-y-1">
            {[
              { name: "Mindful Learning", icon: "🧠" },
              { name: materialActivityName, icon: "📖" },
              { name: "Istimā'", icon: "🎧" },
              { name: "Qirā'ah", icon: "📕" },
              { name: "Kalām", icon: "🎤" },
              { name: "Kitābah", icon: "✍️" },
              { name: "Mini Games", icon: "🎮", score: `${gameScore}/${GAME_MAX}` },
              { name: "Evaluasi", icon: "📝", score: `${evalScore}/${EVAL_MAX}` },
              { name: "Refleksi", icon: "💭" },
            ].map((act) => (
              <div key={act.name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span>{act.icon}</span>
                  <span className="font-body text-sm text-gray-700">{act.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {act.score && <span className="text-xs font-bold text-gray-400">{act.score}</span>}
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {reflectionData && (
          <div className="bg-white rounded-3xl shadow-lg border-2 border-rose-200 p-5">
            <h3 className="font-black text-gray-800 mb-3" style={{ fontFamily: "Nunito, sans-serif" }}>💭 Refleksimu</h3>
            <div className="space-y-2">
              {[["Perasaan", reflectionData.feeling], ["Paling suka", reflectionData.liked], ["Kosakata ingat", reflectionData.remembered], ["Masih sulit", reflectionData.difficult]].map(([label, val]) => (
                <div key={String(label)} className="text-sm font-body text-gray-600">
                  <span className="font-bold text-rose-500">{String(label)}: </span>{String(val)}
                </div>
              ))}
            </div>
          </div>
        )}

        {mindfulData.experience && (
          <div className="bg-indigo-50 rounded-2xl border-2 border-indigo-200 p-4">
            <p className="text-xs font-bold text-indigo-600 font-body">🔍 Perbandingan Mindful Learning:</p>
            <p className="text-gray-600 font-body text-sm mt-1">
              <span className="font-bold">Sebelum: </span>{mindfulData.experience === "yes" ? `Ingatan awal — "${mindfulData.memory}"` : `Belum pernah, dugaan: "${mindfulData.guess}"`}
            </p>
            <p className="text-gray-600 font-body text-sm mt-0.5">
              <span className="font-bold">Sesudah: </span>{materialArabic === "الْأَيَّامُ" ? "Kamu sudah mengenal 7 hari dalam Bahasa Arab + 4 keterampilan bahasa!" : `Kamu sudah menyelesaikan materi ${materialName} dan melatih 4 keterampilan bahasa!`} 🎉
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={onRestart} className="w-full py-5 rounded-3xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-lg font-black shadow-xl hover:scale-105 active:scale-95 transition-all" style={{ fontFamily: "Nunito, sans-serif" }}>🏠 Kembali ke Beranda</button>
          <button onClick={onMaterials} className="w-full py-5 rounded-3xl bg-white border-2 border-cyan-300 text-cyan-700 text-lg font-black shadow-lg hover:scale-105 active:scale-95 transition-all" style={{ fontFamily: "Nunito, sans-serif" }}>📚 Pilih Materi Lain</button>
        </div>
        <p className="text-center text-gray-400 text-xs font-body">Materi lebih banyak akan segera hadir! 🌟</p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// MAIN APP
// ────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [studentStorage, setStudentStorage] = useState<StudentStorage>(() => loadStudentStorage());
  const [material, setMaterial] = useState<MaterialId>("taaruf");
  const [mindfulAnswer, setMindfulAnswer] = useState<MindfulAnswer | null>(null);
  const [ayyamMindful, setAyyamMindful] = useState<MindfulData>({ experience: null });
  const [gameScore, setGameScore] = useState(0);
  const [evalScore, setEvalScore] = useState(0);
  const [ayyamReflection, setAyyamReflection] = useState<ReflectionData | null>(null);
  const [materialReflection, setMaterialReflection] = useState<ReflectionData | null>(null);
  const [maharah, setMaharah] = useState<MaharahProgress>({ listening: false, speaking: false, reading: false, writing: false });
  const [expToast, setExpToast] = useState<number | null>(null);
  const activeStudent = studentStorage.activeId ? studentStorage.students[studentStorage.activeId] : null;
  const profile = activeStudent?.profile ?? null;
  const progress = activeStudent?.progress ?? cloneEmptyProgress();

  const resetSession = () => {
    setPage("home");
    setMaterial("taaruf");
    setMindfulAnswer(null);
    setAyyamMindful({ experience: null });
    setGameScore(0);
    setEvalScore(0);
    setAyyamReflection(null);
    setMaterialReflection(null);
    setMaharah({ listening: false, speaking: false, reading: false, writing: false });
  };

  const saveProfile = (nextProfile: StudentProfile) => {
    const id = `${nextProfile.name.trim().toLocaleLowerCase("id-ID")}|${nextProfile.kelas}`;
    setStudentStorage((current) => ({
      activeId: id,
      students: {
        ...current.students,
        [id]: {
          profile: nextProfile,
          progress: current.students[id]?.progress ?? cloneEmptyProgress(),
          exp: current.students[id]?.exp ?? 0,
          awarded: current.students[id]?.awarded ?? {},
        },
      },
    }));
    setPage("home");
  };

  const startNewProfile = () => {
    setStudentStorage((current) => ({ ...current, activeId: null }));
    setPage("profile");
  };

  const selectMaterial = (selected: MaterialId) => {
    setMaterial(selected);
    setMindfulAnswer(null);
    setAyyamMindful({ experience: null });
    setGameScore(0);
    setEvalScore(0);
    setAyyamReflection(null);
    setMaterialReflection(null);
    setMaharah({ listening: false, speaking: false, reading: false, writing: false });
    setStudentStorage((current) => {
      if (!current.activeId || !current.students[current.activeId]) return current;
      const student = current.students[current.activeId];
      return {
        ...current,
        students: {
          ...current.students,
          [current.activeId]: {
            ...student,
            progress: {
              ...student.progress,
              [selected]: { ...student.progress[selected], status: "Sedang dikerjakan" },
            },
          },
        },
      };
    });
    setPage("mindful");
  };

  const completeMaterial = () => {
    setStudentStorage((current) => {
      if (!current.activeId || !current.students[current.activeId]) return current;
      const student = current.students[current.activeId];
      const previous = student.progress[material];
      return {
        ...current,
        students: {
          ...current.students,
          [current.activeId]: {
            ...student,
            progress: {
              ...student.progress,
              [material]: {
                ...previous,
                status: "Selesai",
                latestScore: evalScore,
                maxScore: material === "ayyam" ? 11 : 9,
                attempts: previous.attempts + 1,
                completedAt: new Date().toISOString(),
              },
            },
          },
        },
      };
    });
    setPage("result");
  };

  const saveEvaluationScore = (score: number) => {
    setEvalScore(score);
    setStudentStorage((current) => {
      if (!current.activeId || !current.students[current.activeId]) return current;
      const student = current.students[current.activeId];
      return {
        ...current,
        students: {
          ...current.students,
          [current.activeId]: {
            ...student,
            progress: {
              ...student.progress,
              [material]: {
                ...student.progress[material],
                latestScore: score,
                maxScore: material === "ayyam" ? 11 : 9,
              },
            },
          },
        },
      };
    });
  };

  const awardExp = (id: string, correct: boolean) => {
    setStudentStorage((current) => {
      if (!current.activeId || !current.students[current.activeId]) return current;
      const student = current.students[current.activeId];
      if (student.awarded[id]) return current;
      const amount = 10 + (correct ? 5 : 0);
      setExpToast(amount);
      return {
        ...current,
        students: {
          ...current.students,
          [current.activeId]: {
            ...student,
            exp: Math.min(1000, student.exp + amount),
            awarded: { ...student.awarded, [id]: true },
          },
        },
      };
    });
  };

  useEffect(() => {
    if (expToast === null) return;
    const timer = window.setTimeout(() => setExpToast(null), 1300);
    return () => window.clearTimeout(timer);
  }, [expToast]);

  useEffect(() => {
    try {
      localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(studentStorage));
    } catch {
      // Keep the in-memory session usable if browser storage is unavailable.
    }
  }, [studentStorage]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [page]);

  return (
    <div className="min-h-screen bg-amber-50">
      <NavBar page={page} materialTitle={getMaterialMeta(material).arabic} onHome={() => setPage("home")} onMaterials={() => setPage("materials")} />
      <StepBar page={page} />

      {page === "home" && (profile ? <StudentWelcomePage profile={profile} progress={progress} exp={activeStudent?.exp ?? 0} awarded={activeStudent?.awarded ?? {}} onStart={() => setPage("materials")} onNewProfile={startNewProfile} /> : <HomePage onStart={() => setPage("profile")} onNav={(p) => setPage(p)} />)}
      {page === "about" && <AboutPage onBack={() => setPage("home")} />}
      {page === "info" && <InfoPage onBack={() => setPage("home")} />}
      {page === "profile" && <StudentProfilePage onComplete={saveProfile} />}
      {page === "welcome" && profile && <StudentWelcomePage profile={profile} progress={progress} exp={activeStudent?.exp ?? 0} awarded={activeStudent?.awarded ?? {}} onStart={() => setPage("materials")} onNewProfile={startNewProfile} />}
      {page === "materials" && <MaterialsPage onSelect={selectMaterial} />}
      {page === "mindful" && (material === "ayyam"
        ? <MindfulPage onSave={setAyyamMindful} onComplete={() => { awardExp("ayyam:mindful", false); setPage("meaningful"); }} />
        : <MindfulMaterialPage material={material} onSave={setMindfulAnswer} onComplete={() => { awardExp(`${material}:mindful`, false); setPage("meaningful"); }} />)}
      {page === "meaningful" && (material === "ayyam"
        ? <MeaningfulPage onComplete={() => { awardExp("ayyam:material", false); setPage("listening"); }} />
        : <MeaningfulMaterialPage material={material} onComplete={() => { awardExp(`${material}:material`, false); setPage("listening"); }} />)}
      {page === "listening" && (material === "ayyam"
        ? <ListeningPage rewardPrefix="ayyam:listening" onReward={awardExp} audioSrc={istimaAyyamAudioUrl} onComplete={() => { setMaharah((m) => ({ ...m, listening: true })); setPage("reading"); }} />
        : <ListeningPage rewardPrefix={`${material}:listening`} onReward={awardExp} dialogue={material === "taaruf" ? TAARUF_DIALOGUE : ALWAN_DIALOGUE} questions={material === "taaruf" ? TAARUF_LISTENING_QS : ALWAN_LISTENING_QS} illustration={<PendingIllustration label={material === "taaruf" ? "Ilustrasi percakapan Ta'aruf" : "Ilustrasi percakapan warna"} src={material === "taaruf" ? istimaTaarufIllustration : istimaAlwanIllustration} />} audioSrc={material === "taaruf" ? istimaAudioUrl : istimaAlwanAudioUrl} audioFirst={material === "alwan"} onComplete={() => { setMaharah((m) => ({ ...m, listening: true })); setPage("reading"); }} />)}
      {page === "reading" && <ReadingPage material={material} onReward={awardExp} onComplete={() => { setMaharah((m) => ({ ...m, reading: true })); setPage("speaking"); }} />}
      {page === "speaking" && (material === "ayyam"
        ? <SpeakingPage rewardPrefix="ayyam:speaking" onReward={awardExp} levels={AYYAM_SPEAKING_LEVELS} onComplete={() => { setMaharah((m) => ({ ...m, speaking: true })); setPage("writing"); }} />
        : <SpeakingPage rewardPrefix={`${material}:speaking`} onReward={awardExp} scrollOnResult levels={material === "taaruf" ? TAARUF_SPEAKING_LEVELS : ALWAN_SPEAKING_LEVELS} onComplete={() => { setMaharah((m) => ({ ...m, speaking: true })); setPage("writing"); }} />)}
      {page === "writing" && (material === "ayyam"
        ? <WritingPage rewardPrefix="ayyam:writing" onReward={awardExp} onComplete={() => setPage("joyful")} onWritingDone={() => setMaharah((m) => ({ ...m, writing: true }))} />
        : <WritingPage rewardPrefix={`${material}:writing`} onReward={awardExp} levels={material === "taaruf" ? TAARUF_WRITING_LEVELS : ALWAN_WRITING_LEVELS} onComplete={() => setPage("joyful")} onWritingDone={() => setMaharah((m) => ({ ...m, writing: true }))} />)}
      {page === "joyful" && (material === "ayyam"
        ? <JoyfulPage onReward={awardExp} onComplete={() => setPage("evaluation")} onSaveScore={setGameScore} />
        : <JoyfulMaterialPage material={material} onReward={awardExp} onComplete={() => setPage("evaluation")} onScore={setGameScore} />)}
      {page === "evaluation" && (material === "ayyam"
        ? <EvaluationPage onReward={awardExp} onComplete={() => setPage("reflection")} onSaveScore={saveEvaluationScore} />
        : <EvaluationPage material={material} onReward={awardExp} onComplete={() => setPage("reflection")} onSaveScore={saveEvaluationScore} />)}
      {page === "reflection" && (material === "ayyam"
        ? <ReflectionPage rewardPrefix="ayyam:reflection" onReward={awardExp} onComplete={completeMaterial} mindfulData={ayyamMindful} onSave={setAyyamReflection} />
        : <ReflectionPage rewardPrefix={`${material}:reflection`} onReward={awardExp} questions={material === "taaruf" ? TAARUF_REFLECT_QS : ALWAN_REFLECT_QS} onComplete={completeMaterial} mindfulData={{ experience: mindfulAnswer?.experience ?? null, memory: mindfulAnswer?.memory, guess: mindfulAnswer?.guess }} onSave={setMaterialReflection} />)}
      {page === "result" && (material === "ayyam"
        ? <ResultPage exp={activeStudent?.exp ?? 0} gameScore={gameScore} evalScore={evalScore} reflectionData={ayyamReflection} mindfulData={ayyamMindful} maharah={maharah} profile={profile} onRestart={resetSession} onMaterials={() => setPage("materials")} />
        : <ResultPage exp={activeStudent?.exp ?? 0} gameScore={gameScore} evalScore={evalScore} reflectionData={materialReflection} mindfulData={{ experience: mindfulAnswer?.experience ?? null, memory: mindfulAnswer?.memory, guess: mindfulAnswer?.guess }} maharah={maharah} profile={profile} onRestart={resetSession} onMaterials={() => setPage("materials")} materialArabic={getMaterialMeta(material).arabic} materialName={getMaterialMeta(material).title} gameMax={2} evalMax={9} />)}
      {expToast !== null && <div className="fixed top-20 right-4 z-[120] rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-3 shadow-xl font-black bounce-in">+{expToast} EXP</div>}
    </div>
  );
}

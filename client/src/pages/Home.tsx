import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Flame,
  Headphones,
  LockKeyhole,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DAILY_STAGES,
  evaluateBrowserTranscript,
  evaluateRoleplay,
  getLevelProgress,
  LEVELS,
  PR_SCENARIO_LIBRARY,
  practiceSignal,
  SMALL_TALK_SCENARIO,
  type RoleplayEvaluation,
} from "../../../shared/practice";

const SESSION_XP = DAILY_STAGES.reduce((sum, stage) => sum + stage.xp, 0) + 20;
const LOCAL_PROGRESS_KEY = "pr-speak-coach-guest-progress-v1";

type GuestProgress = {
  xp: number;
  streak: number;
  completedDates: string[];
};

function getLocalDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function readGuestProgress(): GuestProgress {
  if (typeof window === "undefined") return { xp: 0, streak: 0, completedDates: [] };
  try {
    const stored = JSON.parse(window.localStorage.getItem(LOCAL_PROGRESS_KEY) ?? "null") as Partial<GuestProgress> | null;
    return {
      xp: typeof stored?.xp === "number" ? stored.xp : 0,
      streak: typeof stored?.streak === "number" ? stored.streak : 0,
      completedDates: Array.isArray(stored?.completedDates) ? stored.completedDates.filter((item): item is string => typeof item === "string") : [],
    };
  } catch {
    return { xp: 0, streak: 0, completedDates: [] };
  }
}

type MediaRecorderWithState = MediaRecorder & { stream?: MediaStream };
type BrowserRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type BrowserRecognitionConstructor = new () => BrowserRecognition;

function formatMinutes(total: number) {
  return `${total} min`;
}

function pickAmericanVoice(voices: SpeechSynthesisVoice[]) {
  const american = voices.filter(voice => voice.lang.toLowerCase().startsWith("en-us"));
  const candidates = american.length > 0 ? american : voices.filter(voice => voice.lang.toLowerCase().startsWith("en"));
  const preferredNames = [/microsoft.*(andrew|guy|davis|david)/i, /google us english/i, /alex/i, /daniel/i, /aaron/i];
  return [...candidates].sort((left, right) => {
    const leftRank = preferredNames.findIndex(pattern => pattern.test(left.name));
    const rightRank = preferredNames.findIndex(pattern => pattern.test(right.name));
    return (leftRank === -1 ? preferredNames.length : leftRank) - (rightRank === -1 ? preferredNames.length : rightRank);
  })[0];
}

function wordIndexAtCharacter(text: string, characterIndex: number) {
  const words = Array.from(text.matchAll(/[A-Za-z']+/g));
  const index = words.findIndex(match => characterIndex >= (match.index ?? 0) && characterIndex < (match.index ?? 0) + match[0].length);
  return index >= 0 ? index : -1;
}

function speakSentence(text: string, voice: SpeechSynthesisVoice | undefined, setSpeaking: (value: boolean) => void, setActiveWord: (value: number) => void) {
  if (!("speechSynthesis" in window) || !voice) return;
  window.speechSynthesis.cancel();
  setActiveWord(-1);
  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) utterance.voice = voice;
  utterance.lang = "en-US";
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.onstart = () => setSpeaking(true);
  utterance.onboundary = event => {
    if (event.name === "word") setActiveWord(wordIndexAtCharacter(text, event.charIndex));
  };
  utterance.onend = () => { setSpeaking(false); setActiveWord(-1); };
  utterance.onerror = () => { setSpeaking(false); setActiveWord(-1); };
  window.setTimeout(() => window.speechSynthesis.speak(utterance), 80);
}

function Metric({ label, value, tone = "dark" }: { label: string; value: number; tone?: "dark" | "warm" | "green" }) {
  const styles = tone === "warm" ? "bg-[#f7eee9] text-[#9c451f]" : tone === "green" ? "bg-[#e6f2ed] text-[#1d6c59]" : "bg-[#f0eee7] text-[#151514]";
  return (
    <div className={`rounded-2xl px-3 py-3 ${styles}`}>
      <p className="micro-label opacity-80">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

export default function Home() {
  const [stageIndex, setStageIndex] = useState(0);
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [roleplayText, setRoleplayText] = useState("");
  const [roleplayTranscript, setRoleplayTranscript] = useState("");
  const [recordingMode, setRecordingMode] = useState<"shadow" | "roleplay">("shadow");
  const [roleplayResult, setRoleplayResult] = useState<RoleplayEvaluation | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [guestProgress, setGuestProgress] = useState<GuestProgress>(readGuestProgress);
  const recorderRef = useRef<MediaRecorderWithState | null>(null);
  const recognitionRef = useRef<BrowserRecognition | null>(null);
  const stage = DAILY_STAGES[stageIndex];
  const speechRecognitionSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const stageCaptionTokens = useMemo(() => {
    let wordIndex = 0;
    return (stage.sentence.match(/[A-Za-z']+|[^A-Za-z']+/g) ?? []).map(token => {
      const isWord = /[A-Za-z']/.test(token);
      return { token, wordIndex: isWord ? wordIndex++ : null };
    });
  }, [stage.sentence]);
  const currentAttempt = attempts[stage.id] ?? 0;
  const selectedVoice = useMemo(() => availableVoices.find(voice => voice.voiceURI === selectedVoiceUri) ?? pickAmericanVoice(availableVoices), [availableVoices, selectedVoiceUri]);
  const transcriptEvaluation = transcript ? evaluateBrowserTranscript(stage.sentence, transcript) : null;
  const currentSignal = transcriptEvaluation ?? { ...practiceSignal(currentAttempt, false), completeness: 0, overallScore: 0, passed: false };
  const baseXp = guestProgress.xp;
  const currentSessionXp = sessionComplete ? 0 : completedStages.reduce((total, stageId) => total + (DAILY_STAGES.find(item => item.id === stageId)?.xp ?? 0), 0);
  const syntheticXp = baseXp + currentSessionXp;
  const levelProgress = getLevelProgress(syntheticXp);
  const levelInfo = LEVELS[levelProgress.level];
  const totalSteps = DAILY_STAGES.length + 1;
  const completedCount = completedStages.length + (roleplayResult ? 1 : 0);
  const sessionProgress = Math.round((completedCount / totalSteps) * 100);

  const historyLevels = useMemo(() => {
    const completed = new Set(guestProgress.completedDates);
    const today = new Date();
    return Array.from({ length: 35 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (34 - index));
      const key = date.toISOString().slice(0, 10);
      if (completed.has(key)) return 3;
      return 0;
    });
  }, [guestProgress.completedDates]);

  useEffect(() => {
    return () => {
      recorderRef.current?.stream?.getTracks().forEach(track => track.stop());
      recognitionRef.current?.stop();
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const updateVoices = () => {
      const englishVoices = window.speechSynthesis.getVoices().filter(voice => voice.lang.toLowerCase().startsWith("en"));
      setAvailableVoices(englishVoices);
      setSelectedVoiceUri(current => {
        if (current && englishVoices.some(voice => voice.voiceURI === current)) return current;
        return pickAmericanVoice(englishVoices)?.voiceURI ?? "";
      });
    };
    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(guestProgress));
  }, [guestProgress]);

  const startRecording = async (mode: "shadow" | "roleplay" = "shadow") => {
    setRecordingError(null);
    setRecordingMode(mode);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setRecordingError("Your browser does not support microphone recording. Try a current version of Chrome, Edge, or Safari.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream) as MediaRecorderWithState;
      recorder.stream = stream;
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = event => chunks.push(event.data);
      recorder.onstop = () => {
        const url = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
        setRecordedUrl(previous => {
          if (previous) URL.revokeObjectURL(previous);
          return url;
        });
        recorder.stream?.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecordedUrl(null);
      if (mode === "shadow") setTranscript("");
      if (mode === "roleplay") setRoleplayTranscript("");
      setIsRecording(true);

      const Recognition = (window as typeof window & { SpeechRecognition?: BrowserRecognitionConstructor; webkitSpeechRecognition?: BrowserRecognitionConstructor }).SpeechRecognition
        ?? (window as typeof window & { webkitSpeechRecognition?: BrowserRecognitionConstructor }).webkitSpeechRecognition;
      if (Recognition) {
        const recognition = new Recognition();
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.onresult = event => {
          const spoken = event.results[0]?.[0]?.transcript ?? "";
          if (mode === "roleplay") setRoleplayTranscript(spoken);
          else setTranscript(spoken);
        };
        recognition.onerror = () => setIsRecognizing(false);
        recognition.onend = () => setIsRecognizing(false);
        recognitionRef.current = recognition;
        recognition.start();
        setIsRecognizing(true);
      } else if (mode === "shadow") {
        setRecordingError("This browser cannot compare your words. Use a current Chrome or Edge browser for the word-by-word pass gate.");
      }
    } catch {
      setRecordingError("Microphone permission was not granted. Please allow access, then try again.");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    recognitionRef.current?.stop();
  };

  const retryRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setTranscript("");
    setAttempts(previous => ({ ...previous, [stage.id]: currentAttempt + 1 }));
    startRecording();
  };

  const passStage = () => {
    if (!currentSignal.passed || completedStages.includes(stage.id)) return;
    setCompletedStages(previous => [...previous, stage.id]);
    if (stageIndex < DAILY_STAGES.length - 1) {
      setStageIndex(stageIndex + 1);
      setRecordedUrl(null);
      setTranscript("");
    }
  };

  const scoreRoleplay = () => {
    const response = roleplayTranscript.trim() || roleplayText.trim();
    if (!response) return;
    const result = evaluateRoleplay(response);
    setRoleplayResult(result);
  };

  const finishSession = () => {
    if (completedStages.length !== DAILY_STAGES.length || !roleplayResult) return;
    setSessionComplete(true);
    const today = getLocalDateKey();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = getLocalDateKey(yesterday);
    setGuestProgress(previous => {
      if (previous.completedDates.includes(today)) return previous;
      return {
        xp: previous.xp + SESSION_XP,
        streak: previous.completedDates.includes(yesterdayKey) ? previous.streak + 1 : 1,
        completedDates: Array.from(new Set([...previous.completedDates, today])).slice(-35),
      };
    });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fbfaf7] text-[#151514]">
      <header className="sticky top-0 z-30 border-b border-[#e5e2da] bg-[#fbfaf7]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 lg:px-10">
          <a className="flex items-center gap-3" href="#today" aria-label="PR Speak Coach home">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#151514] text-white"><Volume2 size={22} /></span>
            <span><span className="block text-[1.15rem] font-bold tracking-[-0.04em]">PR Speak Coach</span><span className="block text-[0.67rem] font-bold uppercase tracking-[0.16em] text-[#6e6b63]">Say it with presence</span></span>
          </a>
          <nav className="hidden items-center gap-7 text-[0.86rem] font-semibold text-[#55534e] md:flex" aria-label="Main navigation">
            <a className="hover:text-[#151514]" href="#today">Today</a><a className="hover:text-[#151514]" href="#library">Library</a><a className="hover:text-[#151514]" href="#progress">Progress</a>
          </nav>
          <div className="flex items-center gap-3"><span className="hidden text-sm font-semibold sm:block">Guest practice</span><span className="grid h-10 w-10 place-items-center rounded-full bg-[#e6f2ed] text-sm font-bold text-[#1d6c59]">G</span></div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-5 pb-20 pt-8 lg:px-10 lg:pt-12">
        <section className="grid gap-8 lg:grid-cols-[1.12fr_.88fr] lg:items-end">
          <div>
            <p className="eyebrow">Monday practice · 15 minutes</p>
            <h1 className="serif-display mt-3 max-w-3xl text-[3.2rem] leading-[0.95] tracking-[-0.055em] sm:text-[4.65rem]">Speak like the<br /><em>room is listening.</em></h1>
            <p className="mt-6 max-w-xl text-[1.15rem] leading-relaxed text-[#5f5d57]">Daily voice practice for PR professionals who need to sound clear, warm, and naturally confident in every room.</p>
          </div>
          <div className="coach-card paper-grid relative overflow-hidden p-6 sm:p-7">
            <div className="relative flex items-start justify-between gap-5"><div><p className="eyebrow">Your standing</p><p className="mt-2 text-[1.8rem] font-bold tracking-[-0.05em]">{levelInfo.label}</p><p className="mt-1 text-sm text-[#6e6b63]">{levelProgress.nextLevel ? `${levelProgress.xpToNext} XP to ${LEVELS[levelProgress.nextLevel].label}` : "You have reached the top tier."}</p></div><div className="grid h-16 w-16 place-items-center rounded-[1.4rem] bg-[#1d6c59] text-white shadow-lg shadow-[#1d6c59]/20"><Trophy size={28} /></div></div>
            <div className="relative mt-7"><div className="mb-2 flex justify-between text-sm font-bold"><span>{syntheticXp} XP</span><span>{levelProgress.progress}%</span></div><div className="h-3 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[#1d6c59] transition-all duration-500" style={{ width: `${levelProgress.progress}%` }} /></div></div>
          </div>
        </section>

        <section id="today" className="mt-11 grid gap-7 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="coach-card overflow-hidden">
            <div className="flex flex-col gap-5 border-b border-[#e5e2da] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"><div><p className="eyebrow">Today&apos;s voice room</p><h2 className="serif-display mt-1 text-[2.3rem] leading-none tracking-[-0.04em]">The moment before the message</h2></div><div className="flex items-center gap-3"><span className="rounded-full bg-[#f7eee9] px-3 py-2 text-sm font-bold text-[#9c451f]"><Flame className="mr-1 inline" size={16} /> {guestProgress.streak} day streak</span><span className="rounded-full bg-[#e6f2ed] px-3 py-2 text-sm font-bold text-[#1d6c59]">{sessionProgress}% done</span></div></div>
            <div className="p-6 sm:p-8">
              <div className="mb-8 flex items-center gap-3" aria-label="Session progress">{[...DAILY_STAGES, { id: "roleplay" }].map((item, index) => <div key={item.id} className="flex flex-1 items-center gap-2"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${index < completedCount ? "bg-[#1d6c59] text-white" : index === completedCount ? "border-2 border-[#1d6c59] bg-white text-[#1d6c59]" : "bg-[#f0eee7] text-[#9a978e]"}`}>{index < completedCount ? <Check size={16} /> : index + 1}</span>{index < totalSteps - 1 && <span className={`h-1 flex-1 rounded-full ${index < completedCount ? "bg-[#1d6c59]" : "bg-[#e7e4dc]"}`} />}</div>)}</div>

              <div className="grid gap-8 lg:grid-cols-[1fr_230px] lg:items-start">
                <div>
                  <div className="flex items-center gap-2"><span className="rounded-md bg-[#151514] px-2 py-1 text-[0.66rem] font-bold tracking-[.13em] text-white">{stage.eyebrow}</span><span className="text-sm font-semibold text-[#6e6b63]">{stage.category}</span></div>
                  <h3 className="mt-5 max-w-2xl text-[1.85rem] font-bold leading-[1.45] tracking-[-.035em] sm:text-[2.35rem]" aria-label={`Reference sentence: ${stage.sentence}`}>“{stageCaptionTokens.map((part, index) => { if (part.wordIndex === null) return <span key={`${part.token}-${index}`}>{part.token}</span>; const feedback = transcriptEvaluation?.wordFeedback[part.wordIndex]; const isActive = activeWordIndex === part.wordIndex; const visualState = feedback ? (feedback.status === "matched" ? "border-[#b9dccf] bg-[#e6f2ed] text-[#1d6c59]" : feedback.status === "near" ? "border-[#efcf96] bg-[#fff1cf] text-[#9c6214]" : "border-[#efbeb7] bg-[#fce8e5] text-[#bf3d2e] line-through decoration-[#bf3d2e]/60") : isActive ? "border-[#151514] bg-[#151514] text-white shadow-sm" : "border-transparent text-[#151514]"; return <span key={`${part.token}-${index}`} className={`mx-[0.08em] inline rounded-md border px-[0.11em] py-[0.04em] transition-colors duration-150 ${visualState}`}>{part.token}</span>; })}”</h3>
                  <div className="mt-5 flex flex-wrap items-center gap-3"><Button disabled={!selectedVoice} onClick={() => speakSentence(stage.sentence, selectedVoice, setIsSpeaking, setActiveWordIndex)} variant="outline" className="active-press h-12 rounded-xl border-[#d8d4c9] bg-white px-4 text-sm font-bold hover:bg-[#f5f3ed] disabled:cursor-not-allowed disabled:opacity-50"><Headphones className="mr-2" size={18} /> {isSpeaking ? "Playing karaoke demo" : "Listen first"}</Button>{availableVoices.length > 0 ? <label className="flex items-center gap-2 text-sm font-semibold text-[#55534d]"><span className="sr-only">English demonstration voice</span><select aria-label="English demonstration voice" value={selectedVoice?.voiceURI ?? ""} onChange={event => setSelectedVoiceUri(event.target.value)} className="h-12 max-w-[230px] rounded-xl border border-[#d8d4c9] bg-white px-3 text-sm font-semibold outline-none focus:border-[#1d6c59] focus:ring-2 focus:ring-[#1d6c59]/20">{availableVoices.map(voice => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name.replace(/Microsoft |Google /g, "")} · {voice.lang}</option>)}</select></label> : <span className="text-sm font-semibold text-[#9c451f]" role="status">Install or enable an English device voice to hear the demo.</span>}<span className="text-xs text-[#77746c]">US English preferred · normal speed</span></div>
                  <div className="mt-7 rounded-2xl border border-[#e5e2da] bg-[#fffefa] p-4"><div className="flex gap-3"><CircleHelp className="mt-0.5 shrink-0 text-[#9c451f]" size={19} /><p className="text-[0.95rem] leading-relaxed text-[#5f5d57]"><strong className="text-[#151514]">Coach&apos;s ear.</strong> {stage.coachingNote}</p></div></div>
                  {transcriptEvaluation && <div className="reward-pop mt-4 rounded-2xl border border-[#d7e6de] bg-[#f5fbf8] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-bold text-[#1d6c59]">Browser heard: “{transcript}”</p><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#1d6c59]">{currentSignal.completeness}% words matched</span></div><div className="mt-3 flex flex-wrap gap-1.5">{transcriptEvaluation.wordFeedback.map((item, index) => <span key={`${item.word}-${index}`} className={`rounded-md px-2 py-1 text-xs font-semibold ${item.status === "matched" ? "bg-[#e1f0e9] text-[#1d6c59]" : item.status === "near" ? "bg-[#fff1cf] text-[#9c6214]" : "bg-[#fce8dd] text-[#ad4c22]"}`}>{item.word}</span>)}</div><p className="mt-3 text-xs font-semibold text-[#6e6b63]">Green = recognised match · orange = close text match, say it once more · red = not recognised. This is browser recognition, not clinical pronunciation scoring.</p></div>}
                </div>
                <aside className="rounded-[1.4rem] bg-[#f0eee7] p-5"><p className="eyebrow">Pass gate</p><p className="mt-2 text-[1.5rem] font-bold tracking-[-.04em]">{transcriptEvaluation ? "Match the message" : "Read to unlock"}</p><p className="mt-2 text-sm leading-relaxed text-[#6e6b63]">{transcriptEvaluation ? "At least 90% of the sentence must turn green. Red words were not recognised: say them again before you continue." : speechRecognitionSupported ? "Record your voice. The gate opens only after browser recognition checks the words you said." : "A browser word checker is required for this strict pass gate. Please use a current Chrome or Edge browser."}</p><div className="mt-5 grid grid-cols-2 gap-2"><Metric label="Match" value={currentSignal.completeness} tone="green" /><Metric label="Flow" value={currentSignal.fluency} tone="warm" /></div></aside>
              </div>

              <div className="mt-8 flex flex-col gap-4 border-t border-[#e5e2da] pt-7 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-lg font-bold">{isRecording ? "Recording your shadowing…" : recordedUrl ? "Recording saved. Play it back, then decide." : "Ready when you are."}</p><p className="mt-1 text-sm text-[#6e6b63]">{isRecognizing ? "Listening for your words…" : currentAttempt > 1 ? `Attempt ${currentAttempt} · your next take gets a fresh practice signal.` : "Take your time. Warmth is part of the message."}</p>{recordingError && <p className="mt-2 text-sm font-semibold text-[#b8402c]">{recordingError}</p>}</div><div className="flex flex-wrap gap-3">{recordedUrl && <Button variant="outline" onClick={() => new Audio(recordedUrl).play()} className="active-press h-12 rounded-xl border-[#d8d4c9] bg-white font-bold"><Play className="mr-2" size={17} /> Play back</Button>}{isRecording ? <Button onClick={stopRecording} className="active-press h-12 rounded-xl bg-[#b8402c] px-5 font-bold hover:bg-[#9f3424]"><Pause className="mr-2" size={17} /> Stop</Button> : recordedUrl ? <Button variant="outline" onClick={retryRecording} className="active-press h-12 rounded-xl border-[#d8d4c9] bg-white font-bold"><RotateCcw className="mr-2" size={17} /> Try again</Button> : <Button onClick={() => startRecording("shadow")} className="active-press h-12 rounded-xl bg-[#151514] px-5 font-bold hover:bg-[#383733]"><Mic className="mr-2" size={17} /> Record my voice</Button>}<Button disabled={!currentSignal.passed || completedStages.includes(stage.id)} onClick={passStage} className="active-press h-12 rounded-xl bg-[#1d6c59] px-5 font-bold hover:bg-[#165847]">Pass & continue <ChevronRight className="ml-1" size={17} /></Button></div></div>
              {currentSignal.passed && !completedStages.includes(stage.id) && <div className="reward-pop mt-5 flex items-center gap-3 rounded-2xl bg-[#e6f2ed] px-4 py-3 text-sm font-bold text-[#1d6c59]"><Sparkles size={18} /> Great — you have the signal to move on. Listen once more if you want the rhythm to feel even easier.</div>}
            </div>
          </div>

          <aside className="space-y-6" id="progress"><div className="coach-card p-6"><div className="flex items-center justify-between"><div><p className="eyebrow">Practice map</p><h3 className="mt-1 text-xl font-bold tracking-[-.04em]">Last 5 weeks</h3></div><BarChart3 className="text-[#1d6c59]" size={23} /></div><div className="mt-5 grid grid-cols-7 gap-2" aria-label="Session history heatmap">{historyLevels.map((level, index) => <span className="heat-cell" data-level={level} key={index} title={`Practice day ${index + 1}`} />)}</div><div className="mt-5 flex items-center justify-between text-xs font-semibold text-[#6e6b63]"><span>Less</span><span className="flex gap-1"><i className="heat-cell h-3 w-3" data-level="0" /><i className="heat-cell h-3 w-3" data-level="1" /><i className="heat-cell h-3 w-3" data-level="2" /><i className="heat-cell h-3 w-3" data-level="3" /></span><span>More</span></div></div><div className="quiet-card p-6"><p className="eyebrow">This week&apos;s promise</p><p className="serif-display mt-2 text-[1.9rem] leading-none tracking-[-.04em]">Five rooms.<br />One stronger voice.</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-[#e5e2da]"><div className="h-full w-[60%] rounded-full bg-[#cb5a29]" /></div><p className="mt-2 text-sm font-semibold text-[#6e6b63]">3 of 5 sessions complete</p></div></aside>
        </section>

        <section id="library" className="mt-8 grid gap-7 lg:grid-cols-[.88fr_1.12fr]">
          <div className="coach-card p-6 sm:p-8"><p className="eyebrow">04 · SMALL TALK ROOM</p><h2 className="serif-display mt-2 text-[2.4rem] leading-none tracking-[-.045em]">Make the conversation feel easy.</h2><p className="mt-4 max-w-lg text-[1.05rem] leading-relaxed text-[#5f5d57]">{SMALL_TALK_SCENARIO.prompt}</p><div className="mt-6 rounded-2xl bg-[#f0eee7] p-4"><p className="micro-label">Response guide</p><p className="mt-1 text-sm leading-relaxed text-[#5f5d57]">{SMALL_TALK_SCENARIO.responseGuide}</p></div><div className="mt-6 flex flex-wrap gap-3">{isRecording && recordingMode === "roleplay" ? <Button onClick={stopRecording} className="active-press h-12 rounded-xl bg-[#b8402c] px-5 font-bold hover:bg-[#9f3424]"><Pause className="mr-2" size={17} /> Stop & review</Button> : <Button onClick={() => startRecording("roleplay")} variant="outline" className="active-press h-12 rounded-xl border-[#d8d4c9] bg-white font-bold"><Mic className="mr-2" size={17} /> Speak my response</Button>}<span className="self-center text-sm text-[#6e6b63]">{roleplayTranscript ? "Your spoken response is ready to review." : "Speak first; use the text box only if you want to refine a phrase."}</span></div>{roleplayTranscript && <div className="reward-pop mt-4 rounded-2xl border border-[#d7e6de] bg-[#f5fbf8] p-4 text-sm"><p className="font-bold text-[#1d6c59]">Browser heard: “{roleplayTranscript}”</p><p className="mt-1 text-[#6e6b63]">Check the transcript quickly, then review your spoken small talk.</p></div>}</div>
          <div className="coach-card p-6 sm:p-8"><div className="flex items-center justify-between gap-4"><div><p className="eyebrow">Your practice recap</p><h3 className="mt-1 text-xl font-bold tracking-[-.04em]">What did you say?</h3></div>{roleplayResult && <span className="rounded-full bg-[#e6f2ed] px-3 py-2 text-sm font-bold text-[#1d6c59]">{roleplayResult.overallScore}/100 practice signal</span>}</div><Textarea value={roleplayText} onChange={event => setRoleplayText(event.target.value)} placeholder="Optional: refine the key line in writing. Your recorded spoken response is used first when available." className="mt-5 min-h-36 rounded-2xl border-[#d8d4c9] bg-[#fffefa] p-4 text-[1rem] leading-relaxed placeholder:text-[#9b978d] focus-visible:ring-[#1d6c59]" />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-md text-sm leading-relaxed text-[#6e6b63]">Transparent rules check: event context, warm opener, open question, and a personal bridge. No external AI is used.</p><Button disabled={!(roleplayTranscript.trim() || roleplayText.trim())} onClick={scoreRoleplay} className="active-press h-12 rounded-xl bg-[#151514] px-5 font-bold hover:bg-[#383733]">Review my small talk <ChevronRight className="ml-2" size={17} /></Button></div>
            {roleplayResult && <div className="reward-pop mt-6 grid gap-4 rounded-[1.25rem] border border-[#d7e6de] bg-[#f5fbf8] p-5 sm:grid-cols-[1fr_auto]"><div><p className="text-lg font-bold">You created a useful entry point.</p><ul className="mt-2 space-y-1 text-sm text-[#416154]">{roleplayResult.strengths.map(strength => <li className="flex gap-2" key={strength}><Check className="mt-0.5 shrink-0 text-[#1d6c59]" size={15} />{strength}</li>)}</ul><p className="mt-3 text-sm font-semibold text-[#9c451f]">Next move: {roleplayResult.nextMove}</p></div><div className="grid grid-cols-3 gap-2 sm:w-52"><Metric label="Relevance" value={roleplayResult.relevance} tone="green" /><Metric label="Natural" value={roleplayResult.naturalness} tone="warm" /><Metric label="Connect" value={roleplayResult.connection} /></div></div>}
          </div>
        </section>

        <section className="mt-8 coach-card p-6 sm:p-8"><div className="flex flex-col gap-4 border-b border-[#e5e2da] pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">PR situation library</p><h2 className="serif-display mt-2 text-[2.45rem] leading-none tracking-[-.045em]">Train for the rooms that matter.</h2></div><p className="max-w-sm text-sm leading-relaxed text-[#6e6b63]">Each room adds a practical phrase set, listen-first rhythm drill, and confident-response rehearsal.</p></div><div className="mt-6 grid gap-3 lg:grid-cols-5">{PR_SCENARIO_LIBRARY.map(scenario => { const unlocked = scenario.minimumXp <= syntheticXp; return <div className={`rounded-[1.2rem] border p-4 transition-transform ${unlocked ? "border-[#e5e2da] bg-[#fffefa] hover:-translate-y-0.5" : "border-[#e5e2da] bg-[#f5f3ed] opacity-70"}`} key={scenario.id}><div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-xl" style={{ backgroundColor: scenario.accent }}><BookOpen size={17} /></span>{unlocked ? <span className="rounded-full bg-[#e6f2ed] px-2 py-1 text-[0.63rem] font-bold uppercase tracking-[.1em] text-[#1d6c59]">Ready</span> : <LockKeyhole size={16} className="text-[#88847a]" />}</div><p className="mt-5 text-[1.05rem] font-bold tracking-[-.03em]">{scenario.title}</p><p className="mt-2 min-h-14 text-sm leading-relaxed text-[#6e6b63]">{scenario.detail}</p><div className="mt-4 flex items-center justify-between text-xs font-bold uppercase tracking-[.1em] text-[#6e6b63]"><span>{scenario.minutes} min</span><span>{LEVELS[scenario.level].label}</span></div></div>; })}</div></section>

        <section className="mt-8 coach-card overflow-hidden"><div className="flex flex-col gap-6 bg-[#151514] p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9"><div><p className="eyebrow text-[#bfc6c0]">Finish today&apos;s room</p><h2 className="serif-display mt-2 text-[2.5rem] leading-none tracking-[-.045em]">Leave with a voice worth remembering.</h2><p className="mt-3 max-w-2xl text-[1.02rem] text-[#d7dad6]">Complete the three voice moments and the small-talk rehearsal to bank {SESSION_XP} XP and protect your streak.</p></div><Button disabled={completedStages.length !== DAILY_STAGES.length || !roleplayResult || sessionComplete} onClick={finishSession} className="active-press h-14 rounded-xl bg-[#d98a54] px-6 text-base font-bold text-[#20130c] hover:bg-[#ed9c64]">{sessionComplete ? <><Check className="mr-2" size={18} /> Today complete</> : <>Complete session <Trophy className="ml-2" size={18} /></>}</Button></div>{sessionComplete && <div className="reward-pop flex items-center gap-3 p-6"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e6f2ed] text-[#1d6c59]"><Sparkles size={23} /></span><div><p className="font-bold">Session saved on this device.</p><p className="text-sm text-[#6e6b63]">+{SESSION_XP} XP · {formatMinutes(15)} invested in your next confident conversation.</p></div></div>}</section>
      </main>
      <footer className="border-t border-[#e5e2da] py-8 text-center text-sm text-[#6e6b63]">PR Speak Coach · Browser-first practice · Exact AI scoring is intentionally disabled in this zero-cost version.</footer>
    </div>
  );
}

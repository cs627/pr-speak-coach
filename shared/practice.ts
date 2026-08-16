export type LevelKey = "beginner" | "professional" | "expert";

export const LEVELS: Record<LevelKey, { label: string; minimumXp: number; color: string }> = {
  beginner: { label: "Beginner", minimumXp: 0, color: "#CB5A29" },
  professional: { label: "Professional", minimumXp: 350, color: "#1D6C59" },
  expert: { label: "Expert", minimumXp: 900, color: "#4D3F91" },
};

export const DAILY_STAGES = [
  {
    id: "voice-match",
    label: "Voice Match",
    eyebrow: "01 · LISTEN & SHADOW",
    minutes: 4,
    xp: 12,
    category: "Press conference",
    sentence: "Thank you for joining us today. We are pleased to share a meaningful update with you.",
    coachingNote: "Keep the opening warm but measured. Let “pleased” and “meaningful” carry the emphasis.",
  },
  {
    id: "media-moment",
    label: "Media Moment",
    eyebrow: "02 · MESSAGE WITH CLARITY",
    minutes: 4,
    xp: 14,
    category: "Media interview",
    sentence: "What matters most is the positive impact this partnership will create for our community.",
    coachingNote: "Join “matters most” naturally and pause briefly before “for our community”.",
  },
  {
    id: "client-chemistry",
    label: "Client Chemistry",
    eyebrow: "03 · BUILD RAPPORT",
    minutes: 3,
    xp: 14,
    category: "Client pitch",
    sentence: "Before we talk solutions, I would love to understand what success looks like from your perspective.",
    coachingNote: "Use a curious tone on “I would love to understand” — it should feel collaborative, not scripted.",
  },
] as const;

export const PR_SCENARIO_LIBRARY = [
  { id: "press-briefing", title: "Press briefing", detail: "Announce an update with calm authority.", level: "beginner" as LevelKey, minimumXp: 0, minutes: 4, accent: "#e6f2ed" },
  { id: "media-interview", title: "Media interview", detail: "Bridge a tough question back to your core message.", level: "beginner" as LevelKey, minimumXp: 0, minutes: 5, accent: "#f7eee9" },
  { id: "client-pitch", title: "Client pitch", detail: "Turn insight into a confident recommendation.", level: "professional" as LevelKey, minimumXp: 350, minutes: 6, accent: "#edf0fa" },
  { id: "networking-opener", title: "Networking opener", detail: "Start a warm conversation without sounding rehearsed.", level: "professional" as LevelKey, minimumXp: 350, minutes: 4, accent: "#f8f0e5" },
  { id: "event-floor", title: "Event-floor small talk", detail: "Keep the room moving with thoughtful follow-ups.", level: "expert" as LevelKey, minimumXp: 900, minutes: 7, accent: "#f0ecf8" },
] as const;

export const SMALL_TALK_SCENARIO = {
  id: "launch-journalist",
  title: "The journalist at the launch",
  prompt: "You have just met a lifestyle journalist at a brand launch. Open the conversation, make a genuine connection, and invite their view of the event.",
  responseGuide: "Aim for 2–4 sentences. Mention the event or their work, add a warm observation, then ask one open question.",
  keywords: ["launch", "event", "journalist", "story", "work", "brand", "campaign", "today"],
};

export type RoleplayEvaluation = {
  relevance: number;
  naturalness: number;
  connection: number;
  overallScore: number;
  feedback: string;
  strengths: string[];
  nextMove: string;
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function getLevelForXp(xp: number): LevelKey {
  if (xp >= LEVELS.expert.minimumXp) return "expert";
  if (xp >= LEVELS.professional.minimumXp) return "professional";
  return "beginner";
}

export function getLevelProgress(xp: number) {
  const level = getLevelForXp(xp);
  const ordered: LevelKey[] = ["beginner", "professional", "expert"];
  const index = ordered.indexOf(level);
  const nextLevel = ordered[index + 1] ?? null;
  const minimum = LEVELS[level].minimumXp;
  const maximum = nextLevel ? LEVELS[nextLevel].minimumXp : minimum + 300;
  return {
    level,
    nextLevel,
    progress: clamp(((xp - minimum) / (maximum - minimum)) * 100),
    xpToNext: nextLevel ? Math.max(0, maximum - xp) : 0,
  };
}

export function nextStreak(previousStreak: number, lastCompletedDate: string | null, todayKey: string, yesterdayKey: string) {
  if (lastCompletedDate === todayKey) return previousStreak;
  return lastCompletedDate === yesterdayKey ? previousStreak + 1 : 1;
}

export function practiceSignal(attemptNumber: number, hasRecording: boolean) {
  const base = hasRecording ? 70 : 46;
  const attemptLift = Math.min(16, Math.max(0, attemptNumber - 1) * 6);
  const overallScore = clamp(base + attemptLift);
  return {
    accuracy: clamp(overallScore + 3),
    fluency: clamp(overallScore - 2),
    prosody: clamp(overallScore - 5),
    completeness: hasRecording ? 100 : 55,
    overallScore,
    passed: false,
  };
}

export type BrowserWordFeedback = { word: string; matched: boolean; status: "matched" | "near" | "missing" };

function spokenWords(text: string) {
  return text.toLowerCase().match(/[a-z']+/g) ?? [];
}

function editDistance(left: string, right: string) {
  const rows = Array.from({ length: left.length + 1 }, (_, index) => index);
  for (let column = 1; column <= right.length; column += 1) {
    let diagonal = rows[0];
    rows[0] = column;
    for (let row = 1; row <= left.length; row += 1) {
      const previous = rows[row];
      rows[row] = Math.min(rows[row] + 1, rows[row - 1] + 1, diagonal + (left[row - 1] === right[column - 1] ? 0 : 1));
      diagonal = previous;
    }
  }
  return rows[left.length];
}

export function evaluateBrowserTranscript(reference: string, transcript: string) {
  const expected = spokenWords(reference);
  const heard = spokenWords(transcript);
  const heardSet = new Set(heard);
  const wordFeedback: BrowserWordFeedback[] = expected.map(word => {
    if (heardSet.has(word)) return { word, matched: true, status: "matched" };
    const closestDistance = Math.min(...heard.map(candidate => editDistance(word, candidate)), Infinity);
    const near = word.length >= 4 && closestDistance <= Math.max(1, Math.floor(word.length * 0.25));
    return { word, matched: false, status: near ? "near" : "missing" };
  });
  const matched = wordFeedback.filter(item => item.matched).length;
  const completeness = clamp((matched / Math.max(1, expected.length)) * 100);
  const accuracy = clamp(48 + completeness * 0.52);
  const fluency = clamp(56 + Math.min(32, transcript.trim().split(/\s+/).filter(Boolean).length * 1.25));
  const prosody = clamp(50 + Math.min(24, Math.max(0, transcript.trim().length - 36) * 0.3));
  const overallScore = clamp(accuracy * 0.5 + fluency * 0.22 + prosody * 0.08 + completeness * 0.2);
  return {
    accuracy,
    fluency,
    prosody,
    completeness,
    overallScore,
    passed: completeness >= 90 && overallScore >= 75,
    wordFeedback,
  };
}

export function evaluateRoleplay(text: string): RoleplayEvaluation {
  const clean = text.trim();
  const normalized = clean.toLowerCase();
  const words = clean ? clean.split(/\s+/).filter(Boolean) : [];
  const keywordHits = SMALL_TALK_SCENARIO.keywords.filter(keyword => normalized.includes(keyword)).length;
  const hasOpenQuestion = /\?|\b(what|how|which|where|when|would you|have you|do you)\b/i.test(clean);
  const hasWarmOpening = /\b(hi|hello|great|lovely|wonderful|nice to meet|pleasure)\b/i.test(normalized);
  const hasPersonalBridge = /\b(i noticed|i enjoyed|i loved|your work|i read|i saw|i'm curious)\b/i.test(normalized);

  const relevance = clamp(42 + keywordHits * 13 + (words.length >= 14 ? 12 : words.length * 0.7));
  const naturalness = clamp(40 + (words.length >= 18 ? 24 : words.length * 1.3) + (hasWarmOpening ? 12 : 0));
  const connection = clamp(32 + (hasOpenQuestion ? 32 : 0) + (hasPersonalBridge ? 20 : 0) + (hasWarmOpening ? 8 : 0));
  const overallScore = clamp(relevance * 0.38 + naturalness * 0.3 + connection * 0.32);

  const strengths: string[] = [];
  if (hasWarmOpening) strengths.push("You opened with welcoming energy.");
  if (keywordHits > 0) strengths.push("You anchored the chat in the event context.");
  if (hasOpenQuestion) strengths.push("You gave the other person an easy way to continue.");
  if (!strengths.length) strengths.push("You have a clear starting point to develop.");

  const nextMove = !hasOpenQuestion
    ? "Finish with one open question, for example: “What has stood out to you so far?”"
    : !hasPersonalBridge
      ? "Add one personal bridge, such as a specific observation about their work or the event."
      : "Now make the follow-up specific: ask what story angle or audience reaction interests them most.";

  return {
    relevance,
    naturalness,
    connection,
    overallScore,
    feedback: `This is a rules-based practice review, not an AI judgment. ${nextMove}`,
    strengths,
    nextMove,
  };
}

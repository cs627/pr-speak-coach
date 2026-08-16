export type GuestProgress = {
  xp: number;
  streak: number;
  completedDates: string[];
};

export const emptyGuestProgress = (): GuestProgress => ({ xp: 0, streak: 0, completedDates: [] });

export function normalizeGuestProgress(value: Partial<GuestProgress> | null | undefined): GuestProgress {
  return {
    xp: typeof value?.xp === "number" && value.xp >= 0 ? value.xp : 0,
    streak: typeof value?.streak === "number" && value.streak >= 0 ? value.streak : 0,
    completedDates: Array.isArray(value?.completedDates) ? value.completedDates.filter((item): item is string => typeof item === "string") : [],
  };
}

export function completeGuestSession(progress: GuestProgress, xpEarned: number, today: string, yesterday: string): GuestProgress {
  if (progress.completedDates.includes(today)) return progress;
  return {
    xp: progress.xp + xpEarned,
    streak: progress.completedDates.includes(yesterday) ? progress.streak + 1 : 1,
    completedDates: Array.from(new Set([...progress.completedDates, today])).slice(-35),
  };
}

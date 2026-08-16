import { describe, expect, it } from "vitest";
import { completeGuestSession, emptyGuestProgress, normalizeGuestProgress } from "../shared/guestProgress";

describe("guest progress", () => {
  it("creates a first-day streak and banks XP locally", () => {
    const next = completeGuestSession(emptyGuestProgress(), 60, "2026-08-17", "2026-08-16");
    expect(next).toEqual({ xp: 60, streak: 1, completedDates: ["2026-08-17"] });
  });

  it("extends a consecutive streak but only awards each date once", () => {
    const previous = { xp: 60, streak: 1, completedDates: ["2026-08-16"] };
    const next = completeGuestSession(previous, 60, "2026-08-17", "2026-08-16");
    expect(next.streak).toBe(2);
    expect(next.xp).toBe(120);
    expect(completeGuestSession(next, 60, "2026-08-17", "2026-08-16")).toBe(next);
  });

  it("resets a broken streak and safely normalizes malformed storage", () => {
    const next = completeGuestSession({ xp: 120, streak: 4, completedDates: ["2026-08-10"] }, 60, "2026-08-17", "2026-08-16");
    expect(next.streak).toBe(1);
    expect(normalizeGuestProgress({ xp: -4, streak: "bad" as unknown as number, completedDates: ["2026-08-17", 4 as unknown as string] })).toEqual({ xp: 0, streak: 0, completedDates: ["2026-08-17"] });
  });
});

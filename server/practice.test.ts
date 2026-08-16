import { describe, expect, it } from "vitest";
import { evaluateBrowserTranscript, evaluateRoleplay, getLevelForXp, getLevelProgress, nextStreak, practiceSignal } from "../shared/practice";

describe("practice rules", () => {
  it("only passes a shadowing signal after a recording exists", () => {
    expect(practiceSignal(1, false).passed).toBe(false);
    expect(practiceSignal(1, true).passed).toBe(true);
  });

  it("marks recognised and missing words separately for browser speech feedback", () => {
    const score = evaluateBrowserTranscript("Thank you for joining us today", "Thank you for joining today");
    expect(score.wordFeedback.find(item => item.word === "us")?.matched).toBe(false);
    expect(score.wordFeedback.find(item => item.word === "thank")?.matched).toBe(true);
    expect(score.completeness).toBeLessThan(100);
  });

  it("progresses levels at the intended XP thresholds", () => {
    expect(getLevelForXp(0)).toBe("beginner");
    expect(getLevelForXp(350)).toBe("professional");
    expect(getLevelForXp(900)).toBe("expert");
    expect(getLevelProgress(320).xpToNext).toBe(30);
  });

  it("continues, preserves, or restarts a streak based on the completion date", () => {
    expect(nextStreak(6, "2026-08-15", "2026-08-16", "2026-08-15")).toBe(7);
    expect(nextStreak(6, "2026-08-16", "2026-08-16", "2026-08-15")).toBe(6);
    expect(nextStreak(6, "2026-08-12", "2026-08-16", "2026-08-15")).toBe(1);
  });

  it("rewards a contextual small-talk response that invites dialogue", () => {
    const score = evaluateRoleplay(
      "Hi, it is lovely to meet you. I enjoyed the energy at the launch today and I am curious: what story angle has stood out to you so far?",
    );
    expect(score.relevance).toBeGreaterThan(60);
    expect(score.connection).toBeGreaterThan(70);
    expect(score.overallScore).toBeGreaterThan(60);
  });
});

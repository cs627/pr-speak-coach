import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getPracticeDashboard: vi.fn(),
  saveSentenceAttempt: vi.fn(),
  saveSmallTalkResponse: vi.fn(),
  completeDailySession: vi.fn(),
}));

import * as db from "./db";
import { appRouter } from "./routers";

function practiceContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "practice-user",
      email: "practice@example.com",
      name: "Practice User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("practice router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("persists a word-level shadowing attempt for the authenticated learner", async () => {
    const caller = appRouter.createCaller(practiceContext());
    vi.mocked(db.saveSentenceAttempt).mockResolvedValue(undefined);

    await caller.practice.saveSentenceAttempt({
      sentenceKey: "voice-match",
      transcript: "Thank you for joining us today",
      accuracy: 88,
      fluency: 82,
      prosody: 74,
      completeness: 90,
      overallScore: 85,
      passed: true,
      feedbackJson: "{}",
    });

    expect(db.saveSentenceAttempt).toHaveBeenCalledWith(expect.objectContaining({
      userId: 42,
      sentenceKey: "voice-match",
      overallScore: 85,
      passed: true,
    }));
  });

  it("persists a small-talk recap and then completes the daily session", async () => {
    const caller = appRouter.createCaller(practiceContext());
    vi.mocked(db.saveSmallTalkResponse).mockResolvedValue(undefined);
    vi.mocked(db.completeDailySession).mockResolvedValue({ totalXp: 60, streak: 3 });

    await caller.practice.saveSmallTalkResponse({
      scenarioKey: "launch-journalist",
      responseText: "Hello, it is lovely to meet you. What has stood out to you at the launch today?",
      relevance: 86,
      naturalness: 82,
      connection: 91,
      overallScore: 86,
      feedback: "Good open question.",
    });
    const result = await caller.practice.completeDailySession({ xpEarned: 60, overallScore: 86 });

    expect(db.saveSmallTalkResponse).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, scenarioKey: "launch-journalist" }));
    expect(db.completeDailySession).toHaveBeenCalledWith(42, 60, 86);
    expect(result).toEqual({ totalXp: 60, streak: 3 });
  });
});

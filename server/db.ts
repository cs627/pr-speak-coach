import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  dailySessions,
  InsertUser,
  learnerProfiles,
  scenarioUnlocks,
  sentenceAttempts,
  smallTalkResponses,
  users,
} from "../drizzle/schema";
import { getLevelForXp, nextStreak as calculateNextStreak, PR_SCENARIO_LIBRARY } from "../shared/practice";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function ensureLearnerProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(learnerProfiles).values({ userId });
  return (await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, userId)).limit(1))[0];
}

export async function ensureDailySession(userId: number, sessionDate = getTodayKey()) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await db
    .select()
    .from(dailySessions)
    .where(eq(dailySessions.userId, userId))
    .orderBy(desc(dailySessions.sessionDate))
    .limit(60);
  const today = existing.find(session => String(session.sessionDate) === sessionDate);
  if (today) return today;
  await db.insert(dailySessions).values({ userId, sessionDate });
  return (await db
    .select()
    .from(dailySessions)
    .where(eq(dailySessions.userId, userId))
    .orderBy(desc(dailySessions.id))
    .limit(1))[0];
}

export async function getPracticeDashboard(userId: number) {
  const db = await getDb();
  if (!db) return { profile: undefined, today: undefined, history: [], unlocks: [] };
  const [profile, today] = await Promise.all([ensureLearnerProfile(userId), ensureDailySession(userId)]);
  const [history, unlocks] = await Promise.all([
    db.select().from(dailySessions).where(eq(dailySessions.userId, userId)).orderBy(desc(dailySessions.sessionDate)).limit(42),
    db.select().from(scenarioUnlocks).where(eq(scenarioUnlocks.userId, userId)),
  ]);
  return { profile, today, history, unlocks };
}

export async function saveSentenceAttempt(input: {
  userId: number;
  sentenceKey: string;
  transcript?: string | null;
  accuracy: number;
  fluency: number;
  prosody: number;
  completeness: number;
  overallScore: number;
  passed: boolean;
  feedbackJson?: string | null;
}) {
  const db = await getDb();
  if (!db) return undefined;
  const session = await ensureDailySession(input.userId);
  if (!session) return undefined;
  await db.insert(sentenceAttempts).values({ ...input, dailySessionId: session.id });
  if (session.status === "not_started") {
    await db.update(dailySessions).set({ status: "in_progress" }).where(eq(dailySessions.id, session.id));
  }
  return session;
}

export async function saveSmallTalkResponse(input: {
  userId: number;
  scenarioKey: string;
  responseText: string;
  relevance: number;
  naturalness: number;
  connection: number;
  overallScore: number;
  feedback: string;
}) {
  const db = await getDb();
  if (!db) return undefined;
  const session = await ensureDailySession(input.userId);
  if (!session) return undefined;
  await db.insert(smallTalkResponses).values({ ...input, dailySessionId: session.id });
  if (session.status === "not_started") {
    await db.update(dailySessions).set({ status: "in_progress" }).where(eq(dailySessions.id, session.id));
  }
  return session;
}

export async function completeDailySession(userId: number, xpEarned: number, overallScore: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [profile, session] = await Promise.all([ensureLearnerProfile(userId), ensureDailySession(userId)]);
  if (!profile || !session) return undefined;
  const sessionWasCompleted = session.status === "completed";
  const totalXp = sessionWasCompleted ? profile.xp : profile.xp + xpEarned;
  const today = getTodayKey();
  const priorDate = profile.lastCompletedDate ? String(profile.lastCompletedDate) : null;
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);
  const nextStreak = sessionWasCompleted ? profile.streak : calculateNextStreak(profile.streak, priorDate, today, yesterdayKey);

  await db
    .update(dailySessions)
    .set({ status: "completed", completedStages: 4, xpEarned, overallScore, completedAt: new Date() })
    .where(eq(dailySessions.id, session.id));
  await db
    .update(learnerProfiles)
    .set({
      xp: totalXp,
      currentLevel: getLevelForXp(totalXp),
      streak: nextStreak,
      longestStreak: Math.max(profile.longestStreak, nextStreak),
      lastCompletedDate: today,
    })
    .where(eq(learnerProfiles.id, profile.id));
  const unlockedScenarioKeys = PR_SCENARIO_LIBRARY
    .filter(scenario => scenario.minimumXp <= totalXp)
    .map(scenario => scenario.id);
  if (!sessionWasCompleted && unlockedScenarioKeys.length) {
    await db
      .insert(scenarioUnlocks)
      .values(unlockedScenarioKeys.map(scenarioKey => ({ userId, scenarioKey })))
      .onDuplicateKeyUpdate({ set: { unlockedAt: new Date() } });
  }
  return { totalXp, streak: nextStreak, unlockedScenarioKeys };
}

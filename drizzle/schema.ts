import {
  boolean,
  date,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** Core identity table managed by Manus OAuth. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const learnerProfiles = mysqlTable(
  "learnerProfiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    currentLevel: mysqlEnum("currentLevel", ["beginner", "professional", "expert"])
      .default("beginner")
      .notNull(),
    xp: int("xp").default(0).notNull(),
    streak: int("streak").default(0).notNull(),
    longestStreak: int("longestStreak").default(0).notNull(),
    preferredVoice: varchar("preferredVoice", { length: 64 }).default("en-US"),
    lastCompletedDate: date("lastCompletedDate", { mode: "string" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("learnerProfiles_userId_unique").on(table.userId)],
);

export const dailySessions = mysqlTable(
  "dailySessions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    sessionDate: date("sessionDate", { mode: "string" }).notNull(),
    status: mysqlEnum("status", ["not_started", "in_progress", "completed"])
      .default("not_started")
      .notNull(),
    completedStages: int("completedStages").default(0).notNull(),
    xpEarned: int("xpEarned").default(0).notNull(),
    overallScore: int("overallScore"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("dailySessions_user_date_unique").on(table.userId, table.sessionDate),
    index("dailySessions_user_date_idx").on(table.userId, table.sessionDate),
  ],
);

export const sentenceAttempts = mysqlTable(
  "sentenceAttempts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    dailySessionId: int("dailySessionId").notNull(),
    sentenceKey: varchar("sentenceKey", { length: 96 }).notNull(),
    transcript: text("transcript"),
    accuracy: int("accuracy").notNull(),
    fluency: int("fluency").notNull(),
    prosody: int("prosody").notNull(),
    completeness: int("completeness").notNull(),
    overallScore: int("overallScore").notNull(),
    passed: boolean("passed").default(false).notNull(),
    feedbackJson: text("feedbackJson"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("sentenceAttempts_session_idx").on(table.dailySessionId)],
);

export const smallTalkResponses = mysqlTable(
  "smallTalkResponses",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    dailySessionId: int("dailySessionId").notNull(),
    scenarioKey: varchar("scenarioKey", { length: 96 }).notNull(),
    responseText: text("responseText").notNull(),
    relevance: int("relevance").notNull(),
    naturalness: int("naturalness").notNull(),
    connection: int("connection").notNull(),
    overallScore: int("overallScore").notNull(),
    feedback: text("feedback").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("smallTalkResponses_session_idx").on(table.dailySessionId)],
);

export const scenarioUnlocks = mysqlTable(
  "scenarioUnlocks",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    scenarioKey: varchar("scenarioKey", { length: 96 }).notNull(),
    unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("scenarioUnlocks_user_scenario_unique").on(table.userId, table.scenarioKey),
    index("scenarioUnlocks_user_idx").on(table.userId),
  ],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type LearnerProfile = typeof learnerProfiles.$inferSelect;
export type DailySession = typeof dailySessions.$inferSelect;
export type ScenarioUnlock = typeof scenarioUnlocks.$inferSelect;

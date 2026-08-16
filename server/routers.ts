import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  practice: router({
    dashboard: protectedProcedure.query(({ ctx }) => db.getPracticeDashboard(ctx.user.id)),
    saveSentenceAttempt: protectedProcedure
      .input(z.object({
        sentenceKey: z.string().min(1).max(96),
        transcript: z.string().max(1500).nullable().optional(),
        accuracy: z.number().int().min(0).max(100),
        fluency: z.number().int().min(0).max(100),
        prosody: z.number().int().min(0).max(100),
        completeness: z.number().int().min(0).max(100),
        overallScore: z.number().int().min(0).max(100),
        passed: z.boolean(),
        feedbackJson: z.string().max(6000).nullable().optional(),
      }))
      .mutation(({ ctx, input }) => db.saveSentenceAttempt({ userId: ctx.user.id, ...input })),
    saveSmallTalkResponse: protectedProcedure
      .input(z.object({
        scenarioKey: z.string().min(1).max(96),
        responseText: z.string().min(1).max(2000),
        relevance: z.number().int().min(0).max(100),
        naturalness: z.number().int().min(0).max(100),
        connection: z.number().int().min(0).max(100),
        overallScore: z.number().int().min(0).max(100),
        feedback: z.string().min(1).max(4000),
      }))
      .mutation(({ ctx, input }) => db.saveSmallTalkResponse({ userId: ctx.user.id, ...input })),
    completeDailySession: protectedProcedure
      .input(z.object({ xpEarned: z.number().int().min(0).max(200), overallScore: z.number().int().min(0).max(100) }))
      .mutation(({ ctx, input }) => db.completeDailySession(ctx.user.id, input.xpEarned, input.overallScore)),
  }),
});

export type AppRouter = typeof appRouter;

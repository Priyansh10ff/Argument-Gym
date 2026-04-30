import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // ─── Users ───────────────────────────────────────────────────────────────────
  // Stores both guest and Google-authenticated users
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    // Auth
    authType: v.union(v.literal("guest"), v.literal("google")),
    guestId: v.optional(v.string()),
    tokenIdentifier: v.optional(v.string()),
    // ELO & Stats
    elo: v.number(),
    wins: v.number(),
    losses: v.number(),
    draws: v.number(),
    streak: v.number(),
    bestStreak: v.number(),
    totalDebates: v.number(),
    achievements: v.optional(v.array(v.string())),
  })
    .index("by_guestId", ["guestId"])
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_elo", ["elo"]),

  // ─── Debate History (replaces daily_scores) ──────────────────────────────────
  debates: defineTable({
    userId: v.id("users"),
    date: v.string(),
    eloDelta: v.number(),
    topic: v.string(),
    verdict: v.string(),
    mode: v.string(),
    logicScore: v.number(),
    evidenceScore: v.number(),
    originalityScore: v.number(),
    transcript: v.optional(v.any()), // Array of {role, content}
  })
    .index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "date"])
    .index("by_date", ["date"]),

  // ─── Weakness Profiles (adaptive AI) ─────────────────────────────────────────
  weaknessProfiles: defineTable({
    userId: v.id("users"),
    logicAvg: v.number(),
    evidenceAvg: v.number(),
    originalityAvg: v.number(),
    totalDebates: v.number(),
    commonWeaknesses: v.string(),   // JSON array string
    objectionFailures: v.string(),  // JSON object string
    fallacyHits: v.string(),        // JSON object string
  }).index("by_userId", ["userId"]),

  // ─── HvH Rooms ──────────────────────────────────────────────────────────────
  rooms: defineTable({
    roomCode: v.string(),
    topic: v.string(),
    status: v.union(
      v.literal("waiting"),
      v.literal("active"),
      v.literal("finished")
    ),
    hostId: v.string(),
    isPublic: v.boolean(),
    // Players — parallel arrays (max 2)
    playerIds: v.array(v.string()),
    playerNames: v.array(v.string()),
    playerStances: v.array(v.string()),
    spectatorCount: v.number(),
  })
    .index("by_roomCode", ["roomCode"])
    .index("by_status", ["status"])
    .index("by_isPublic_status", ["isPublic", "status"]),

  // ─── Room Messages ──────────────────────────────────────────────────────────
  roomMessages: defineTable({
    roomId: v.id("rooms"),
    playerId: v.string(),
    playerName: v.string(),
    playerIndex: v.number(),
    text: v.string(),
  }).index("by_roomId", ["roomId"]),

  // ─── Room AI Analyses ───────────────────────────────────────────────────────
  roomAnalyses: defineTable({
    roomId: v.id("rooms"),
    round: v.number(),
    player1: v.object({
      logic: v.number(),
      evidence: v.number(),
      originality: v.number(),
      feedback: v.string(),
    }),
    player2: v.object({
      logic: v.number(),
      evidence: v.number(),
      originality: v.number(),
      feedback: v.string(),
    }),
    roundWinner: v.string(),
    momentum: v.string(),
    keyInsight: v.string(),
  }).index("by_roomId", ["roomId"]),

  // ─── Daily Topics ──────────────────────────────────────────────────────────
  dailyTopics: defineTable({
    date: v.string(), // "YYYY-MM-DD"
    topic: v.string(),
  }).index("by_date", ["date"]),
});

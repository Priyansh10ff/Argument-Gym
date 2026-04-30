import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ─── Get or Create User ────────────────────────────────────────────────────────
export const getOrCreateUser = mutation({
  args: {
    guestId: v.optional(v.string()),
    name: v.optional(v.string()),
    tokenIdentifier: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Google-authenticated user
    if (args.tokenIdentifier) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", args.tokenIdentifier!)
        )
        .unique();
      if (existing) {
        // Update name/email if changed
        if (args.name || args.email) {
          await ctx.db.patch(existing._id, {
            ...(args.name ? { name: args.name } : {}),
            ...(args.email ? { email: args.email } : {}),
            ...(args.image ? { image: args.image } : {}),
          });
        }
        return existing;
      }
      const id = await ctx.db.insert("users", {
        name: args.name || "Anonymous",
        email: args.email,
        image: args.image,
        authType: "google",
        tokenIdentifier: args.tokenIdentifier,
        elo: 1200,
        wins: 0,
        losses: 0,
        draws: 0,
        streak: 0,
        bestStreak: 0,
        totalDebates: 0,
        achievements: [],
      });
      return await ctx.db.get(id);
    }

    // Guest user
    if (args.guestId) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_guestId", (q) => q.eq("guestId", args.guestId!))
        .unique();
      if (existing) {
        if (args.name && args.name !== existing.name) {
          await ctx.db.patch(existing._id, { name: args.name });
        }
        return existing;
      }
      const id = await ctx.db.insert("users", {
        name: args.name || "Anonymous",
        authType: "guest",
        guestId: args.guestId,
        elo: 1200,
        wins: 0,
        losses: 0,
        draws: 0,
        streak: 0,
        bestStreak: 0,
        totalDebates: 0,
        achievements: [],
      });
      return await ctx.db.get(id);
    }

    throw new Error("Either guestId or tokenIdentifier is required");
  },
});

// ─── Get User Stats ─────────────────────────────────────────────────────────
export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const history = await ctx.db
      .query("debates")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20);

    // Calculate rank
    const allUsers = await ctx.db.query("users").collect();
    const rank = allUsers.filter((u) => u.elo > user.elo).length + 1;

    return { ...user, history, rank };
  },
});

// ─── Get User by Guest ID ───────────────────────────────────────────────────
export const getUserByGuestId = query({
  args: { guestId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_guestId", (q) => q.eq("guestId", args.guestId))
      .unique();
  },
});

// ─── Update ELO ─────────────────────────────────────────────────────────────
export const updateElo = mutation({
  args: {
    userId: v.id("users"),
    verdict: v.string(),
    scores: v.optional(
      v.object({
        logic: v.number(),
        evidence: v.number(),
        originality: v.number(),
      })
    ),
    topic: v.string(),
    mode: v.string(),
    transcript: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const K = args.mode === "brutal" ? 32 : args.mode === "rigorous" ? 24 : 16;
    const aiElo =
      args.mode === "brutal" ? 2000 : args.mode === "rigorous" ? 1700 : 1400;
    const expect = 1 / (1 + Math.pow(10, (aiElo - user.elo) / 400));
    const actual =
      args.verdict === "Won" ? 1 : args.verdict === "Draw" ? 0.5 : 0;
    const delta = Math.round(K * (actual - expect));
    const newElo = Math.max(100, user.elo + delta);

    const newWins = user.wins + (args.verdict === "Won" ? 1 : 0);
    const newLosses = user.losses + (args.verdict === "Lost" ? 1 : 0);
    const newDraws = user.draws + (args.verdict === "Draw" ? 1 : 0);
    const newStreak = args.verdict === "Won" ? user.streak + 1 : 0;
    const newBest = Math.max(user.bestStreak, newStreak);
    const totalDebates = user.totalDebates + 1;

    const currentAchievements = user.achievements || [];
    const newAchievements = [...currentAchievements];

    if (!newAchievements.includes("Flawless Victory") && args.scores?.logic === 10 && args.verdict === "Won") {
      newAchievements.push("Flawless Victory");
    }
    if (!newAchievements.includes("Unstoppable") && newStreak >= 10) {
      newAchievements.push("Unstoppable");
    }
    if (!newAchievements.includes("Veteran") && totalDebates >= 10) {
      newAchievements.push("Veteran");
    }

    await ctx.db.patch(args.userId, {
      elo: newElo,
      wins: newWins,
      losses: newLosses,
      draws: newDraws,
      streak: newStreak,
      bestStreak: newBest,
      totalDebates,
      achievements: newAchievements,
    });

    const today = new Date().toISOString().slice(0, 10);
    const debateId = await ctx.db.insert("debates", {
      userId: args.userId,
      date: today,
      eloDelta: delta,
      topic: args.topic,
      verdict: args.verdict,
      mode: args.mode,
      logicScore: args.scores?.logic || 0,
      evidenceScore: args.scores?.evidence || 0,
      originalityScore: args.scores?.originality || 0,
      transcript: args.transcript,
    });

    return { delta, newElo, newStreak, debateId: debateId };
  },
});

// ─── Leaderboard ────────────────────────────────────────────────────────────
export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    // Global — top 50 by ELO
    const topUsers = await ctx.db
      .query("users")
      .withIndex("by_elo")
      .order("desc")
      .take(50);

    const global = topUsers.map((u) => ({
        id: u._id,
        name: u.name || "Anonymous",
        elo: u.elo,
        wins: u.wins,
        losses: u.losses,
        draws: u.draws,
        streak: u.streak,
        bestStreak: u.bestStreak,
        totalDebates: u.totalDebates,
        authType: u.authType,
      }));

    // Daily — top 50 by delta today
    const today = new Date().toISOString().slice(0, 10);
    const todayDebates = await ctx.db
      .query("debates")
      .withIndex("by_date", (q) => q.eq("date", today))
      .collect();

    const dailyMap = new Map<
      string,
      { userId: Id<"users">; delta: number; count: number }
    >();
    for (const d of todayDebates) {
      const key = d.userId;
      const existing = dailyMap.get(key);
      if (existing) {
        existing.delta += d.eloDelta;
        existing.count += 1;
      } else {
        dailyMap.set(key, { userId: d.userId, delta: d.eloDelta, count: 1 });
      }
    }

    const dailyEntries = Array.from(dailyMap.values())
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 50);

    const daily = await Promise.all(
      dailyEntries.map(async (entry) => {
        const user = await ctx.db.get(entry.userId);
        return {
          id: entry.userId,
          name: user?.name || "Anonymous",
          elo: user?.elo || 1200,
          daily_delta: entry.delta,
          daily_debates: entry.count,
        };
      })
    );

    return { global, daily };
  },
});

// ─── Merge Guest to Google ──────────────────────────────────────────────────
export const mergeGuestToGoogle = mutation({
  args: {
    guestId: v.string(),
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const guest = await ctx.db
      .query("users")
      .withIndex("by_guestId", (q) => q.eq("guestId", args.guestId))
      .unique();

    const google = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier)
      )
      .unique();

    if (guest && !google) {
      // Convert guest to Google account
      await ctx.db.patch(guest._id, {
        authType: "google",
        tokenIdentifier: args.tokenIdentifier,
        name: args.name || guest.name,
        email: args.email,
        image: args.image,
      });
      return guest;
    }

    if (google && guest && google._id !== guest._id) {
      // Merge guest stats into Google account
      await ctx.db.patch(google._id, {
        elo: Math.max(google.elo, guest.elo),
        wins: google.wins + guest.wins,
        losses: google.losses + guest.losses,
        draws: google.draws + guest.draws,
        streak: Math.max(google.streak, guest.streak),
        bestStreak: Math.max(google.bestStreak, guest.bestStreak),
        totalDebates: google.totalDebates + guest.totalDebates,
      });
      // Transfer debate history
      const guestDebates = await ctx.db
        .query("debates")
        .withIndex("by_userId", (q) => q.eq("userId", guest._id))
        .collect();
      for (const debate of guestDebates) {
        await ctx.db.patch(debate._id, { userId: google._id });
      }
      // Transfer weakness profile
      const guestWp = await ctx.db
        .query("weaknessProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", guest._id))
        .unique();
      if (guestWp) {
        const googleWp = await ctx.db
          .query("weaknessProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", google._id))
          .unique();
        if (!googleWp) {
          await ctx.db.patch(guestWp._id, { userId: google._id });
        } else {
          await ctx.db.delete(guestWp._id);
        }
      }
      // Delete the guest user
      await ctx.db.delete(guest._id);
      return google;
    }

    return google || guest;
  },
});

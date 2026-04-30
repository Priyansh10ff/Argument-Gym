import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Get Weakness Profile ───────────────────────────────────────────────────
export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("weaknessProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

// ─── Update Weakness Profile ────────────────────────────────────────────────
export const update = mutation({
  args: {
    userId: v.id("users"),
    scores: v.optional(
      v.object({
        logic: v.number(),
        evidence: v.number(),
        originality: v.number(),
      })
    ),
    weaknesses: v.optional(v.array(v.string())),
    overallFeedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("weaknessProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    // Detect fallacies from feedback
    const fallacyKeywords = [
      "ad hominem",
      "straw man",
      "slippery slope",
      "false dichotomy",
      "appeal to authority",
      "circular",
      "hasty generalization",
      "red herring",
      "anecdotal",
    ];
    const feedbackText = (
      (args.weaknesses || []).join(" ") +
      " " +
      (args.overallFeedback || "")
    ).toLowerCase();
    const foundFallacies = fallacyKeywords.filter((f) =>
      feedbackText.includes(f)
    );

    if (!existing) {
      const fallacyMap: Record<string, number> = {};
      foundFallacies.forEach((f) => {
        fallacyMap[f] = 1;
      });
      await ctx.db.insert("weaknessProfiles", {
        userId: args.userId,
        logicAvg: args.scores?.logic || 5,
        evidenceAvg: args.scores?.evidence || 5,
        originalityAvg: args.scores?.originality || 5,
        totalDebates: 1,
        commonWeaknesses: JSON.stringify(
          (args.weaknesses || []).slice(0, 5)
        ),
        objectionFailures: "{}",
        fallacyHits: JSON.stringify(fallacyMap),
      });
    } else {
      const n = existing.totalDebates;
      const newN = n + 1;
      const logAvg =
        (existing.logicAvg * n + (args.scores?.logic || 5)) / newN;
      const evAvg =
        (existing.evidenceAvg * n + (args.scores?.evidence || 5)) / newN;
      const orAvg =
        (existing.originalityAvg * n + (args.scores?.originality || 5)) /
        newN;

      const oldW: string[] = JSON.parse(existing.commonWeaknesses || "[]");
      const newW = [
        ...new Set([...(args.weaknesses || []).slice(0, 3), ...oldW]),
      ].slice(0, 8);

      const oldF: Record<string, number> = JSON.parse(
        existing.fallacyHits || "{}"
      );
      foundFallacies.forEach((f) => {
        oldF[f] = (oldF[f] || 0) + 1;
      });

      await ctx.db.patch(existing._id, {
        logicAvg: logAvg,
        evidenceAvg: evAvg,
        originalityAvg: orAvg,
        totalDebates: newN,
        commonWeaknesses: JSON.stringify(newW),
        fallacyHits: JSON.stringify(oldF),
      });
    }
  },
});

// ─── Record Failed Objection (Sales Mode) ───────────────────────────────────
export const recordFailedObjection = mutation({
  args: {
    userId: v.id("users"),
    objection: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("weaknessProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (!existing) return;

    const failures: Record<string, number> = JSON.parse(
      existing.objectionFailures || "{}"
    );
    failures[args.objection] = (failures[args.objection] || 0) + 1;

    await ctx.db.patch(existing._id, {
      objectionFailures: JSON.stringify(failures),
    });
  },
});

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getDailyTopic = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().slice(0, 10);
    const daily = await ctx.db
      .query("dailyTopics")
      .withIndex("by_date", (q) => q.eq("date", today))
      .unique();
    
    if (daily) return daily.topic;
    
    // Default fallback topics if no daily is set yet
    const fallbacks = [
      "Artificial Intelligence will eventually replace all creative professions.",
      "Universal Basic Income is the only solution to automation.",
      "Social Media has done more harm than good for teenage mental health.",
      "The colonization of Mars should be a priority for humanity.",
      "Remote work is more productive than in-office work for most industries."
    ];
    // Semi-random based on date
    const index = new Date().getDate() % fallbacks.length;
    return fallbacks[index];
  },
});

// Admin mutation to set daily topic
export const setDailyTopic = mutation({
  args: { topic: v.string() },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().slice(0, 10);
    const existing = await ctx.db
      .query("dailyTopics")
      .withIndex("by_date", (q) => q.eq("date", today))
      .unique();
    
    if (existing) {
      await ctx.db.patch(existing._id, { topic: args.topic });
    } else {
      await ctx.db.insert("dailyTopics", { date: today, topic: args.topic });
    }
  },
});

import { query } from "./_generated/server";
import { v } from "convex/values";

export const getReplay = query({
  args: { debateId: v.id("debates") },
  handler: async (ctx, args) => {
    const debate = await ctx.db.get(args.debateId);
    if (!debate) return null;

    const user = await ctx.db.get(debate.userId);

    return {
      ...debate,
      userName: user?.name || "Anonymous",
      userImage: user?.image || null,
    };
  },
});

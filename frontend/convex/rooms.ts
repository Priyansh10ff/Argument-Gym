import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Create Room ────────────────────────────────────────────────────────────
export const createRoom = mutation({
  args: {
    topic: v.string(),
    hostId: v.string(),
    hostName: v.string(),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Generate 8-char room code
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let roomCode = "";
    for (let i = 0; i < 8; i++) {
      roomCode += chars[Math.floor(Math.random() * chars.length)];
    }

    const roomId = await ctx.db.insert("rooms", {
      roomCode,
      topic: args.topic,
      status: "waiting",
      hostId: args.hostId,
      isPublic: args.isPublic,
      playerIds: [args.hostId],
      playerNames: [args.hostName],
      playerStances: ["for"],
      spectatorCount: 0,
    });

    return { roomId, roomCode };
  },
});

// ─── Join Room ──────────────────────────────────────────────────────────────
export const joinRoom = mutation({
  args: {
    roomCode: v.string(),
    playerId: v.string(),
    playerName: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_roomCode", (q) =>
        q.eq("roomCode", args.roomCode.toUpperCase())
      )
      .unique();

    if (!room) throw new Error("Room not found");

    // Already in room
    if (room.playerIds.includes(args.playerId)) {
      return room;
    }

    if (room.playerIds.length >= 2) {
      throw new Error("Room is full");
    }

    const newPlayerIds = [...room.playerIds, args.playerId];
    const newPlayerNames = [...room.playerNames, args.playerName];
    const newPlayerStances = [...room.playerStances, "against"];

    const updates: any = {
      playerIds: newPlayerIds,
      playerNames: newPlayerNames,
      playerStances: newPlayerStances,
    };

    // Auto-start when 2 players
    if (newPlayerIds.length === 2) {
      updates.status = "active";
    }

    await ctx.db.patch(room._id, updates);
    return await ctx.db.get(room._id);
  },
});

// ─── Get Room by Code ───────────────────────────────────────────────────────
export const getRoomByCode = query({
  args: { roomCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rooms")
      .withIndex("by_roomCode", (q) =>
        q.eq("roomCode", args.roomCode.toUpperCase())
      )
      .unique();
  },
});

// ─── Get Room by ID (reactive) ──────────────────────────────────────────────
export const getRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.roomId);
  },
});

// ─── Public Lobby ───────────────────────────────────────────────────────────
export const getPublicLobby = query({
  args: {},
  handler: async (ctx) => {
    const allRooms = await ctx.db.query("rooms").collect();

    // Return public rooms that are waiting or active, sorted by creation time
    return allRooms
      .filter(
        (r) =>
          r.isPublic && (r.status === "waiting" || r.status === "active")
      )
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 50)
      .map((r) => ({
        _id: r._id,
        roomCode: r.roomCode,
        topic: r.topic,
        status: r.status,
        playerCount: r.playerIds.length,
        playerNames: r.playerNames,
        spectatorCount: r.spectatorCount,
        createdAt: r._creationTime,
      }));
  },
});

// ─── Add Message ────────────────────────────────────────────────────────────
export const addMessage = mutation({
  args: {
    roomId: v.id("rooms"),
    playerId: v.string(),
    playerName: v.string(),
    playerIndex: v.number(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("roomMessages", {
      roomId: args.roomId,
      playerId: args.playerId,
      playerName: args.playerName,
      playerIndex: args.playerIndex,
      text: args.text,
    });
  },
});

// ─── Get Messages (reactive) ────────────────────────────────────────────────
export const getMessages = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("roomMessages")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .collect();
  },
});

// ─── Add AI Analysis ────────────────────────────────────────────────────────
export const addAnalysis = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("roomAnalyses", args);
  },
});

// ─── Get Analyses (reactive) ────────────────────────────────────────────────
export const getAnalyses = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("roomAnalyses")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .collect();
  },
});

// ─── Update Room Status ─────────────────────────────────────────────────────
export const updateStatus = mutation({
  args: {
    roomId: v.id("rooms"),
    status: v.union(
      v.literal("waiting"),
      v.literal("active"),
      v.literal("finished")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, { status: args.status });
  },
});

// ─── Spectator Management ───────────────────────────────────────────────────
export const addSpectator = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (room) {
      await ctx.db.patch(args.roomId, {
        spectatorCount: room.spectatorCount + 1,
      });
    }
  },
});

export const removeSpectator = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (room) {
      await ctx.db.patch(args.roomId, {
        spectatorCount: Math.max(0, room.spectatorCount - 1),
      });
    }
  },
});

// ─── Get Message Count (for triggering AI monitor) ──────────────────────────
export const getMessageCount = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const msgs = await ctx.db
      .query("roomMessages")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .collect();
    return msgs.length;
  },
});

// ─── Scheduled: abandon rooms older than 3 hours ────────────────────────────
export const abandonExpiredRooms = internalMutation({
  handler: async (ctx) => {
    const cutoff = Date.now() - 3 * 60 * 60 * 1000; // 3 hours ago
    const stale = await ctx.db
      .query("rooms")
      .filter(q =>
        q.and(
          q.neq(q.field("status"), "finished"),
          q.neq(q.field("status"), "abandoned"),
          q.lt(q.field("_creationTime"), cutoff),
        )
      )
      .collect();

    for (const room of stale) {
      await ctx.db.patch(room._id, { status: "abandoned" });
    }

    return { abandoned: stale.length };
  },
});

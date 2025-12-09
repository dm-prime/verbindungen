import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Record a completed game
export const recordGame = mutation({
  args: {
    userId: v.id("users"),
    boardId: v.id("boards"),
    won: v.boolean(),
    attempts: v.number(),
    selectedGroups: v.array(
      v.object({
        words: v.array(v.string()),
        correct: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Check if user already played this board
    const existingGame = await ctx.db
      .query("gameHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("boardId"), args.boardId))
      .first();

    if (existingGame) {
      throw new Error("Already played this board");
    }

    const historyId = await ctx.db.insert("gameHistory", {
      userId: args.userId,
      boardId: args.boardId,
      playedAt: Date.now(),
      won: args.won,
      attempts: args.attempts,
      selectedGroups: args.selectedGroups,
    });

    return historyId;
  },
});

// Get user's game history with board details
export const getUserHistory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("gameHistory")
      .withIndex("by_user_and_played_at", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Fetch board details for each game
    const historyWithBoards = await Promise.all(
      history.map(async (game) => {
        const board = await ctx.db.get(game.boardId);
        return {
          ...game,
          board: board
            ? {
                _id: board._id,
                date: board.date,
                groups: board.groups,
              }
            : null,
        };
      })
    );

    return historyWithBoards;
  },
});

// Check if user has played a specific board
export const hasPlayedBoard = query({
  args: { userId: v.id("users"), boardId: v.id("boards") },
  handler: async (ctx, args) => {
    const existingGame = await ctx.db
      .query("gameHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("boardId"), args.boardId))
      .first();

    return existingGame !== null;
  },
});

// Get specific game result
export const getGameResult = query({
  args: { userId: v.id("users"), boardId: v.id("boards") },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("gameHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("boardId"), args.boardId))
      .first();

    if (!game) {
      return null;
    }

    const board = await ctx.db.get(args.boardId);

    return {
      ...game,
      board: board
        ? {
            _id: board._id,
            date: board.date,
            groups: board.groups,
          }
        : null,
    };
  },
});

// Get list of board IDs user has played
export const getPlayedBoardIds = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("gameHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return history.map((game) => game.boardId);
  },
});

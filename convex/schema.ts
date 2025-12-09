import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  boards: defineTable({
    words: v.array(v.string()),
    groups: v.array(
      v.object({
        name: v.string(),
        words: v.array(v.string()),
        difficulty: v.union(
          v.literal("easy"),
          v.literal("medium"),
          v.literal("hard"),
          v.literal("very-hard")
        ),
      })
    ),
    date: v.optional(v.string()),
    isPastPool: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_date", ["date"])
    .index("by_past_pool", ["isPastPool"]),

  users: defineTable({
    authToken: v.string(),
    email: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_auth_token", ["authToken"])
    .index("by_email", ["email"]),

  gameHistory: defineTable({
    userId: v.id("users"),
    boardId: v.id("boards"),
    playedAt: v.number(),
    won: v.boolean(),
    attempts: v.number(),
    selectedGroups: v.array(
      v.object({
        words: v.array(v.string()),
        correct: v.boolean(),
      })
    ),
  })
    .index("by_user", ["userId"])
    .index("by_board", ["boardId"])
    .index("by_user_and_played_at", ["userId", "playedAt"]),

  admins: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
});




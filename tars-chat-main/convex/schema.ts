import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    image: v.string(),
    isOnline: v.boolean(),
  }).index("by_clerkId", ["clerkId"]),

  conversations: defineTable({
    name: v.string(),
    members: v.array(v.string()), // Clerk IDs
    isGroup: v.boolean(),
  }),

  messages: defineTable({
    conversationId: v.id("conversations"), // ✅ Correct type
    senderId: v.string(),
    text: v.string(),
    createdAt: v.number(),
    isDeleted: v.boolean(),
    reactions: v.optional(
      v.array(
        v.object({
          userId: v.string(),
          emoji: v.string(),
        })
      )
    ),
  }).index("by_conversation", ["conversationId"]),
});
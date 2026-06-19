import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"), // ✅ FIXED
    senderId: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      ...args,
      createdAt: Date.now(),
      isDeleted: false,
      reactions: [],
    });
  },
});

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, { conversationId }) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId)
      )
      .collect();
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, { messageId }) => {
    await ctx.db.patch(messageId, {
      isDeleted: true,
      text: "This message was deleted",
    });
  },
});

export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { messageId, emoji, userId }) => {
    const message = await ctx.db.get(messageId);
    if (!message) return;

    const reactions = message.reactions ?? [];

    const existing = reactions.find(
      (r) => r.userId === userId && r.emoji === emoji
    );

    let updated;

    if (existing) {
      updated = reactions.filter(
        (r) => !(r.userId === userId && r.emoji === emoji)
      );
    } else {
      updated = [...reactions, { userId, emoji }];
    }

    await ctx.db.patch(messageId, { reactions: updated });
  },
});
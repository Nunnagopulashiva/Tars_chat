import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createConversation = mutation({
  args: {
    name: v.string(),
    members: v.array(v.string()),
    isGroup: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversations", args);
  },
});

export const getUserConversations = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const conversations = await ctx.db
      .query("conversations")
      .collect();

    // Filter manually because members is an array
    return conversations.filter((conv) =>
      conv.members.includes(userId)
    );
  },
});
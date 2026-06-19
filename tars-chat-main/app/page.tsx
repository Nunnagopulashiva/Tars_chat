"use client";

import { useState, useEffect, useRef } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function Home() {
  const { user } = useUser();

  /* ================= STATE ================= */

  const [selectedConversation, setSelectedConversation] =
    useState<Id<"conversations"> | null>(null);

  const [message, setMessage] = useState("");
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  /* ================= QUERIES ================= */

  const conversations = useQuery(
    api.conversations.getUserConversations,
    user ? { userId: user.id } : "skip"
  );

  const users = useQuery(api.users.getUsers);

  const messages = useQuery(
    api.messages.getMessages,
    selectedConversation
      ? { conversationId: selectedConversation }
      : "skip"
  );

  /* ================= MUTATIONS ================= */

  const createConversation = useMutation(
    api.conversations.createConversation
  );

  const sendMessage = useMutation(api.messages.sendMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const toggleReaction = useMutation(api.messages.toggleReaction);

  /* ================= AUTO SELECT FIRST ================= */

  useEffect(() => {
    if (
      conversations &&
      conversations.length > 0 &&
      !selectedConversation
    ) {
      setSelectedConversation(conversations[0]._id);
    }
  }, [conversations]);

  /* ================= AUTO SCROLL ================= */

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!messages) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  /* ================= SEND MESSAGE ================= */

  const handleSend = async () => {
    if (!message.trim() || !selectedConversation || !user) return;

    try {
      setSending(true);

      await sendMessage({
        conversationId: selectedConversation,
        senderId: user.id,
        text: message.trim(),
      });

      setMessage("");
    } catch (error) {
      console.error(error);
      alert("Message failed. Try again.");
    } finally {
      setSending(false);
    }
  };

  /* ================= CREATE GROUP ================= */

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !user || selectedMembers.length === 0) {
      alert("Enter group name and select members.");
      return;
    }

    const conversationId = await createConversation({
      name: groupName.trim(),
      members: [user.id, ...selectedMembers],
      isGroup: true,
    });

    setShowGroupModal(false);
    setGroupName("");
    setSelectedMembers([]);
    setSelectedConversation(conversationId);
  };

  /* ================= UI ================= */

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* SIDEBAR */}
      <div className="w-80 border-r border-gray-800 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Conversations</h2>
          <button
            onClick={() => setShowGroupModal(true)}
            className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
          >
            + Group
          </button>
        </div>

        {!conversations && (
          <div className="text-gray-500 text-sm">Loading...</div>
        )}

        {conversations?.length === 0 && (
          <div className="text-gray-500 text-sm">
            No conversations yet.
          </div>
        )}

        {conversations?.map((conv) => (
          <div
            key={conv._id}
            onClick={() => setSelectedConversation(conv._id)}
            className={`cursor-pointer p-3 rounded mb-2 transition ${
              selectedConversation === conv._id
                ? "bg-gray-700"
                : "hover:bg-gray-800"
            }`}
          >
            <div className="font-medium">{conv.name}</div>

            {conv.isGroup && (
              <div className="text-xs text-gray-400">
                {conv.members.length} members
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Tars Chat</h1>
          <UserButton />
        </div>

        {/* MESSAGES */}
<div className="flex-1 overflow-y-auto border border-gray-800 rounded p-4 mb-4">
  {!selectedConversation && (
    <div className="text-gray-500 text-center mt-10">
      Select a conversation
    </div>
  )}

  {messages?.map((m) => {
    const grouped: Record<string, number> = {};

    if (m.reactions) {
      m.reactions.forEach((r) => {
        grouped[r.emoji] = (grouped[r.emoji] || 0) + 1;
      });
    }

    return (
      <div
        key={m._id}
        className={`mb-3 ${
          m.senderId === user?.id ? "text-right" : "text-left"
        }`}
      >
        <div
          className={`inline-block px-4 py-2 rounded-lg max-w-xs break-words ${
            m.senderId === user?.id
              ? "bg-blue-600"
              : "bg-gray-700"
          }`}
        >
          {m.isDeleted ? (
            <div className="italic text-gray-300">
              This message was deleted
            </div>
          ) : (
            <>
              <div>{m.text}</div>

              <div className="text-xs text-gray-300 mt-1">
                {new Date(m.createdAt).toLocaleTimeString()}
              </div>

              {m.senderId === user?.id && (
                <button
                  onClick={() =>
                    deleteMessage({ messageId: m._id })
                  }
                  className="text-xs text-red-400 mt-1"
                >
                  Delete
                </button>
              )}

              {/* Reactions */}
              <div className="flex gap-2 mt-2">
                {["👍", "❤️", "😂", "😮", "😢"].map(
                  (emoji) => (
                    <button
                      key={emoji}
                      onClick={() =>
                        toggleReaction({
                          messageId: m._id,
                          emoji,
                          userId: user!.id,
                        })
                      }
                      className="hover:scale-110 transition"
                    >
                      {emoji}
                    </button>
                  )
                )}
              </div>

              {/* Reaction Counts */}
              {Object.keys(grouped).length > 0 && (
                <div className="flex gap-2 mt-1 text-xs">
                  {Object.entries(grouped).map(
                    ([emoji, count]) => (
                      <span
                        key={emoji}
                        className="bg-gray-800 px-2 py-1 rounded"
                      >
                        {emoji} {count}
                      </span>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  })}

  <div ref={bottomRef} />
</div>
        {/* INPUT */}
        {selectedConversation && (
          <div className="flex gap-2">
            <input
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              disabled={sending}
              className="flex-1 p-2 rounded bg-gray-900 border border-gray-700 outline-none"
              placeholder="Type message..."
            />
            <button
              onClick={handleSend}
              disabled={sending}
              className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        )}
      </div>

      {/* GROUP MODAL */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded w-96">
            <h3 className="text-lg font-bold mb-4">
              Create Group
            </h3>

            <input
              placeholder="Group name"
              value={groupName}
              onChange={(e) =>
                setGroupName(e.target.value)
              }
              className="w-full p-2 mb-4 rounded bg-gray-800 border border-gray-700"
            />

            <div className="max-h-40 overflow-y-auto mb-4">
              {users
                ?.filter(
                  (u) => u.clerkId !== user?.id
                )
                .map((u) => (
                  <label
                    key={u._id}
                    className="block text-sm"
                  >
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMembers(
                            (prev) => [
                              ...prev,
                              u.clerkId,
                            ]
                          );
                        } else {
                          setSelectedMembers(
                            (prev) =>
                              prev.filter(
                                (id) =>
                                  id !== u.clerkId
                              )
                          );
                        }
                      }}
                    />
                    <span className="ml-2">
                      {u.name}
                    </span>
                  </label>
                ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() =>
                  setShowGroupModal(false)
                }
                className="text-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                className="bg-blue-600 px-3 py-1 rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
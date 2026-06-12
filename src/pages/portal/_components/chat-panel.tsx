import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,
  X,
  ArrowLeft,
  Send,
  User,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { formatDistanceToNow } from "date-fns";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

type ContactUser = {
  _id: Id<"users">;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
};

function UserAvatar({ name, avatarUrl, size = "md" }: { name: string; avatarUrl: string | null; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-8 h-8 text-[10px]" : "w-10 h-10 text-xs";
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold overflow-hidden shrink-0",
        dim,
        avatarUrl ? "" : "bg-[#1B4332] text-white",
      )}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <User className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      )}
    </div>
  );
}

/** Conversation list view */
function ConversationList({
  onSelectConversation,
  onNewMessage,
}: {
  onSelectConversation: (convId: Id<"conversations">, other: { name: string; avatarUrl: string | null }) => void;
  onNewMessage: () => void;
}) {
  const conversations = useQuery(api.messaging.listConversations);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-bold text-popover-foreground">Messages</h3>
        <button
          onClick={onNewMessage}
          className="text-[11px] font-medium text-[#1B4332] dark:text-emerald-400 hover:underline cursor-pointer"
        >
          New message
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations === undefined ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MessageCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No conversations yet</p>
            <button
              onClick={onNewMessage}
              className="mt-3 text-xs font-medium text-[#1B4332] dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Start a conversation
            </button>
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv._id}
              onClick={() =>
                onSelectConversation(conv._id, {
                  name: conv.otherUser?.name ?? "Unknown",
                  avatarUrl: conv.otherUser?.avatarUrl ?? null,
                })
              }
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-accent transition-colors cursor-pointer border-b border-border/50 last:border-b-0"
            >
              <UserAvatar
                name={conv.otherUser?.name ?? "?"}
                avatarUrl={conv.otherUser?.avatarUrl ?? null}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-popover-foreground truncate">
                    {conv.otherUser?.name ?? "Unknown"}
                  </p>
                  <span className="text-[10px] text-muted-foreground/70 shrink-0">
                    {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {conv.lastMessagePreview || "No messages yet"}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/** Contact picker for new conversations */
function ContactPicker({
  onBack,
  onSelectUser,
}: {
  onBack: () => void;
  onSelectUser: (user: ContactUser) => void;
}) {
  const contacts = useQuery(api.messaging.listContactableUsers);
  const [search, setSearch] = useState("");

  const filtered = contacts?.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <button onClick={onBack} className="p-1 hover:bg-accent rounded cursor-pointer">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <h3 className="text-sm font-bold text-popover-foreground">New message</h3>
      </div>

      <div className="px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="bg-transparent text-sm flex-1 outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered === undefined ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No contacts found</p>
        ) : (
          filtered.map((u) => (
            <button
              key={u._id}
              onClick={() => onSelectUser(u)}
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-accent transition-colors cursor-pointer border-b border-border/50 last:border-b-0"
            >
              <UserAvatar name={u.name} avatarUrl={u.avatarUrl} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-popover-foreground truncate">{u.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
              </div>
              <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#1B4332]/10 text-[#1B4332] dark:bg-[#1B4332]/30 dark:text-emerald-300 capitalize shrink-0">
                {u.role}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/** Chat thread view */
function ChatThread({
  conversationId,
  otherName,
  otherAvatarUrl,
  onBack,
}: {
  conversationId: Id<"conversations">;
  otherName: string;
  otherAvatarUrl: string | null;
  onBack: () => void;
}) {
  const messages = useQuery(api.messaging.getMessages, { conversationId });
  const sendMessage = useMutation(api.messaging.sendMessage);
  const markRead = useMutation(api.messaging.markConversationRead);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const profile = useQuery(api.profile.getMyProfile);

  // Mark conversation as read when opened and when new messages arrive
  useEffect(() => {
    markRead({ conversationId });
  }, [conversationId, markRead, messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText("");
    try {
      await sendMessage({ conversationId, text: trimmed });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [text, sending, conversationId, sendMessage]);

  const myId = profile?._id;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={onBack} className="p-1 hover:bg-accent rounded cursor-pointer">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <UserAvatar name={otherName} avatarUrl={otherAvatarUrl} size="sm" />
        <p className="text-sm font-semibold text-popover-foreground truncate">{otherName}</p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages === undefined ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === myId;
            return (
              <div key={msg._id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                    isMine
                      ? "bg-[#1B4332] text-white rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md",
                  )}
                >
                  <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                  <p
                    className={cn(
                      "text-[10px] mt-1",
                      isMine ? "text-white/60" : "text-muted-foreground/70",
                    )}
                  >
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-muted rounded-lg px-3.5 py-2.5 text-sm outline-none text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#1B4332]/20"
          />
          <button
            onClick={handleSend}
            disabled={sending || text.trim().length === 0}
            className={cn(
              "p-2.5 rounded-lg transition-colors cursor-pointer",
              text.trim().length > 0
                ? "bg-[#1B4332] text-white hover:bg-[#143B28]"
                : "bg-muted text-muted-foreground/40",
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

type PanelView =
  | { screen: "list" }
  | { screen: "contacts" }
  | { screen: "chat"; conversationId: Id<"conversations">; otherName: string; otherAvatarUrl: string | null };

export default function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<PanelView>({ screen: "list" });
  const panelRef = useRef<HTMLDivElement>(null);
  const getOrCreate = useMutation(api.messaging.getOrCreateConversation);
  const unreadCount = useQuery(api.messaging.getUnreadCount);

  // Listen for "open-chat-panel" custom event (fired by notification bell)
  useEffect(() => {
    function handleOpenChat() {
      setOpen(true);
      setView({ screen: "list" });
    }
    window.addEventListener("open-chat-panel", handleOpenChat);
    return () => window.removeEventListener("open-chat-panel", handleOpenChat);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelectUser = async (user: ContactUser) => {
    const convId = await getOrCreate({ otherUserId: user._id });
    setView({
      screen: "chat",
      conversationId: convId,
      otherName: user.name,
      otherAvatarUrl: user.avatarUrl,
    });
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Chat icon button */}
      <button
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) setView({ screen: "list" });
        }}
        className="relative p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer"
        aria-label="Messages"
      >
        <MessageCircle className="w-5 h-5 text-foreground" />
        {(unreadCount ?? 0) > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
            {(unreadCount ?? 0) > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 h-[480px] bg-popover rounded-xl shadow-xl border border-border z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden flex flex-col">
          {/* Close button */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-2.5 right-2.5 p-1 hover:bg-accent rounded z-10 cursor-pointer"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          {view.screen === "list" && (
            <ConversationList
              onSelectConversation={(convId, other) =>
                setView({ screen: "chat", conversationId: convId, otherName: other.name, otherAvatarUrl: other.avatarUrl })
              }
              onNewMessage={() => setView({ screen: "contacts" })}
            />
          )}

          {view.screen === "contacts" && (
            <ContactPicker
              onBack={() => setView({ screen: "list" })}
              onSelectUser={handleSelectUser}
            />
          )}

          {view.screen === "chat" && (
            <ChatThread
              conversationId={view.conversationId}
              otherName={view.otherName}
              otherAvatarUrl={view.otherAvatarUrl}
              onBack={() => setView({ screen: "list" })}
            />
          )}
        </div>
      )}
    </div>
  );
}

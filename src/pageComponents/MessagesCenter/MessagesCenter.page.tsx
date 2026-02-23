"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "~/utils/api";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { useToast } from "~/components/ui/use-toast";
import {
  Send,
  MessageSquare,
  Search,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { cn } from "~/utils/cn";
import { DashboardPageHeader } from "~/components/DashboardPageHeader";

// ---------------------------------------------------------------------------
// Types inferred from the tRPC router return shapes
// ---------------------------------------------------------------------------

type ConversationEvent = {
  id: string;
  title: string | null;
  eventType: string;
  eventDate: string | Date;
  status: string;
};

type ConversationPreviewMessage = {
  id: string;
  content: string;
  senderType: string;
  messageType: string;
  createdAt: string | Date;
};

type Conversation = {
  id: string;
  clientName: string | null;
  clientPhone: string | null;
  status: string;
  unreadOrg: number;
  unreadClient: number;
  lastMessageAt: string | Date | null;
  createdAt: string | Date;
  event: ConversationEvent | null;
  messages: ConversationPreviewMessage[];
};

type Message = {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderType: string;
  messageType: string;
  content: string;
  attachments: unknown;
  isRead: boolean;
  readAt: string | Date | null;
  createdAt: string | Date;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMessageTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return time;
  if (isYesterday) return `Yesterday ${time}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${time}`;
}

function formatEventDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ConversationListItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}) {
  const lastMessage = conversation.messages[0];
  const hasUnread = conversation.unreadOrg > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg transition-all duration-150 border border-transparent",
        "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        isSelected && "bg-primary/8 border-primary/20 shadow-sm",
        hasUnread && !isSelected && "bg-amber-50/60 dark:bg-amber-950/20",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback
            className={cn(
              "text-xs font-semibold",
              hasUnread
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            {getInitials(conversation.clientName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "text-sm truncate",
                hasUnread ? "font-bold text-foreground" : "font-medium text-foreground",
              )}
            >
              {conversation.clientName || "Unknown Client"}
            </span>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
              {formatRelativeTime(conversation.lastMessageAt)}
            </span>
          </div>

          {conversation.event && (
            <div className="flex items-center gap-1 mt-0.5">
              <Calendar className="h-3 w-3 text-muted-foreground/70" />
              <span className="text-xs text-muted-foreground truncate">
                {conversation.event.title || conversation.event.eventType}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mt-1">
            <p
              className={cn(
                "text-xs truncate",
                hasUnread
                  ? "text-foreground font-medium"
                  : "text-muted-foreground",
              )}
            >
              {lastMessage
                ? lastMessage.senderType === "org_member"
                  ? `You: ${lastMessage.content}`
                  : lastMessage.content
                : "No messages yet"}
            </p>
            {hasUnread && (
              <Badge className="h-5 min-w-[20px] px-1.5 text-[10px] bg-primary text-primary-foreground shrink-0">
                {conversation.unreadOrg}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isOutgoing = message.senderType === "org_member";
  const isSystem = message.senderType === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="bg-muted/60 text-muted-foreground text-xs px-3 py-1.5 rounded-full max-w-[80%] text-center">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex mb-2",
        isOutgoing ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm",
          isOutgoing
            ? "bg-[hsl(var(--ember))] text-white rounded-br-md"
            : "bg-[hsl(var(--sand))] text-foreground rounded-bl-md dark:bg-[hsl(var(--sand))]",
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </p>
        <div
          className={cn(
            "flex items-center justify-end gap-1 mt-1",
            isOutgoing ? "text-white/70" : "text-muted-foreground",
          )}
        >
          <span className="text-[10px]">
            {formatMessageTime(message.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[11px] text-muted-foreground font-medium px-2">
        {date}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function groupMessagesByDate(messages: Message[]): { date: string; messages: Message[] }[] {
  const groups: { date: string; messages: Message[] }[] = [];
  let currentDate = "";

  for (const msg of messages) {
    const d = new Date(msg.createdAt);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    let dateLabel: string;
    if (isToday) dateLabel = "Today";
    else if (isYesterday) dateLabel = "Yesterday";
    else dateLabel = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    if (dateLabel !== currentDate) {
      currentDate = dateLabel;
      groups.push({ date: dateLabel, messages: [] });
    }
    groups[groups.length - 1]!.messages.push(msg);
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Empty states
// ---------------------------------------------------------------------------

function EmptyConversations() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 px-6">
      <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mb-4">
        <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">
        No conversations yet
      </h3>
      <p className="text-xs text-muted-foreground text-center max-w-[240px]">
        Messages from clients will appear here. Conversations are created when
        clients send inquiries about events.
      </p>
    </div>
  );
}

function NoConversationSelected() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 px-6">
      <div className="w-20 h-20 rounded-full bg-muted/40 flex items-center justify-center mb-5">
        <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">
        Select a conversation
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-[280px]">
        Choose a conversation from the list to start messaging with your client.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MessagesCenter() {
  const { toast } = useToast();
  const utils = api.useContext();

  // State
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isMobileThreadOpen, setIsMobileThreadOpen] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const prevMessageCountRef = useRef(0);

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  const conversationsQuery = api.messages.listConversations.useQuery(
    { limit: 50 },
    { refetchInterval: 15_000 },
  );

  const conversations = (conversationsQuery.data?.conversations ?? []) as Conversation[];

  const messagesQuery = api.messages.getMessages.useQuery(
    { conversationId: selectedConversationId! },
    {
      enabled: !!selectedConversationId,
      refetchInterval: 10_000,
    },
  );

  const messages = (messagesQuery.data?.messages ?? []) as Message[];

  // The currently selected conversation object
  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId,
  );

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const sendMutation = api.messages.send.useMutation({
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await utils.messages.getMessages.cancel({
        conversationId: variables.conversationId,
      });

      // Snapshot previous data
      const previousMessages = utils.messages.getMessages.getData({
        conversationId: variables.conversationId,
      });

      // Optimistically add the new message
      utils.messages.getMessages.setData(
        { conversationId: variables.conversationId },
        (old) => {
          if (!old) return old;
          const now = new Date();
          const optimisticMessage = {
            id: `optimistic-${Date.now()}`,
            conversationId: variables.conversationId,
            senderId: null,
            senderType: "org_member" as const,
            messageType: (variables.messageType ?? "text") as typeof old.messages[number]["messageType"],
            content: variables.content,
            attachments: [] as unknown as typeof old.messages[number]["attachments"],
            metadata: {} as unknown as typeof old.messages[number]["metadata"],
            isRead: false,
            readAt: null as Date | null,
            createdAt: now,
          };
          return {
            ...old,
            messages: [...old.messages, optimisticMessage],
          };
        },
      );

      return { previousMessages };
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        utils.messages.getMessages.setData(
          { conversationId: variables.conversationId },
          context.previousMessages,
        );
      }
      toast({
        title: "Failed to send",
        description: "Your message could not be sent. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: (_data, _err, variables) => {
      // Refetch to sync with server
      void utils.messages.getMessages.invalidate({
        conversationId: variables.conversationId,
      });
      void utils.messages.listConversations.invalidate();
    },
  });

  const markReadMutation = api.messages.markRead.useMutation({
    onSuccess: () => {
      void utils.messages.listConversations.invalidate();
    },
  });

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const currentCount = messages.length;
    if (currentCount > prevMessageCountRef.current || currentCount === 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: currentCount === 0 ? "auto" : "smooth" });
    }
    prevMessageCountRef.current = currentCount;
  }, [messages.length]);

  // Mark as read when selecting a conversation with unread messages
  useEffect(() => {
    if (selectedConversationId && selectedConversation?.unreadOrg && selectedConversation.unreadOrg > 0) {
      markReadMutation.mutate({ conversationId: selectedConversationId });
    }
    // Only trigger when selectedConversationId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId]);

  // Focus input when conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      // Small delay to let the DOM render
      const timer = setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedConversationId]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSelectConversation = useCallback(
    (id: string) => {
      setSelectedConversationId(id);
      setIsMobileThreadOpen(true);
    },
    [],
  );

  const handleBack = useCallback(() => {
    setIsMobileThreadOpen(false);
    // Delay clearing selected to allow mobile transition
    setTimeout(() => {
      // Don't clear on desktop - keep selected
    }, 200);
  }, []);

  const handleSend = useCallback(() => {
    const content = messageInput.trim();
    if (!content || !selectedConversationId) return;

    sendMutation.mutate({
      conversationId: selectedConversationId,
      content,
      messageType: "text",
    });

    setMessageInput("");
  }, [messageInput, selectedConversationId, sendMutation]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // ---------------------------------------------------------------------------
  // Filtered conversations
  // ---------------------------------------------------------------------------

  const filteredConversations = searchQuery
    ? conversations.filter((c) => {
        const q = searchQuery.toLowerCase();
        return (
          c.clientName?.toLowerCase().includes(q) ||
          c.event?.title?.toLowerCase().includes(q) ||
          c.clientPhone?.includes(q)
        );
      })
    : conversations;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-4">
        <DashboardPageHeader
          title="Messages"
          description="Communicate with clients about their events"
          icon={<MessageSquare className="h-5 w-5" />}
        />
      </div>

      {/* Split panel container */}
      <Card className="flex-1 flex overflow-hidden rounded-xl border">
        {/* ----------------------------------------------------------------- */}
        {/* Left panel: Conversation list                                     */}
        {/* ----------------------------------------------------------------- */}
        <div
          className={cn(
            "w-full md:w-[340px] lg:w-[380px] md:border-r flex flex-col shrink-0",
            // On mobile: hide when thread is open
            isMobileThreadOpen ? "hidden md:flex" : "flex",
          )}
        >
          {/* Search bar */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-muted/40 border-transparent focus-visible:border-primary/30"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {conversationsQuery.isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-muted rounded w-2/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-2.5 bg-muted rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              searchQuery ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <Search className="h-8 w-8 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No conversations matching &quot;{searchQuery}&quot;
                  </p>
                </div>
              ) : (
                <EmptyConversations />
              )
            ) : (
              <div className="p-2 space-y-0.5">
                {filteredConversations.map((conversation) => (
                  <ConversationListItem
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={conversation.id === selectedConversationId}
                    onClick={() => handleSelectConversation(conversation.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Right panel: Message thread                                       */}
        {/* ----------------------------------------------------------------- */}
        <div
          className={cn(
            "flex-1 flex flex-col min-w-0",
            // On mobile: hide when conversation list is shown
            !isMobileThreadOpen ? "hidden md:flex" : "flex",
          )}
        >
          {selectedConversationId && selectedConversation ? (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
                {/* Back button (mobile only) */}
                <button
                  onClick={handleBack}
                  className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-accent transition-colors"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {getInitials(selectedConversation.clientName)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-foreground truncate">
                    {selectedConversation.clientName || "Unknown Client"}
                  </h2>
                  {selectedConversation.event ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground truncate">
                        {selectedConversation.event.title ||
                          selectedConversation.event.eventType}
                      </span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatEventDate(selectedConversation.event.eventDate)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Direct message
                    </span>
                  )}
                </div>

                {selectedConversation.event && (
                  <Badge
                    variant="secondary"
                    className="hidden sm:inline-flex text-[10px] shrink-0 capitalize"
                  >
                    {selectedConversation.event.status}
                  </Badge>
                )}
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {messagesQuery.isLoading ? (
                  <div className="space-y-4 py-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex animate-pulse",
                          i % 2 === 0 ? "justify-start" : "justify-end",
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-2xl h-12 bg-muted",
                            i % 2 === 0 ? "w-[55%]" : "w-[45%]",
                          )}
                        />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12">
                    <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                      <MessageSquare className="h-7 w-7 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                ) : (
                  <>
                    {messageGroups.map((group) => (
                      <div key={group.date}>
                        <DateSeparator date={group.date} />
                        {group.messages.map((msg) => (
                          <MessageBubble key={msg.id} message={msg} />
                        ))}
                      </div>
                    ))}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="border-t bg-background/80 backdrop-blur-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <Input
                    ref={messageInputRef}
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sendMutation.isLoading}
                    className="flex-1 h-10"
                    aria-label="Message input"
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!messageInput.trim() || sendMutation.isLoading}
                    loading={sendMutation.isLoading}
                    className="h-10 w-10 shrink-0"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <NoConversationSelected />
          )}
        </div>
      </Card>
    </div>
  );
}

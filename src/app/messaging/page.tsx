"use client";

/**
 * Messaging Inbox Page
 *
 * Internal team messaging system for collaboration.
 * Part of Phase 2A implementation.
 */

import { useState } from "react";
import { api } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/common";
import {
  MessageSquare,
  Plus,
  Search,
  Send,
  Users,
  Clock,
  CheckCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { LoadingState, EmptyState } from "@/components/common";

export default function MessagingPage() {
  const router = useRouter();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Get user's threads
  const { data: threadsData, isLoading: threadsLoading } =
    api.messaging.getMyThreads.useQuery({
      status: "open",
      limit: 50,
    });

  // Get selected thread messages
  const { data: messagesData } = api.messaging.getThreadMessages.useQuery(
    { threadId: selectedThread || "" },
    { enabled: !!selectedThread }
  );

  // Get unread count
  const { data: unreadData } = api.messaging.getUnreadCount.useQuery();

  // Send message mutation
  const sendMessageMutation = api.messaging.sendMessage.useMutation({
    onSuccess: () => {
      setNewMessage("");
      // Invalidate queries to refresh
      api.useUtils().messaging.getThreadMessages.invalidate();
      api.useUtils().messaging.getMyThreads.invalidate();
    },
  });

  // Mark as read mutation
  const markAsReadMutation = api.messaging.markThreadAsRead.useMutation({
    onSuccess: () => {
      api.useUtils().messaging.getUnreadCount.invalidate();
    },
  });

  const threads = threadsData?.threads || [];
  const messages = messagesData?.messages || [];

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedThread) {
      sendMessageMutation.mutate({
        threadId: selectedThread,
        message: newMessage,
      });
    }
  };

  const handleSelectThread = (threadId: string) => {
    setSelectedThread(threadId);
    markAsReadMutation.mutate({ threadId });
  };

  if (threadsLoading) {
    return <LoadingState message="Loading messages..." />;
  }

  return (
    <div className="page-container">
      <Breadcrumbs
        items={[{ label: "Messaging" }]}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">
            Internal team communication
            {unreadData && unreadData.unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadData.unreadCount} unread
              </Badge>
            )}
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Thread
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
        {/* Thread List */}
        <Card className="col-span-4 flex flex-col">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {threads.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No messages"
                description="Start a conversation to collaborate with your team"
              />
            ) : (
              <div className="divide-y">
                {threads.map((thread: any) => {
                  const lastMessage = thread.thread_messages[0];
                  const isUnread = lastMessage && !lastMessage.read_by.includes(thread.participant_ids[0]);

                  return (
                    <button
                      key={thread.id}
                      onClick={() => handleSelectThread(thread.id)}
                      className={`w-full text-left p-4 hover:bg-accent transition-colors ${
                        selectedThread === thread.id ? "bg-accent" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-medium flex items-center gap-2">
                          {thread.subject || "Untitled Thread"}
                          {isUnread && (
                            <Badge variant="default" className="h-5 px-1.5 text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        {lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(lastMessage.sent_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {thread.participant_ids.length} participants
                      </div>
                      {lastMessage && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {lastMessage.message}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message View */}
        <Card className="col-span-8 flex flex-col">
          {selectedThread ? (
            <>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center justify-between">
                  <span>{threads.find((t: any) => t.id === selectedThread)?.subject || "Thread"}</span>
                  <div className="flex gap-2 text-sm font-normal text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {threads.find((t: any) => t.id === selectedThread)?.thread_participants.length} participants
                  </div>
                </CardTitle>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message: any) => (
                  <div
                    key={message.id}
                    className="flex gap-3"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {message.user_profiles?.full_name?.[0] || "?"}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {message.user_profiles?.full_name || "Unknown User"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.sent_at), { addSuffix: true })}
                        </span>
                        {message.edited && (
                          <span className="text-xs text-muted-foreground">(edited)</span>
                        )}
                      </div>
                      <p className="text-sm">{message.message}</p>
                      {message.read_by.length > 1 && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <CheckCheck className="w-3 h-3" />
                          Read by {message.read_by.length} people
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="resize-none"
                    rows={3}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="Select a thread"
              description="Choose a conversation from the list to view messages"
            />
          )}
        </Card>
      </div>
    </div>
  );
}

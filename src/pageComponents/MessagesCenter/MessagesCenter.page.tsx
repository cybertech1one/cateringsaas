"use client";

import { api } from "~/utils/api";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { MessageSquare } from "lucide-react";

export default function MessagesCenter() {
  const { data, isLoading } = api.messages.listConversations.useQuery({ limit: 50 });
  const conversations = (data?.conversations ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Communicate with clients about their events
        </p>
      </div>

      <div className="grid gap-2">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No conversations yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Conversations are created when clients send inquiries
            </p>
          </div>
        ) : (
          conversations.map((conv) => (
            <Card key={conv.id as string} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{conv.clientName as string}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {((conv.messages as Array<Record<string, unknown>>)?.[0]?.content as string) ?? "No messages yet"}
                    </div>
                  </div>
                </div>
                {(conv.unreadOrg as number) > 0 && (
                  <Badge className="bg-primary text-primary-foreground">
                    {conv.unreadOrg as number}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

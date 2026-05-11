"use client";

import { useMyChats, Chat } from "@/hooks/use-chats";
import { useAuthStore } from "@/store/auth.store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

function getOtherParticipant(chat: Chat, userId: string) {
    return chat.participant1_id === userId ? chat.participant2 : chat.participant1;
}

export default function ChatsPage() {
    const { user } = useAuthStore();
    const { data: chats, isLoading } = useMyChats(!!user);

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                ))}
            </div>
        );
    }

    if (!chats?.length) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center text-gray-400">
                <MessageCircle className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-lg font-medium">Нет сообщений</p>
                <p className="text-sm mt-1">Чаты появятся после одобрения заявки на аренду</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-2">
            <h1 className="text-2xl font-bold mb-6">Сообщения</h1>
            {chats.map((chat) => {
                const other = getOtherParticipant(chat, user!.id);
                const lastMessage = chat.messages[0];
                const unread = chat._count.messages;

                return (
                    <Link key={chat.id} href={`/chats/${chat.id}`}>
                        <div className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent transition-colors cursor-pointer">
                            <div className="relative">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={other.avatar_url ?? ""} />
                                    <AvatarFallback>{other.name.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                {unread > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                        {unread > 9 ? "9+" : unread}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-foreground truncate">{other.name}</span>
                                    {lastMessage && (
                                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                            {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true, locale: ru })}
                                        </span>
                                    )}
                                </div>
                                <p className={`text-sm truncate mt-0.5 ${unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                                    {lastMessage ? lastMessage.content : "Нет сообщений"}
                                </p>
                            </div>
                            {unread > 0 && (
                                <Badge className="bg-blue-500 text-white shrink-0">{unread}</Badge>
                            )}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

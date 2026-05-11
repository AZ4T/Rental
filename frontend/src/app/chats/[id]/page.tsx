"use client";

import { use, useEffect, useRef, useState } from "react";
import { useChatMessages, useMyChats, Chat } from "@/hooks/use-chats";
import { useAuthStore } from "@/store/auth.store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import api from "@/services/api";

function getOtherParticipant(chat: Chat, userId: string) {
    return chat.participant1_id === userId ? chat.participant2 : chat.participant1;
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: chatId } = use(params);
    const { user } = useAuthStore();
    const { messages, isLoading, sendMessage } = useChatMessages(chatId);
    const { data: chats } = useMyChats(!!user);
    const [input, setInput] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    const chat = chats?.find((c) => c.id === chatId);
    const other = chat && user ? getOtherParticipant(chat, user.id) : null;

    useEffect(() => {
        if (chatId) {
            api.post(`/chats/${chatId}/read`).catch(() => {});
        }
    }, [chatId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        const text = input.trim();
        if (!text) return;
        sendMessage(text);
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-10rem)]">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b mb-4">
                <Link href="/chats">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                {other && (
                    <>
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={other.avatar_url ?? ""} />
                            <AvatarFallback>{other.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{other.name}</span>
                    </>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {isLoading && (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
                                <div className="h-10 w-48 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                            </div>
                        ))}
                    </div>
                )}
                {messages.map((msg) => {
                    const isOwn = msg.sender_id === user?.id;
                    return (
                        <div key={msg.id} className={cn("flex gap-2", isOwn ? "justify-end" : "justify-start")}>
                            {!isOwn && (
                                <Avatar className="h-7 w-7 shrink-0 mt-1">
                                    <AvatarImage src={msg.sender.avatar_url ?? ""} />
                                    <AvatarFallback>{msg.sender.name.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            )}
                            <div
                                className={cn(
                                    "max-w-[70%] rounded-2xl px-4 py-2 text-sm",
                                    isOwn
                                        ? "bg-blue-500 text-white rounded-br-sm"
                                        : "bg-gray-100 dark:bg-gray-800 text-foreground rounded-bl-sm",
                                )}
                            >
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 pt-4 border-t mt-4">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Написать сообщение..."
                    className="flex-1"
                />
                <Button onClick={handleSend} disabled={!input.trim()} size="icon">
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBlockedUsers, useUnblockUser } from "@/hooks/use-blocks";
import { Ban, Loader2, ShieldOff } from "lucide-react";

export default function BlockedUsersPage() {
    const { data, isLoading } = useBlockedUsers();
    const { mutate: unblock, isPending } = useUnblockUser();

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-2">
                <Ban className="h-6 w-6 text-red-500" />
                <h1 className="text-2xl font-bold">Заблокированные</h1>
            </div>

            {(!data || data.length === 0) && (
                <div className="text-center py-20 text-muted-foreground">
                    <p>Список пуст</p>
                </div>
            )}

            <div className="space-y-3">
                {data?.map((b) => (
                    <Card key={b.id}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <Link
                                href={`/profile/${b.blocked.id}`}
                                className="flex items-center gap-3 flex-1 min-w-0"
                            >
                                <Avatar className="h-10 w-10">
                                    <AvatarImage
                                        src={b.blocked.avatar_url ?? ""}
                                    />
                                    <AvatarFallback>
                                        {b.blocked.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="font-medium truncate hover:underline">
                                        {b.blocked.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Заблокирован{" "}
                                        {new Date(b.created_at).toLocaleDateString(
                                            "ru-RU",
                                        )}
                                    </p>
                                </div>
                            </Link>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={isPending}
                                onClick={() => unblock(b.blocked.id)}
                            >
                                <ShieldOff className="h-4 w-4 mr-1" />
                                Разблокировать
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

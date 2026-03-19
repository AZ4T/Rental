"use client";

import { useState } from "react";
import { useMe, useUpdateProfile } from "@/hooks/use-profile";
import { useUploadImage } from "@/hooks/use-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Camera, Loader2 } from "lucide-react";

export default function MyProfilePage() {
    const { data: user, isLoading } = useMe();
    const { mutate: updateProfile, isPending } = useUpdateProfile();
    const { mutateAsync: uploadImage, isPending: isUploading } =
        useUploadImage();
    const [name, setName] = useState("");

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!user) return null;

    const handleAvatarUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = await uploadImage(file);
        updateProfile({ avatar_url: url });
    };

    const handleSave = () => {
        if (name.trim()) {
            updateProfile({ name: name.trim() });
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Мой профиль</h1>

            <Card>
                <CardContent className="p-6">
                    {/* Аватар */}
                    <div className="flex items-center gap-6 mb-6">
                        <div className="relative">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={user.avatar_url ?? ""} />
                                <AvatarFallback className="text-2xl">
                                    {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1.5 cursor-pointer hover:bg-blue-700">
                                {isUploading ? (
                                    <Loader2 className="h-3 w-3 text-white animate-spin" />
                                ) : (
                                    <Camera className="h-3 w-3 text-white" />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarUpload}
                                    disabled={isUploading}
                                />
                            </label>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">
                                {user.name}
                            </h2>
                            <p className="text-gray-500 text-sm">
                                {user.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary">{user.role}</Badge>
                                {user.rating_avg && (
                                    <div className="flex items-center gap-1 text-sm">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        <span>
                                            {Number(user.rating_avg).toFixed(1)}
                                        </span>
                                        <span className="text-gray-500">
                                            ({user.reviews_count})
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Редактирование */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label>Имя</Label>
                            <Input
                                defaultValue={user.name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={user.name}
                            />
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={isPending || !name.trim()}
                        >
                            {isPending ? "Сохраняем..." : "Сохранить"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

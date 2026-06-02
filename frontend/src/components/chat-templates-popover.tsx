"use client";

import { useState, useRef, useEffect } from "react";
import {
    ChatTemplate,
    useChatTemplates,
    useCreateChatTemplate,
    useDeleteChatTemplate,
    useUpdateChatTemplate,
} from "@/hooks/use-chat-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListPlus, Plus, Pencil, Trash2, X, Loader2, Settings } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
    onPick: (text: string) => void;
}

export function ChatTemplatesPopover({ onPick }: Props) {
    const t = useTranslations("Chat");
    const [open, setOpen] = useState(false);
    const [manage, setManage] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const { data: templates = [], isLoading } = useChatTemplates(open);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setManage(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOpen((v) => !v)}
                title={t("templates")}
            >
                <ListPlus className="h-5 w-5" />
            </Button>

            {open && (
                <div className="absolute bottom-full right-0 mb-2 w-80 max-h-96 overflow-y-auto bg-popover border rounded-lg shadow-lg z-50">
                    <div className="flex items-center justify-between px-3 py-2 border-b">
                        <p className="text-sm font-semibold">{t("templates")}</p>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setManage((v) => !v)}
                            title={t("templatesManage")}
                        >
                            <Settings className="h-4 w-4" />
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="p-6 flex justify-center">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : manage ? (
                        <ManageList templates={templates} onClose={() => setManage(false)} />
                    ) : (
                        <PickList
                            templates={templates}
                            onPick={(text) => {
                                onPick(text);
                                setOpen(false);
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

function PickList({
    templates,
    onPick,
}: {
    templates: ChatTemplate[];
    onPick: (text: string) => void;
}) {
    const t = useTranslations("Chat");
    if (templates.length === 0) {
        return (
            <p className="px-3 py-6 text-sm text-center text-muted-foreground">
                {t("templatesEmpty")}
            </p>
        );
    }
    return (
        <ul className="divide-y">
            {templates.map((tpl) => (
                <li key={tpl.id}>
                    <button
                        type="button"
                        onClick={() => onPick(tpl.text)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                    >
                        {tpl.text}
                    </button>
                </li>
            ))}
        </ul>
    );
}

function ManageList({
    templates,
    onClose,
}: {
    templates: ChatTemplate[];
    onClose: () => void;
}) {
    const t = useTranslations("Chat");
    const [newText, setNewText] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState("");
    const { mutate: create, isPending: isCreating } = useCreateChatTemplate();
    const { mutate: update, isPending: isUpdating } = useUpdateChatTemplate();
    const { mutate: del } = useDeleteChatTemplate();

    const submitNew = () => {
        const text = newText.trim();
        if (!text) return;
        create(text, { onSuccess: () => setNewText("") });
    };

    const submitEdit = () => {
        const text = editText.trim();
        if (!text || !editingId) return;
        update(
            { id: editingId, text },
            {
                onSuccess: () => {
                    setEditingId(null);
                    setEditText("");
                },
            },
        );
    };

    return (
        <div className="p-3 space-y-3">
            <div className="flex gap-2">
                <Input
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder={t("templatesNewPlaceholder")}
                    maxLength={500}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") submitNew();
                    }}
                />
                <Button
                    type="button"
                    size="icon"
                    disabled={isCreating || !newText.trim()}
                    onClick={submitNew}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <ul className="space-y-2 max-h-56 overflow-y-auto">
                {templates.map((tpl) => (
                    <li key={tpl.id} className="flex items-start gap-2 text-sm">
                        {editingId === tpl.id ? (
                            <>
                                <Input
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    maxLength={500}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") submitEdit();
                                        if (e.key === "Escape") setEditingId(null);
                                    }}
                                />
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    disabled={isUpdating}
                                    onClick={submitEdit}
                                >
                                    ✓
                                </Button>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setEditingId(null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <span className="flex-1 truncate">{tpl.text}</span>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                        setEditingId(tpl.id);
                                        setEditText(tpl.text);
                                    }}
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => del(tpl.id)}
                                >
                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                </Button>
                            </>
                        )}
                    </li>
                ))}
            </ul>

            <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full"
                onClick={onClose}
            >
                {t("templatesDone")}
            </Button>
        </div>
    );
}

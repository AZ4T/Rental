import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
    open: boolean;
    title?: string;
    description?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isPending?: boolean;
}

export function ConfirmDialog({
    open,
    title = "Вы уверены?",
    description = "Это действие нельзя отменить.",
    onConfirm,
    onCancel,
    isPending,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onCancel}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onCancel}>
                        Отмена
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isPending}
                    >
                        {isPending ? "Удаляем..." : "Удалить"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

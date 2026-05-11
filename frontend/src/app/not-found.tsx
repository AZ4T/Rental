import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
            <FileQuestion className="h-20 w-20 text-gray-300 mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                404
            </h1>
            <p className="text-gray-500 mb-6">Страница не найдена</p>
            <Button asChild>
                <Link href="/">На главную</Link>
            </Button>
        </div>
    );
}

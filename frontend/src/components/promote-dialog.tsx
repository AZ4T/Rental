"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, Sparkles, Crown, Check, Loader2 } from "lucide-react";
import {
    PromotionPlan,
    PromotionTier,
    usePromotionTiers,
    usePromoteListing,
} from "@/hooks/use-wallet";
import { useTranslations } from "next-intl";

interface Props {
    listingId: string;
    listingTitle: string;
    onClose: () => void;
}

// Hard-coded perks per tier — copywriting, not API data.
const TIER_PERKS: Record<
    PromotionTier,
    { icon: typeof Rocket; perks: string[]; accent: string }
> = {
    basic: {
        icon: Rocket,
        accent: "border-amber-400 bg-amber-50 dark:bg-amber-950/30",
        perks: ["promoteBasic1", "promoteBasic2"],
    },
    pro: {
        icon: Sparkles,
        accent: "border-orange-500 bg-orange-50 dark:bg-orange-950/30",
        perks: ["promoteBasic1", "promoteBasic2", "promotePro1"],
    },
    premium: {
        icon: Crown,
        accent: "border-purple-500 bg-purple-50 dark:bg-purple-950/30",
        perks: [
            "promoteBasic1",
            "promoteBasic2",
            "promotePro1",
            "promotePremium1",
        ],
    },
};

export function PromoteDialog({ listingId, listingTitle, onClose }: Props) {
    const t = useTranslations("Listing");
    const { data: tiers = [], isLoading } = usePromotionTiers();
    const { mutate: promote, isPending } = usePromoteListing();
    const [selected, setSelected] = useState<PromotionTier>("basic");

    const handlePromote = () => {
        promote(
            { listingId, tier: selected },
            { onSuccess: () => onClose() },
        );
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{t("promoteTitle")}</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground -mt-2 mb-2 truncate">
                    «{listingTitle}»
                </p>

                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {tiers.map((plan) => (
                            <TierCard
                                key={plan.key}
                                plan={plan}
                                selected={selected === plan.key}
                                onSelect={() => setSelected(plan.key)}
                            />
                        ))}
                    </div>
                )}

                <div className="flex gap-2 pt-2">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={onClose}
                        disabled={isPending}
                    >
                        {t("promoteCancel")}
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={handlePromote}
                        disabled={isPending || isLoading}
                    >
                        {isPending && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        {t("promoteConfirm")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function TierCard({
    plan,
    selected,
    onSelect,
}: {
    plan: PromotionPlan;
    selected: boolean;
    onSelect: () => void;
}) {
    const t = useTranslations("Listing");
    const tier = plan.key;
    const cfg = TIER_PERKS[tier];
    const Icon = cfg.icon;

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`text-left rounded-xl border-2 transition-all p-4 ${
                selected
                    ? cfg.accent + " shadow-md"
                    : "border-border bg-card hover:border-foreground/20"
            }`}
        >
            <div className="flex items-center justify-between mb-3">
                <Icon
                    className={`h-5 w-5 ${
                        tier === "basic"
                            ? "text-amber-500"
                            : tier === "pro"
                            ? "text-orange-500"
                            : "text-purple-500"
                    }`}
                />
                {selected && (
                    <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                    </div>
                )}
            </div>
            <p className="text-base font-semibold capitalize">
                {t(`promoteTier_${tier}` as "promoteTier_basic")}
            </p>
            <p className="text-xl font-bold mt-1">
                {plan.price.toLocaleString()} ₸
            </p>
            <p className="text-xs text-muted-foreground mb-3">
                {t("promoteDays", { days: plan.days })}
            </p>
            <ul className="space-y-1.5">
                {cfg.perks.map((perkKey) => (
                    <li
                        key={perkKey}
                        className="text-xs text-foreground/80 flex items-start gap-1.5"
                    >
                        <Check className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{t(perkKey as "promoteBasic1")}</span>
                    </li>
                ))}
            </ul>
        </button>
    );
}

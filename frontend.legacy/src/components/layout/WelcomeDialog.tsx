import React from "react";
import { Compass, Sparkles, X, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTourStore } from "@/store/useTourStore";
import { useTranslation } from "@/lib/i18n";

export function WelcomeDialog() {
  const { t } = useTranslation();
  const { showWelcomeDialog, startTour, skipTour, dontShowAgain } = useTourStore();

  if (!showWelcomeDialog) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-md rounded-xl border border-primary/40 bg-card p-6 shadow-2xl space-y-5 font-sans relative overflow-hidden">
        {/* Top Decorative Background Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-primary/15 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
              <Compass className="h-5 w-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {t("tour.welcomeTitle")}
              </h2>
              <Badge variant="tactical" className="text-[9px] mt-0.5">
                ONBOARDING GUIDANCE
              </Badge>
            </div>
          </div>
          <button
            onClick={skipTour}
            className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("tour.welcomeDesc")}
        </p>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <Button
            variant="tactical"
            onClick={startTour}
            className="w-full h-9 font-mono text-xs font-bold gap-2 justify-center"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t("tour.startTour")}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={skipTour}
              className="flex-1 h-8 font-mono text-xs text-muted-foreground hover:text-foreground justify-center"
            >
              {t("tour.exploreMyself")}
            </Button>
            <Button
              variant="ghost"
              onClick={dontShowAgain}
              className="flex-1 h-8 font-mono text-xs text-muted-foreground hover:text-destructive justify-center"
            >
              {t("tour.dontShowAgain")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

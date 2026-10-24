import React from "react";
import {
  HelpCircle,
  Compass,
  Lightbulb,
  BookOpen,
  X,
  Keyboard,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTourStore } from "@/store/useTourStore";
import { useTranslation } from "@/lib/i18n";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const { t } = useTranslation();
  const { replayTour } = useTourStore();

  if (!isOpen) return null;

  const handleStartTour = () => {
    onClose();
    replayTour();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-5 font-sans relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/70">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {t("help.title")}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {t("help.subtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action: Replay Interactive Tour */}
        <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Compass className="h-4 w-4" />
              <span>{t("help.restartTour")}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t("tour.welcomeDesc")}
            </p>
          </div>
          <Button
            variant="tactical"
            size="sm"
            onClick={handleStartTour}
            className="text-xs font-mono h-8 shrink-0 font-bold"
          >
            Start
          </Button>
        </div>

        {/* Quick Navigation Tips */}
        <div className="space-y-2.5 text-xs">
          <h3 className="font-bold text-foreground text-xs flex items-center gap-2">
            <Lightbulb className="h-3.5 w-3.5 text-primary" />
            <span>{t("help.quickTips")}</span>
          </h3>

          <div className="space-y-2">
            <div className="p-2.5 rounded border border-border/80 bg-surface-elevated/50 flex items-start gap-2.5">
              <Keyboard className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span className="text-[11px] text-muted-foreground leading-relaxed">
                {t("help.tip1")}
              </span>
            </div>

            <div className="p-2.5 rounded border border-border/80 bg-surface-elevated/50 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-[11px] text-muted-foreground leading-relaxed">
                {t("help.tip2")}
              </span>
            </div>

            <div className="p-2.5 rounded border border-border/80 bg-surface-elevated/50 flex items-start gap-2.5">
              <BookOpen className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
              <span className="text-[11px] text-muted-foreground leading-relaxed">
                {t("help.tip3")}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs font-mono h-8"
          >
            {t("help.close")}
          </Button>
        </div>
      </div>
    </div>
  );
}

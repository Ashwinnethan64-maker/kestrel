import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTourStore, TOUR_STEPS } from "@/store/useTourStore";
import { useTranslation } from "@/lib/i18n";

export function GuidedTour() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    isTourActive,
    currentStepIndex,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
  } = useTourStore();

  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number }>({ top: 100, left: 100 });
  const popoverRef = useRef<HTMLDivElement>(null);

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Navigate to step's route if necessary
  useEffect(() => {
    if (!isTourActive || !currentStep) return;
    if (currentStep.route && window.location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }
  }, [isTourActive, currentStepIndex]);

  // Position highlight box and popover relative to target element
  useEffect(() => {
    if (!isTourActive || !currentStep) {
      setHighlightStyle(null);
      return;
    }

    const updatePosition = () => {
      const el = document.getElementById(currentStep.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Give comfortable padding around target
        setHighlightStyle({
          top: Math.max(0, rect.top - 4),
          left: Math.max(0, rect.left - 4),
          width: rect.width + 8,
          height: rect.height + 8,
          opacity: 1,
        });

        // Compute popover coordinates
        const popoverW = 340;
        let left = rect.right + 16;
        let top = rect.top;

        // If target is too close to right edge, place popover on the left or bottom
        if (left + popoverW > window.innerWidth) {
          left = Math.max(16, rect.left - popoverW - 16);
        }
        if (currentStep.position === 'bottom') {
          top = rect.bottom + 16;
          left = Math.min(Math.max(16, rect.left - 100), window.innerWidth - popoverW - 16);
        }

        // Clamp inside window viewport
        top = Math.max(16, Math.min(top, window.innerHeight - 250));
        left = Math.max(16, Math.min(left, window.innerWidth - popoverW - 16));

        setPopoverPosition({ top, left });
      } else {
        // Fallback center of screen if element not found on page
        setHighlightStyle(null);
        setPopoverPosition({
          top: window.innerHeight / 2 - 100,
          left: Math.max(16, window.innerWidth / 2 - 170),
        });
      }
    };

    // Small delay to allow any routing transitions to settle
    const timer = setTimeout(updatePosition, 150);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isTourActive, currentStepIndex, currentStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!isTourActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        skipTour();
      } else if (e.key === "ArrowRight") {
        nextStep();
      } else if (e.key === "ArrowLeft") {
        prevStep();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTourActive, nextStep, prevStep, skipTour]);

  if (!isTourActive || !currentStep) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* Semi-transparent backdrop with cutout glow */}
      <div
        className="fixed inset-0 bg-background/70 backdrop-blur-[2px] transition-all duration-200"
        onClick={skipTour}
      />

      {/* Spotlight Ring over target element */}
      {highlightStyle && (
        <div
          style={highlightStyle}
          className="fixed pointer-events-none rounded-lg border-2 border-primary shadow-[0_0_24px_rgba(212,175,55,0.45)] transition-all duration-200 z-50"
        />
      )}

      {/* Floating Tour Popover Box */}
      <div
        ref={popoverRef}
        style={{ top: popoverPosition.top, left: popoverPosition.left }}
        className="fixed z-50 w-[340px] rounded-xl border border-primary/50 bg-card p-5 shadow-2xl backdrop-blur-md animate-fade-in font-sans space-y-4"
      >
        {/* Header: Step Badge + Close */}
        <div className="flex items-center justify-between pb-1 border-b border-border/60">
          <div className="flex items-center gap-1.5">
            <Compass className="h-4 w-4 text-primary animate-spin-slow" />
            <span className="font-mono text-xs font-bold text-primary tracking-wide uppercase">
              {currentStepIndex + 1} {t("common.stepOf")} {TOUR_STEPS.length}
            </span>
          </div>
          <button
            onClick={skipTour}
            className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
            title={t("common.skip")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content: Title & Clear 1-Sentence Explanation */}
        <div className="space-y-1.5">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            {t(currentStep.titleKey)}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t(currentStep.descriptionKey)}
          </p>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <button
            onClick={skipTour}
            className="text-xs text-muted-foreground hover:text-foreground font-mono transition-colors"
          >
            {t("common.skip")}
          </button>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                className="h-8 px-2.5 text-xs font-mono gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>{t("common.back")}</span>
              </Button>
            )}

            <Button
              variant="tactical"
              size="sm"
              onClick={nextStep}
              className="h-8 px-3 text-xs font-mono gap-1 font-bold"
            >
              {currentStepIndex === TOUR_STEPS.length - 1 ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{t("common.finish")}</span>
                </>
              ) : (
                <>
                  <span>{t("common.next")}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

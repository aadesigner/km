import { useState, useRef, useLayoutEffect, useCallback } from "react";
import { Car, DoorOpen, FileText, Shield, HelpCircle, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "@/i18n/context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VIN_HELP_SCENES } from "@/components/vin-find-help-illustrations";

const LOCATIONS = [
  {
    id: "dashboard" as const,
    icon: Car,
    tabKey: "vin_find_tab_dashboard",
    titleKey: "vin_find_loc_dashboard_title",
    descKey: "vin_find_loc_dashboard_desc",
  },
  {
    id: "door" as const,
    icon: DoorOpen,
    tabKey: "vin_find_tab_door",
    titleKey: "vin_find_loc_door_title",
    descKey: "vin_find_loc_door_desc",
  },
  {
    id: "documents" as const,
    icon: FileText,
    tabKey: "vin_find_tab_documents",
    titleKey: "vin_find_loc_documents_title",
    descKey: "vin_find_loc_documents_desc",
  },
  {
    id: "insurance" as const,
    icon: Shield,
    tabKey: "vin_find_tab_insurance",
    titleKey: "vin_find_loc_insurance_title",
    descKey: "vin_find_loc_insurance_desc",
  },
];

type Variant = "default" | "on-dark";

type Props = {
  variant?: Variant;
  className?: string;
};

export function WhereToFindVinHelp({ variant = "default", className }: Props) {
  const { t, dir, language } = useTranslation();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [transformOrigin, setTransformOrigin] = useState("center center");

  const updateTransformOrigin = useCallback(() => {
    const trigger = triggerRef.current;
    const dialog = contentRef.current;
    if (!trigger || !dialog) return;
    const tr = trigger.getBoundingClientRect();
    const dr = dialog.getBoundingClientRect();
    const x = tr.left + tr.width / 2 - dr.left;
    const y = tr.top + tr.height / 2 - dr.top;
    setTransformOrigin(`${x}px ${y}px`);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateTransformOrigin();
    const raf = requestAnimationFrame(updateTransformOrigin);
    return () => cancelAnimationFrame(raf);
  }, [open, updateTransformOrigin]);

  const loc = LOCATIONS[active];
  const Scene = VIN_HELP_SCENES[loc.id];
  const vinLabel = t("vin_label");

  return (
    <>
      <div className={cn("w-full flex justify-center pt-0.5", className)}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium transition-colors group text-center max-w-full",
            variant === "on-dark"
              ? "text-white/55 hover:text-white/90"
              : "text-muted-foreground hover:text-primary",
          )}
        >
          <HelpCircle
            className={cn(
              "h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-colors",
              variant === "on-dark"
                ? "text-white/45 group-hover:text-primary"
                : "text-primary/70 group-hover:text-primary",
            )}
          />
          <span className={cn("leading-snug", variant === "default" && "underline-offset-2 group-hover:underline")}>
            {t("vin_find_help_link")}
          </span>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          ref={contentRef}
          variant="anchored"
          style={{ transformOrigin }}
          className={cn(
            "gap-0 p-0 overflow-hidden",
            "max-h-[min(92dvh,720px)] md:max-h-[min(90dvh,820px)] overflow-y-auto",
            "sm:max-w-xl md:max-w-2xl",
          )}
        >
          <div className="px-4 pt-5 pb-4 sm:px-6 sm:pt-6 md:px-8 md:pt-7 border-b bg-muted/30">
            <DialogHeader className={cn("text-center sm:text-start", language === "ar" && "sm:text-right")}>
              <DialogTitle className="text-lg sm:text-xl md:text-[1.35rem] pr-8 leading-snug">{t("vin_find_help_title")}</DialogTitle>
              <DialogDescription className="sr-only">
                {t("vin_find_help_intro")}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-3 pt-3 sm:px-5 sm:pt-4 md:px-7 md:pt-5">
            <div
              className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center"
              role="tablist"
              aria-label={t("vin_find_help_title")}
            >
              {LOCATIONS.map((item, i) => {
                const Icon = item.icon;
                const selected = i === active;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActive(i)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 sm:rounded-full sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-semibold border transition-all min-h-[2.5rem]",
                      selected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background text-muted-foreground border-border/80 hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="leading-tight text-center">{t(item.tabKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-3 py-4 sm:px-5 sm:py-5 md:px-7 md:py-6 space-y-4 md:space-y-5">
            <div className="relative rounded-2xl border border-border/70 bg-muted/20 overflow-hidden min-h-[210px] sm:min-h-[250px] md:min-h-[300px]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_100%,hsl(var(--primary)/0.08),transparent)] pointer-events-none" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={loc.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="relative w-full min-h-[210px] sm:min-h-[250px] md:min-h-[300px]"
                >
                  <Scene
                    vinLabel={vinLabel}
                    lookHereLabel={t("vin_find_scene_look_here")}
                    rtl={language === "ar"}
                    className="absolute inset-0"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className={cn("space-y-1.5 text-center sm:text-start", language === "ar" && "sm:text-right")}>
              <h3 className="font-bold text-sm sm:text-base md:text-lg text-foreground">{t(loc.titleKey)}</h3>
              <p className="text-sm md:text-[0.9375rem] text-muted-foreground leading-relaxed text-pretty">{t(loc.descKey)}</p>
            </div>

            <div className={cn(
              "flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/[0.06] px-3.5 py-3",
              "text-center sm:text-start",
              language === "ar" && "sm:text-right",
            )}
            >
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5 hidden sm:block" />
              <p className="text-xs text-muted-foreground leading-relaxed text-pretty w-full">{t("vin_find_help_tip")}</p>
            </div>
          </div>

          <div className="px-3 pb-4 sm:px-5 sm:pb-6 md:px-7 md:pb-7 sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border/40 pt-3 md:pt-4">
            <Button type="button" className="w-full rounded-xl font-semibold h-11 md:h-12" onClick={() => setOpen(false)}>
              {t("vin_find_help_got_it")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

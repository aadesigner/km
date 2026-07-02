import { useEffect, useState } from "react";
import { Coffee } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/i18n/context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const POPUP_DELAY_MS = 5000;

function AnimatedCoffeeIcon({ reduceMotion }: { reduceMotion: boolean | null }) {
  if (reduceMotion) {
    return (
      <div className="relative flex h-16 w-16 items-center justify-center">
        <Coffee className="h-8 w-8 text-amber-600 dark:text-amber-400" aria-hidden />
      </div>
    );
  }

  return (
    <div className="relative flex h-16 w-16 items-center justify-center" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute top-2 h-3 w-[3px] rounded-full bg-amber-400/50 dark:bg-amber-300/40"
          style={{ left: `calc(50% + ${(i - 1) * 7}px)` }}
          animate={{ y: [0, -10, -16], opacity: [0, 0.55, 0], scaleX: [0.7, 1, 0.8] }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "easeOut",
            delay: i * 0.45,
          }}
        />
      ))}

      <motion.div
        animate={{ y: [0, -4, 0], rotate: [0, -2, 2, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <Coffee className="h-8 w-8 text-amber-600 dark:text-amber-400 drop-shadow-sm" />
      </motion.div>

      <motion.span
        className="absolute -right-0.5 top-3 h-1.5 w-1.5 rounded-full bg-amber-400/70"
        animate={{ scale: [0.6, 1, 0.6], opacity: [0.3, 0.9, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute -left-1 bottom-4 h-1 w-1 rounded-full bg-orange-400/60"
        animate={{ scale: [0.5, 1, 0.5], opacity: [0.2, 0.8, 0.2] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
      />
    </div>
  );
}

export function PendingVinCoffeeDialog() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(true), POPUP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          "sm:max-w-md gap-0 p-0 overflow-hidden",
          "border-amber-500/25 shadow-xl shadow-amber-500/5",
        )}
      >
        <div
          className="h-1.5 bg-gradient-to-r from-amber-300/70 via-amber-500/80 to-orange-400/70"
          aria-hidden
        />

        <div className="relative px-6 pt-7 pb-6 sm:px-8 sm:pt-8 sm:pb-7">
          <div
            className="pointer-events-none absolute inset-x-8 top-6 h-28 rounded-full bg-amber-400/10 blur-2xl"
            aria-hidden
          />

          <div className="relative flex flex-col items-center text-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-amber-500/8 blur-md scale-110" aria-hidden />
              <div className="relative h-[4.5rem] w-[4.5rem] rounded-3xl bg-gradient-to-br from-amber-500/15 via-amber-400/10 to-orange-400/10 border border-amber-500/20 flex items-center justify-center shadow-sm">
                <AnimatedCoffeeIcon reduceMotion={reduceMotion} />
              </div>
            </div>

            <DialogHeader className="space-y-2.5">
              <DialogTitle className="text-xl sm:text-[1.35rem] font-bold tracking-tight">
                {t("pending_coffee_popup_title")}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-[0.925rem] leading-relaxed text-muted-foreground max-w-[20rem] mx-auto">
                {t("pending_coffee_popup_body")}
              </DialogDescription>
            </DialogHeader>

            <Button
              type="button"
              className="w-full sm:w-auto min-w-[11rem] mt-0.5 bg-amber-600 hover:bg-amber-600/90 text-white shadow-sm"
              onClick={() => setOpen(false)}
            >
              {t("pending_coffee_popup_cta")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

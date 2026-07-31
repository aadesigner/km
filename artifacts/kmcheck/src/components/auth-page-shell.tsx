import { Link } from "wouter";
import { motion } from "framer-motion";
import { KmcheckMark } from "@/components/logo";
import { useTranslation } from "@/i18n/context";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
};

/** Shared layout for sign-in, sign-up, forgot/reset password. */
export function AuthPageShell({ children, className }: Props) {
  const { language } = useTranslation();

  return (
    <section
      className={cn(
        "relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 pb-6 sm:pb-10",
        "-mt-[var(--site-header-offset,84px)] pt-[calc(0.5rem+var(--site-header-offset,84px))] sm:pt-[calc(1.25rem+var(--site-header-offset,84px))]",
      )}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50/90 via-background to-background dark:hidden" />
      <div className="absolute inset-0 -z-10 hidden dark:block bg-[#040d08]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#16a34a_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.06] dark:opacity-[0.16]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_55%_at_50%_-10%,rgba(34,197,94,0.18),transparent)] dark:bg-[radial-gradient(ellipse_80%_55%_at_50%_-10%,rgba(34,197,94,0.35),transparent)]" />
      <div className="absolute inset-0 -z-10 hidden dark:block bg-[radial-gradient(ellipse_50%_40%_at_0%_100%,rgba(34,197,94,0.08),transparent)]" />
      <div
        aria-hidden
        className="absolute top-[12%] left-1/2 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn("w-full max-w-[420px] md:max-w-[480px]", className)}
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-3xl",
            "border border-border/70 bg-card/95 backdrop-blur-md",
            "shadow-[0_24px_64px_-28px_rgba(0,0,0,0.18)] dark:shadow-[0_28px_72px_-32px_rgba(0,0,0,0.55)]",
            "ring-1 ring-black/[0.03] dark:ring-white/[0.06]",
          )}
        >
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="flex flex-col items-center px-5 pt-5 pb-4 border-b border-border/40 bg-gradient-to-b from-muted/25 to-transparent">
            <Link
              href={`/${language}`}
              className="group flex flex-col items-center rounded-xl p-0.5 transition-opacity hover:opacity-90"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.08] ring-1 ring-primary/15 shadow-sm shadow-primary/10 transition-transform group-hover:scale-[1.02]">
                <KmcheckMark className="h-6 w-6" />
              </span>
            </Link>
          </div>

          <div className="p-5 sm:p-7">{children}</div>
        </div>
      </motion.div>
    </section>
  );
}

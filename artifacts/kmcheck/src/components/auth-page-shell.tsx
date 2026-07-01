import { Link } from "wouter";
import { motion } from "framer-motion";
import { KmcheckLogo } from "@/components/logo";
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
    <section className="relative min-h-[calc(100dvh-64px)] flex items-center justify-center px-4 py-6 sm:py-10 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50/80 via-background to-background dark:hidden" />
      <div className="absolute inset-0 -z-10 hidden dark:block bg-[#040d08]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#16a34a_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.06] dark:opacity-[0.16]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_55%_at_50%_-10%,rgba(34,197,94,0.18),transparent)] dark:bg-[radial-gradient(ellipse_80%_55%_at_50%_-10%,rgba(34,197,94,0.35),transparent)]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={cn("w-full max-w-[400px]", className)}
      >
        <div className="rounded-2xl border border-border/80 bg-card/95 backdrop-blur-sm shadow-xl shadow-black/[0.06] dark:shadow-black/30 overflow-hidden">
          <div className="flex justify-center pt-6 pb-4 sm:pt-7 sm:pb-5 border-b border-border/50 bg-muted/20">
            <Link href={`/${language}`} className="flex items-center">
              <KmcheckLogo className="h-9" />
            </Link>
          </div>
          <div className="p-5 sm:p-7">{children}</div>
        </div>
      </motion.div>
    </section>
  );
}

import { cn } from "@/lib/utils";

/** Non-blocking route placeholder — layout chrome without a centered spinner. */
export function RouteShellFallback({ className }: { className?: string }) {
  return (
    <div className={cn("min-h-screen bg-background", className)} aria-hidden>
      <div className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="h-8 w-28 rounded-lg bg-muted/70 animate-pulse" />
          <div className="hidden md:flex items-center gap-3">
            <div className="h-9 w-20 rounded-full bg-muted/60 animate-pulse" />
            <div className="h-9 w-20 rounded-full bg-muted/60 animate-pulse" />
            <div className="h-9 w-24 rounded-full bg-muted/60 animate-pulse" />
          </div>
          <div className="h-9 w-24 rounded-full bg-muted/70 animate-pulse md:hidden" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14 space-y-6">
        <div className="h-10 w-2/3 max-w-xl rounded-xl bg-muted/60 animate-pulse" />
        <div className="h-5 w-full max-w-2xl rounded-lg bg-muted/40 animate-pulse" />
        <div className="h-5 w-5/6 max-w-xl rounded-lg bg-muted/35 animate-pulse" />
        <div className="h-40 sm:h-52 w-full rounded-2xl bg-muted/30 animate-pulse mt-4" />
      </div>
    </div>
  );
}

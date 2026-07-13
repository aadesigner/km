import { Component, type ReactNode } from "react";
import { readDict, type Language } from "@/i18n/context";
import { LANG_PATH_ALT } from "@/lib/languages";
import { isChunkLoadError, shouldAttemptChunkReload } from "@/lib/lazy-with-retry";

type Props = {
  children: ReactNode;
  /** Scope label for console logging (e.g. "vin", "checkout"). */
  scope?: string;
  /** When this changes (e.g. route path), a caught error is cleared so navigation can recover. */
  resetKey?: string;
  fallback?: ReactNode;
};

type State = { hasError: boolean; error?: Error };

function parseLangFromPath(): Language {
  const m = window.location.pathname.match(new RegExp(`/(${LANG_PATH_ALT})(?:/|$)`));
  return (m?.[1] ?? "en") as Language;
}

function tStatic(lang: Language, key: string): string {
  return readDict(lang)?.[key] ?? readDict("en")?.[key] ?? key;
}

function DefaultFallback({ lang, error }: { lang: Language; error?: Error }) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const pathname = typeof window !== "undefined" ? window.location.pathname : `${base}/${lang}`;
  const isAdmin = pathname.includes("/adminx");
  const home = isAdmin ? `${base}/adminx` : `${base}/${lang}`;
  const homeLabel = isAdmin ? "Back to admin overview" : tStatic(lang, "error_boundary_home");
  const staleChunk = error != null && isChunkLoadError(error);
  const titleKey = staleChunk ? "error_chunk_title" : "error_boundary_title";
  const descKey = staleChunk ? "error_chunk_desc" : "error_boundary_desc";
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8 text-center">
      <div className="text-4xl" aria-hidden>⚠️</div>
      <h1 className="text-xl font-bold">{tStatic(lang, titleKey)}</h1>
      <p className="text-muted-foreground text-sm max-w-sm">{tStatic(lang, descKey)}</p>
      <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
        <button
          type="button"
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
          onClick={() => window.location.reload()}
        >
          {tStatic(lang, "error_boundary_refresh")}
        </button>
        <a
          href={home}
          className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted/50"
        >
          {homeLabel}
        </a>
      </div>
    </div>
  );
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps: Props): void {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const scope = this.props.scope ?? "app";
    console.error(`[kmcheck:${scope}]`, error, info.componentStack);
    if (isChunkLoadError(error) && shouldAttemptChunkReload()) {
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return <DefaultFallback lang={parseLangFromPath()} error={this.state.error} />;
    }
    return this.props.children;
  }
}

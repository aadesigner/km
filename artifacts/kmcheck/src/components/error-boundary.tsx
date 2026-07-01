import { Component, type ReactNode } from "react";
import { readDict, type Language } from "@/i18n/context";

type Props = {
  children: ReactNode;
  /** Scope label for console logging (e.g. "vin", "checkout"). */
  scope?: string;
  /** When this changes (e.g. route path), a caught error is cleared so navigation can recover. */
  resetKey?: string;
  fallback?: ReactNode;
};

type State = { hasError: boolean; autoRetried: boolean };

function parseLangFromPath(): Language {
  const m = window.location.pathname.match(/\/(en|ar|uk|ru|sq)(?:\/|$)/);
  return (m?.[1] ?? "en") as Language;
}

function tStatic(lang: Language, key: string): string {
  return readDict(lang)?.[key] ?? readDict("en")?.[key] ?? key;
}

function DefaultFallback({ lang }: { lang: Language }) {
  const home = `/${lang}`;
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8 text-center">
      <div className="text-4xl" aria-hidden>⚠️</div>
      <h1 className="text-xl font-bold">{tStatic(lang, "error_boundary_title")}</h1>
      <p className="text-muted-foreground text-sm max-w-sm">{tStatic(lang, "error_boundary_desc")}</p>
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
          {tStatic(lang, "error_boundary_home")}
        </a>
      </div>
    </div>
  );
}

function ErrorRecoveryLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export class RouteErrorBoundary extends Component<Props, State> {
  private autoRetryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, autoRetried: false };
  }

  static getDerivedStateFromError(): Pick<State, "hasError"> {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: Props): void {
    if (prevProps.resetKey !== this.props.resetKey) {
      if (this.autoRetryTimer) {
        clearTimeout(this.autoRetryTimer);
        this.autoRetryTimer = null;
      }
      if (this.state.hasError || this.state.autoRetried) {
        this.setState({ hasError: false, autoRetried: false });
      }
    }
  }

  componentWillUnmount(): void {
    if (this.autoRetryTimer) clearTimeout(this.autoRetryTimer);
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const scope = this.props.scope ?? "app";
    console.error(`[kmcheck:${scope}]`, error, info.componentStack);

    // One silent re-render — recovers race conditions (auth ready, lazy chunks) without a full refresh.
    if (!this.state.autoRetried) {
      this.autoRetryTimer = setTimeout(() => {
        this.autoRetryTimer = null;
        this.setState({ hasError: false, autoRetried: true });
      }, 100);
    }
  }

  render() {
    if (this.state.hasError) {
      if (!this.state.autoRetried) {
        return <ErrorRecoveryLoader />;
      }
      if (this.props.fallback) return this.props.fallback;
      return <DefaultFallback lang={parseLangFromPath()} />;
    }
    return this.props.children;
  }
}

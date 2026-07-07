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

type State = { hasError: boolean };

function parseLangFromPath(): Language {
  const m = window.location.pathname.match(/\/(en|es|uk|ru|ro|ar|sq)(?:\/|$)/);
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

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: Props): void {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const scope = this.props.scope ?? "app";
    console.error(`[kmcheck:${scope}]`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return <DefaultFallback lang={parseLangFromPath()} />;
    }
    return this.props.children;
  }
}

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Printer, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/context";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Soft client cap — server proxy also rate-limits. */
const MAX_MANUAL_RETRIES = 1;
const RETRY_COOLDOWN_MS = 8_000;

export type CarstatUsaPdfReportMeta = {
  type: "carfax" | "autocheck";
  /** Always redacted on the client — use proxy flags instead. */
  pdfUrl?: string | null;
  htmlUrl?: string | null;
  hasPdf?: boolean;
  hasHtml?: boolean;
  reportId?: number | null;
  vehicle?: string | null;
  fetchedAt?: string;
};

type Props = {
  vin: string;
  lookupId?: number | null;
  vehicleTitle: string;
  pdfReport: CarstatUsaPdfReportMeta;
  className?: string;
};

/** Chrome/Edge inline PDF chrome: hide toolbar, fit width. */
function withPdfViewerParams(url: string): string {
  const hash = "toolbar=0&navpanes=0&scrollbar=1&view=FitH";
  const base = url.split("#")[0] ?? url;
  return `${base}#${hash}`;
}

/**
 * Vehicle history report view.
 * Only embeds our authenticated proxies — never provider CDN URLs in the DOM.
 */
export function CarstatUsaPdfReport({
  vin,
  lookupId,
  vehicleTitle,
  pdfReport,
  className,
}: Props) {
  const { t } = useTranslation();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const hasPdf = pdfReport.hasPdf === true || !!(pdfReport.pdfUrl && pdfReport.pdfUrl.trim());
  const hasHtml = pdfReport.hasHtml === true || !!(pdfReport.htmlUrl && pdfReport.htmlUrl.trim());
  const canProxy = lookupId != null && lookupId > 0;

  const mode: "pdf" | "html" | null =
    canProxy && hasPdf ? "pdf" : canProxy && hasHtml ? "html" : null;

  const proxyPath =
    mode === "pdf"
      ? `${basePath}/api/vin/${lookupId}/pdf-proxy`
      : mode === "html"
        ? `${basePath}/api/vin/${lookupId}/html-proxy`
        : null;

  const embedSrc =
    mode === "pdf" && proxyPath
      ? withPdfViewerParams(proxyPath)
      : proxyPath;

  const retriesLeft = Math.max(0, MAX_MANUAL_RETRIES - retryCount);
  const onCooldown = cooldownLeft > 0;
  const canRetry = !loading && retriesLeft > 0 && !onCooldown;

  useEffect(() => {
    setLoading(true);
    setFailed(false);
  }, [embedSrc, reloadKey]);

  useEffect(() => {
    if (cooldownUntil <= Date.now()) {
      setCooldownLeft(0);
      return;
    }
    const tick = () => {
      const left = Math.max(0, cooldownUntil - Date.now());
      setCooldownLeft(left);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [cooldownUntil]);

  const markReady = useCallback(() => {
    setLoading(false);
    setFailed(false);
  }, []);

  const markFailed = useCallback(() => {
    setLoading(false);
    setFailed(true);
  }, []);

  const handlePrint = useCallback(() => {
    const frame = frameRef.current;
    try {
      if (frame?.contentWindow) {
        frame.contentWindow.focus();
        frame.contentWindow.print();
        return;
      }
    } catch {
      /* cross-origin PDF plugin — fall through */
    }
    if (!proxyPath) return;
    const w = window.open(proxyPath, "_blank", "noopener,noreferrer");
    if (!w) return;
    const tryPrint = () => {
      try {
        w.focus();
        w.print();
      } catch {
        /* ignore */
      }
    };
    w.addEventListener("load", () => window.setTimeout(tryPrint, 400));
  }, [proxyPath]);

  const handleReload = useCallback(() => {
    if (loading) return;
    if (retryCount >= MAX_MANUAL_RETRIES) return;
    if (Date.now() < cooldownUntil) return;
    setRetryCount((n) => n + 1);
    setCooldownUntil(Date.now() + RETRY_COOLDOWN_MS);
    setReloadKey((k) => k + 1);
  }, [loading, retryCount, cooldownUntil]);

  const title = `${t("what_we_check_report_title")} ${vin}`;
  const cooldownSec = Math.ceil(cooldownLeft / 1000);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 justify-between min-w-0">
        <div className="min-w-0 space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {t("what_we_check_report_title")}
          </p>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight truncate">{vehicleTitle}</h2>
          <p className="font-mono text-xs text-muted-foreground">{vin}</p>
        </div>
        {embedSrc && (
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {retriesLeft > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl h-9"
                onClick={handleReload}
                disabled={!canRetry}
                title={
                  onCooldown
                    ? `${t("retry")} (${cooldownSec}s)`
                    : `${t("retry")} (${retriesLeft}/${MAX_MANUAL_RETRIES})`
                }
              >
                <RotateCcw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
                {onCooldown ? `${t("retry")} ${cooldownSec}s` : t("retry")}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl h-9"
              onClick={handlePrint}
              disabled={loading || failed}
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              {t("vin_result_print")}
            </Button>
          </div>
        )}
      </div>

      {embedSrc ? (
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-xl border border-border/60 bg-neutral-100 dark:bg-neutral-950",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
            "min-h-[calc(100dvh-11rem)] h-[calc(100dvh-11rem)]",
          )}
        >
          {loading && !failed && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-muted/40 backdrop-blur-[2px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/70" />
              <p className="text-sm text-muted-foreground">{t("loading_report")}</p>
            </div>
          )}

          {failed && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-4 bg-muted/50">
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Report file is not available yet. Try refreshing in a moment.
              </p>
              {canRetry ? (
                <Button type="button" variant="outline" className="rounded-xl" onClick={handleReload}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  {t("retry")}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground text-center">
                  {retriesLeft <= 0
                    ? "Retry limit reached. Please wait before trying again."
                    : `${t("retry")} ${cooldownSec}s`}
                </p>
              )}
            </div>
          )}

          <iframe
            key={`${mode}-${reloadKey}`}
            ref={frameRef}
            title={title}
            src={embedSrc}
            className={cn(
              "absolute inset-0 h-full w-full border-0 bg-background",
              (loading || failed) && "opacity-0",
            )}
            referrerPolicy="no-referrer"
            sandbox={mode === "html" ? "allow-same-origin allow-scripts allow-modals" : undefined}
            onLoad={markReady}
            onError={markFailed}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-16">
          Report file is not available yet. Try refreshing in a moment.
        </p>
      )}
    </div>
  );
}

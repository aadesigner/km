import { useState, useEffect } from "react";
import { useAdminGetSettings, useAdminUpdateSettings } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, CheckCircle2, Loader2, BarChart3, Tag, Info, MousePointerClick } from "lucide-react";

type AnalyticsSettings = {
  analyticsGtmEnabled?: boolean;
  analyticsGtmContainerId?: string | null;
  analyticsGaEnabled?: boolean;
  analyticsGaMeasurementId?: string | null;
  analyticsClarityEnabled?: boolean;
  analyticsClarityProjectId?: string | null;
};

type AnalyticsForm = {
  gtmEnabled: boolean;
  gtmContainerId: string;
  gaEnabled: boolean;
  gaMeasurementId: string;
  clarityEnabled: boolean;
  clarityProjectId: string;
};

const EMPTY_FORM: AnalyticsForm = {
  gtmEnabled: false,
  gtmContainerId: "",
  gaEnabled: false,
  gaMeasurementId: "",
  clarityEnabled: false,
  clarityProjectId: "",
};

export default function AdminAnalytics() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useAdminGetSettings();
  const [form, setForm] = useState<AnalyticsForm>(EMPTY_FORM);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const s = settings as AnalyticsSettings | undefined;
    if (!s) return;
    setForm({
      gtmEnabled: s.analyticsGtmEnabled ?? false,
      gtmContainerId: s.analyticsGtmContainerId ?? "",
      gaEnabled: s.analyticsGaEnabled ?? false,
      gaMeasurementId: s.analyticsGaMeasurementId ?? "",
      clarityEnabled: s.analyticsClarityEnabled ?? false,
      clarityProjectId: s.analyticsClarityProjectId ?? "",
    });
  }, [settings]);

  const updater = useAdminUpdateSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/payments/public-settings"] });
        setError("");
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
      onError: (err: Error) => {
        setError(err.message || "Failed to save analytics settings");
      },
    },
  });

  const handleSave = () => {
    setError("");
    if (form.gtmEnabled && !form.gtmContainerId.trim()) {
      setError("Enter a GTM container ID or disable Google Tag Manager.");
      return;
    }
    if (form.gaEnabled && !form.gaMeasurementId.trim()) {
      setError("Enter a GA measurement ID or disable Google Analytics.");
      return;
    }
    if (form.clarityEnabled && !form.clarityProjectId.trim()) {
      setError("Enter a Clarity project ID or disable Microsoft Clarity.");
      return;
    }

    updater.mutate({
      data: {
        analyticsGtmEnabled: form.gtmEnabled,
        analyticsGtmContainerId: form.gtmContainerId.trim() || null,
        analyticsGaEnabled: form.gaEnabled,
        analyticsGaMeasurementId: form.gaMeasurementId.trim() || null,
        analyticsClarityEnabled: form.clarityEnabled,
        analyticsClarityProjectId: form.clarityProjectId.trim() || null,
      } as never,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure Google Tag Manager, Google Analytics, and Microsoft Clarity for the public website.
        </p>
      </div>

      <Card className="border-0 shadow-sm bg-muted/30">
        <CardContent className="pt-5 pb-4 flex gap-3">
          <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Scripts are injected into the site header on all public pages and the client area (not the admin panel).
            If you use GTM, you can configure GA4 inside GTM and leave direct GA disabled to avoid double counting.
            For Clarity, you can store the project ID here or set the <code className="text-xs bg-muted px-1 rounded">CLARITY_PROJECT_ID</code> environment variable on Railway (DB value takes precedence).
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4 text-blue-600" />
            Google Tag Manager
          </CardTitle>
          <CardDescription>
            Paste your container ID from{" "}
            <a href="https://tagmanager.google.com/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
              tagmanager.google.com
            </a>
            . The standard GTM head script and body noscript are added automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="gtm-enabled" className="font-medium">Enable GTM</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Inject GTM on public pages and the client area (not admin)</p>
            </div>
            <Switch
              id="gtm-enabled"
              checked={form.gtmEnabled}
              onCheckedChange={(v) => setForm((f) => ({ ...f, gtmEnabled: v }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gtm-id">Container ID</Label>
            <Input
              id="gtm-id"
              placeholder="GTM-XXXXXXX"
              value={form.gtmContainerId}
              onChange={(e) => setForm((f) => ({ ...f, gtmContainerId: e.target.value }))}
              disabled={!form.gtmEnabled}
              className="font-mono"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-orange-600" />
            Google Analytics
          </CardTitle>
          <CardDescription>
            Direct GA4 (or legacy UA) via gtag.js. Use a measurement ID from{" "}
            <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
              Google Analytics
            </a>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="ga-enabled" className="font-medium">Enable Google Analytics</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Track SPA page views on public and client routes only (admin excluded)</p>
            </div>
            <Switch
              id="ga-enabled"
              checked={form.gaEnabled}
              onCheckedChange={(v) => setForm((f) => ({ ...f, gaEnabled: v }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ga-id">Measurement ID</Label>
            <Input
              id="ga-id"
              placeholder="G-XXXXXXXXXX"
              value={form.gaMeasurementId}
              onChange={(e) => setForm((f) => ({ ...f, gaMeasurementId: e.target.value }))}
              disabled={!form.gaEnabled}
              className="font-mono"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MousePointerClick className="h-4 w-4 text-violet-600" />
            Microsoft Clarity
          </CardTitle>
          <CardDescription>
            Session recordings and heatmaps from{" "}
            <a href="https://clarity.microsoft.com/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
              clarity.microsoft.com
            </a>
            . Paste your project ID from Setup → Get tracking code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="clarity-enabled" className="font-medium">Enable Microsoft Clarity</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Loads the Clarity tag on public and client routes only (admin excluded)</p>
            </div>
            <Switch
              id="clarity-enabled"
              checked={form.clarityEnabled}
              onCheckedChange={(v) => setForm((f) => ({ ...f, clarityEnabled: v }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clarity-id">Project ID</Label>
            <Input
              id="clarity-id"
              placeholder="xltusyn0a9"
              value={form.clarityProjectId}
              onChange={(e) => setForm((f) => ({ ...f, clarityProjectId: e.target.value }))}
              disabled={!form.clarityEnabled}
              className="font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive font-medium">{error}</p>
      )}

      <div className="flex justify-end">
        <Button
          disabled={updater.isPending}
          className="h-10 px-6 font-semibold gap-2"
          onClick={handleSave}
        >
          {updater.isPending ? <Loader2 className="h-4 w-4 animate-spin" />
            : saved ? <CheckCircle2 className="h-4 w-4" />
            : <Save className="h-4 w-4" />}
          {saved ? "Saved!" : updater.isPending ? "Saving…" : "Save analytics"}
        </Button>
      </div>
    </div>
  );
}

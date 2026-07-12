import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminBanUser, useAdminUnbanUser, useAdminDeleteUser, useAdminGetUser, getAdminGetUserQueryKey } from "@workspace/api-client-react";
import type { ApiError } from "@workspace/api-client-react";
import { invalidateVinReportCaches } from "@/lib/vin-report-cache";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Mail, Calendar, Clock, Key, Gift,
  Ban, CheckCircle2, Loader2, Save, Car,
  ShieldOff, AlertTriangle, ImageOff, ChevronLeft, ChevronRight, Trash2,
  DollarSign, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  isBanned: boolean;
  isAdmin: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  totalChecks?: number;
  totalSpent?: number;
}

interface VinData {
  make?: string;
  model?: string;
  year?: number;
  odometer?: number;
  accidentCount?: number;
  isSalvage?: boolean;
  photos?: string[];
}

interface VinLookup {
  id: number;
  vin: string;
  status: string;
  providerName: string | null;
  createdAt: string;
  data?: VinData | null;
}

interface Msg { ok: boolean; text: string }

function VinPhoto({ photos }: { photos?: string[] }) {
  const [err, setErr] = useState(false);
  const url = photos?.[0];
  if (!url || err) {
    return (
      <div className="h-12 w-16 md:h-14 md:w-[4.5rem] rounded-lg bg-muted/80 flex items-center justify-center shrink-0 ring-1 ring-border/40">
        <ImageOff className="h-4 w-4 text-muted-foreground/40" />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt="vehicle"
      className="h-12 w-16 md:h-14 md:w-[4.5rem] rounded-lg object-cover shrink-0 ring-1 ring-border/40"
      onError={() => setErr(true)}
    />
  );
}

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-lg md:rounded-xl border border-border/50 bg-card shadow-sm", className)}>
      {children}
    </div>
  );
}

function SectionLabel({
  icon: Icon,
  title,
  hint,
}: {
  icon: React.ElementType;
  title: string;
  hint?: string;
}) {
  return (
    <div className="px-3.5 pt-3.5 pb-2.5 md:px-4 md:pt-4 md:pb-3 border-b border-border/40">
      <h2 className="text-sm md:text-base font-semibold flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary shrink-0" />
        {title}
      </h2>
      {hint && <p className="text-[11px] md:text-xs text-muted-foreground mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  );
}

function userInitials(user: { name?: string | null; email: string }): string {
  const source = user.name?.trim() || user.email.trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function StatusMessage({ msg }: { msg: Msg }) {
  return (
    <p className={cn("text-xs font-medium", msg.ok ? "text-primary" : "text-destructive")}>
      {msg.text}
    </p>
  );
}

export default function AdminUserDetail({ params }: { params: { userId: string } }) {
  const userId = params.userId;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [grantVin, setGrantVin] = useState("");
  const [lookups, setLookups] = useState<VinLookup[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [lookupsTotal, setLookupsTotal] = useState(0);
  const [lookupsPage, setLookupsPage] = useState(1);
  const LOOKUPS_LIMIT = 10;
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [granting, setGranting] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [detailsMsg, setDetailsMsg] = useState<Msg | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<Msg | null>(null);
  const [grantMsg, setGrantMsg] = useState<Msg | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    data: user,
    isLoading: userLoading,
    isError: userLoadFailed,
    error: userLoadError,
    refetch: refetchUser,
  } = useAdminGetUser(userId);

  const userError = userLoadFailed
    ? ((userLoadError as ApiError<{ error?: string }>)?.data?.error
      ?? (userLoadError as Error)?.message
      ?? "Failed to load user")
    : null;

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    queryClient.invalidateQueries({ queryKey: getAdminGetUserQueryKey(userId) });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
  };

  const banUser = useAdminBanUser({ mutation: { onSuccess: invalidateUsers } });
  const unbanUser = useAdminUnbanUser({ mutation: { onSuccess: invalidateUsers } });
  const deleteUser = useAdminDeleteUser({
    mutation: {
      onSuccess: () => {
        setDeleteOpen(false);
        invalidateUsers();
        setLocation("/adminx/users");
      },
      onError: (err: unknown) => {
        const apiErr = err as ApiError<{ error?: string }>;
        const msg = apiErr?.data?.error ?? (err as { message?: string })?.message ?? "Failed to delete user";
        setDeleteError(msg);
      },
    },
  });

  const loadHistory = (page: number) => {
    setLookupsLoading(true);
    fetch(`${basePath}/api/admin/users/${encodeURIComponent(userId)}/history?page=${page}&limit=${LOOKUPS_LIMIT}`, { credentials: "include" })
      .then(r => r.json())
      .then((d: { items?: VinLookup[]; total?: number }) => {
        setLookups(d.items ?? []);
        setLookupsTotal(d.total ?? 0);
      })
      .catch(() => setLookups([]))
      .finally(() => setLookupsLoading(false));
  };

  useEffect(() => {
    setNewPassword("");
    setGrantVin("");
    setDetailsMsg(null);
    setPasswordMsg(null);
    setGrantMsg(null);
    setDeleteOpen(false);
    setDeleteEmail("");
    setDeleteError(null);
    setLookupsPage(1);
  }, [userId]);

  useEffect(() => {
    if (!user) return;
    setEditName(user.name ?? "");
    setEditEmail(user.email);
  }, [user?.id, user?.email, user?.name]);

  useEffect(() => {
    if (!user) return;
    loadHistory(lookupsPage);
  }, [user?.id, lookupsPage]);

  const totalPages = Math.ceil(lookupsTotal / LOOKUPS_LIMIT) || 1;
  const emailMatches = user ? deleteEmail.trim().toLowerCase() === user.email.toLowerCase() : false;

  const patch = async (body: Record<string, unknown>) => {
    const resp = await fetch(`${basePath}/api/admin/users/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    return resp.json() as Promise<UserRow & { error?: string }>;
  };

  const handleSaveDetails = async () => {
    setSavingDetails(true);
    setDetailsMsg(null);
    try {
      const data = await patch({ name: editName || null, email: editEmail });
      if ("error" in data && data.error) { setDetailsMsg({ ok: false, text: data.error }); return; }
      setDetailsMsg({ ok: true, text: "Details updated" });
      invalidateUsers();
    } catch { setDetailsMsg({ ok: false, text: "Network error" }); }
    finally { setSavingDetails(false); }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) return;
    setSavingPassword(true);
    setPasswordMsg(null);
    try {
      const data = await patch({ password: newPassword });
      if ("error" in data && data.error) { setPasswordMsg({ ok: false, text: data.error }); return; }
      setNewPassword("");
      setPasswordMsg({ ok: true, text: "Password reset successfully" });
    } catch { setPasswordMsg({ ok: false, text: "Network error" }); }
    finally { setSavingPassword(false); }
  };

  const handleRevokeAccess = async (lookupId: number) => {
    if (!confirm("Revoke this user's access to the VIN report?\n\nThe report data stays in the database — only this user's access is removed.")) return;
    setRevokingId(lookupId);
    try {
      await fetch(`${basePath}/api/admin/users/${encodeURIComponent(userId)}/lookups/${lookupId}`, {
        method: "DELETE", credentials: "include",
      });
      loadHistory(lookupsPage);
      invalidateUsers();
      void refetchUser();
    } catch { /* silent */ }
    finally { setRevokingId(null); }
  };

  const handleGrantAnalysis = async () => {
    const vin = grantVin.trim().toUpperCase();
    if (vin.length !== 17) return;
    setGranting(true);
    setGrantMsg(null);
    try {
      const resp = await fetch(`${basePath}/api/admin/users/${encodeURIComponent(userId)}/grant-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ vin }),
      });
      const data = await resp.json() as { error?: string; fromCache?: boolean; lookupId?: number };
      if (resp.status === 409) {
        setGrantMsg({ ok: false, text: data.error ?? "User already has this report" });
        return;
      }
      if (!resp.ok) { setGrantMsg({ ok: false, text: data.error ?? "Failed to grant" }); return; }
      setGrantVin("");
      const source = data.fromCache ? "from cache" : "fetched from provider";
      setGrantMsg({ ok: true, text: `Report added to account (${source})` });
      loadHistory(1);
      setLookupsPage(1);
      invalidateUsers();
      invalidateVinReportCaches(queryClient, vin);
      void refetchUser();
    } catch { setGrantMsg({ ok: false, text: "Network error" }); }
    finally { setGranting(false); }
  };

  const handleDeleteUser = () => {
    if (!emailMatches) return;
    setDeleteError(null);
    deleteUser.mutate({
      userId,
      data: { confirmEmail: deleteEmail.trim() },
    });
  };

  if (userLoading) {
    return (
      <div className="space-y-4 md:space-y-5 max-w-5xl">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-3 md:gap-4">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (userError || !user) {
    return (
      <Panel className="flex flex-col items-center justify-center py-16 md:py-20 px-4 text-center max-w-lg mx-auto">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-destructive/70" />
        </div>
        <p className="text-sm md:text-base font-medium">{userError ?? "User not found"}</p>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">This account may have been removed or the link is invalid.</p>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          <Button variant="outline" size="sm" onClick={() => void refetchUser()}>Retry</Button>
          <Button variant="outline" size="sm" onClick={() => setLocation("/adminx/users")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Users
          </Button>
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5 lg:space-y-6 max-w-5xl">
      <Panel className="overflow-hidden">
        <div className="p-3.5 md:p-5">
          <Link href="/adminx/users">
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 mb-3 h-8 px-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Users
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-lg md:text-xl font-bold ring-2 ring-primary/10">
              {userInitials(user)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">
                  {user.name || user.email}
                </h1>
                <Badge
                  variant={user.isBanned ? "destructive" : "default"}
                  className={cn(!user.isBanned && "bg-primary/10 text-primary border-primary/20 hover:bg-primary/10")}
                >
                  {user.isBanned ? "Banned" : "Active"}
                </Badge>
                {user.isAdmin && <Badge variant="secondary">Admin</Badge>}
              </div>
              {user.name && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {user.email}
                </p>
              )}
              {!user.name && (
                <p className="text-sm text-muted-foreground mt-1 font-mono truncate">{user.id}</p>
              )}
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3">
        <Panel className="px-3.5 py-3 md:px-4 md:py-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] md:text-xs text-muted-foreground uppercase tracking-wide">VIN checks</span>
            <Search className="h-3.5 w-3.5 text-primary/60" />
          </div>
          <p className="text-xl md:text-2xl font-bold tabular-nums">{user.totalChecks ?? 0}</p>
        </Panel>
        <Panel className="px-3.5 py-3 md:px-4 md:py-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] md:text-xs text-muted-foreground uppercase tracking-wide">Total spent</span>
            <DollarSign className="h-3.5 w-3.5 text-primary/60" />
          </div>
          <p className="text-xl md:text-2xl font-bold tabular-nums">€{(user.totalSpent ?? 0).toFixed(2)}</p>
        </Panel>
        <Panel className="px-3.5 py-3 md:px-4 md:py-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] md:text-xs text-muted-foreground uppercase tracking-wide">Joined</span>
            <Calendar className="h-3.5 w-3.5 text-primary/60" />
          </div>
          <p className="text-sm md:text-base font-semibold tabular-nums">
            {new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </Panel>
        <Panel className="px-3.5 py-3 md:px-4 md:py-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] md:text-xs text-muted-foreground uppercase tracking-wide">Last login</span>
            <Clock className="h-3.5 w-3.5 text-primary/60" />
          </div>
          <p className="text-sm md:text-base font-semibold tabular-nums">
            {user.lastLoginAt
              ? new Date(user.lastLoginAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
              : "Never"}
          </p>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-3 md:gap-4">
        <div className="space-y-3 md:space-y-4">
          <Panel className="overflow-hidden">
            <SectionLabel icon={Mail} title="Edit details" />
            <div className="p-3.5 md:p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Display name</Label>
                  <Input placeholder="Name" value={editName} onChange={e => setEditName(e.target.value)} className="h-9 md:h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input type="email" placeholder="email@example.com" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="h-9 md:h-10" />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <Button size="sm" onClick={handleSaveDetails} disabled={savingDetails} className="h-9">
                  {savingDetails ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  <span className="ml-1.5">Save details</span>
                </Button>
                {detailsMsg && <StatusMessage msg={detailsMsg} />}
              </div>
            </div>
          </Panel>

          {!user.isAdmin && (
            <Panel className="overflow-hidden">
              <SectionLabel icon={Key} title="Reset password" />
              <div className="p-3.5 md:p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="password"
                    placeholder="New password (min 6 chars)"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="h-9 md:h-10 flex-1"
                    onKeyDown={e => { if (e.key === "Enter") handleResetPassword(); }}
                  />
                  <Button size="sm" onClick={handleResetPassword} disabled={savingPassword || newPassword.length < 6} className="h-9 md:h-10 shrink-0">
                    {savingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Set password"}
                  </Button>
                </div>
                {passwordMsg && <StatusMessage msg={passwordMsg} />}
              </div>
            </Panel>
          )}

          <Panel className="overflow-hidden">
            <SectionLabel
              icon={Gift}
              title="Grant free analysis"
              hint="Adds the full report to this user's account immediately. Uses catalog or existing cache when available — only fetches from the provider when no data exists yet."
            />
            <div className="p-3.5 md:p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="17-character VIN"
                  value={grantVin}
                  onChange={e => setGrantVin(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, ""))}
                  className="h-9 md:h-10 flex-1 font-mono text-xs tracking-wide"
                  maxLength={17}
                  onKeyDown={e => { if (e.key === "Enter" && grantVin.length === 17) handleGrantAnalysis(); }}
                />
                <Button size="sm" onClick={handleGrantAnalysis} disabled={granting || grantVin.length !== 17} className="h-9 md:h-10 shrink-0">
                  {granting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Gift className="h-3.5 w-3.5 mr-1" />}
                  Grant
                </Button>
              </div>
              {grantMsg && <StatusMessage msg={grantMsg} />}
            </div>
          </Panel>
        </div>

        <div className="space-y-3 md:space-y-4">
          <Panel className="overflow-hidden lg:row-span-2">
            <div className="px-3.5 pt-3.5 pb-2.5 md:px-4 md:pt-4 md:pb-3 border-b border-border/40 flex items-center justify-between gap-3">
              <h2 className="text-sm md:text-base font-semibold flex items-center gap-2 min-w-0">
                <Car className="h-4 w-4 text-primary shrink-0" />
                VIN lookups
                <span className="text-xs font-normal text-muted-foreground tabular-nums">({lookupsTotal})</span>
              </h2>
              {totalPages > 1 && (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[11px] text-muted-foreground tabular-nums mr-1">{lookupsPage}/{totalPages}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" disabled={lookupsPage <= 1} onClick={() => setLookupsPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" disabled={lookupsPage >= totalPages} onClick={() => setLookupsPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="p-2 md:p-3">
              {lookupsLoading ? (
                <div className="space-y-2 px-1">
                  {[0, 1, 2].map(i => <Skeleton key={i} className="h-[4.5rem] rounded-lg" />)}
                </div>
              ) : lookups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center mb-3">
                    <Car className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">No VIN lookups yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40 rounded-lg overflow-hidden border border-border/40">
                  {lookups.map(lookup => {
                    const vd = lookup.data;
                    const vehicleName = vd?.make && vd?.model
                      ? `${vd.year ? vd.year + " " : ""}${vd.make} ${vd.model}`
                      : null;

                    return (
                      <div
                        key={lookup.id}
                        className="flex items-center gap-3 p-2.5 md:p-3 bg-card hover:bg-muted/30 transition-colors"
                      >
                        <VinPhoto photos={vd?.photos} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link href={`/adminx/vin/${lookup.vin}`}>
                              <span className="font-mono text-xs font-semibold hover:text-primary transition-colors">{lookup.vin}</span>
                            </Link>
                            <Badge
                              variant={lookup.status === "complete" ? "default" : "secondary"}
                              className="text-[10px] py-0 h-4 shrink-0"
                            >
                              {lookup.status}
                            </Badge>
                          </div>
                          {vehicleName && (
                            <p className="text-xs md:text-sm text-foreground font-medium mt-0.5 truncate">{vehicleName}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {vd?.odometer != null && (
                              <span className="text-[10px] md:text-xs text-muted-foreground tabular-nums">{vd.odometer.toLocaleString()} km</span>
                            )}
                            {(vd?.accidentCount ?? 0) > 0 && (
                              <Badge variant="destructive" className="text-[10px] py-0 h-4">
                                {vd!.accidentCount} accident{vd!.accidentCount! > 1 ? "s" : ""}
                              </Badge>
                            )}
                            {vd?.isSalvage && (
                              <Badge variant="outline" className="text-[10px] py-0 h-4 border-orange-400 text-orange-600">
                                Salvage
                              </Badge>
                            )}
                            <span className="text-[10px] md:text-xs text-muted-foreground">
                              {new Date(lookup.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {lookup.status === "complete" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-950/30 gap-1.5 text-xs h-8"
                            onClick={() => handleRevokeAccess(lookup.id)}
                            disabled={revokingId === lookup.id}
                            title="Revoke access — keeps data in DB, removes payment access"
                          >
                            {revokingId === lookup.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <ShieldOff className="h-3 w-3" />}
                            Revoke
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Panel>

          {!user.isAdmin && (
            <Panel className="overflow-hidden">
              <div className="p-3.5 md:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    {user.isBanned ? <Ban className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-primary" />}
                    Account status
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {user.isBanned ? "This account is currently banned from the platform." : "This account is active and in good standing."}
                  </p>
                </div>
                {user.isBanned ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => { unbanUser.mutate({ userId: user.id }); void refetchUser(); }}
                    disabled={unbanUser.isPending}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Unban
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="shrink-0"
                    onClick={() => { banUser.mutate({ userId: user.id, data: { reason: "Admin action" } }); void refetchUser(); }}
                    disabled={banUser.isPending}
                  >
                    <Ban className="h-3.5 w-3.5 mr-1.5" />
                    Ban user
                  </Button>
                )}
              </div>
            </Panel>
          )}
        </div>
      </div>

      {!user.isAdmin && (
        <Panel className="overflow-hidden border-destructive/30 bg-destructive/[0.03]">
          <div className="p-3.5 md:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-destructive flex items-center gap-1.5">
                <Trash2 className="h-4 w-4" />
                Remove user
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-xl">
                Permanently deletes this account, all payments, and VIN lookup history.
                Shared VIN catalog data is kept for other users.
              </p>
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="shrink-0"
              onClick={() => {
                setDeleteEmail("");
                setDeleteError(null);
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Remove user
            </Button>
          </div>
        </Panel>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={(open) => { if (!deleteUser.isPending) setDeleteOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove user permanently?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  This will delete <span className="font-medium text-foreground">{user.email}</span> and wipe:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Account profile and login credentials</li>
                  <li>All payments and transactions</li>
                  <li>All VIN lookups tied to this user</li>
                </ul>
                <p>VIN catalog entries stay in the system. This cannot be undone.</p>
                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="delete-confirm-email" className="text-xs text-foreground">
                    Type <span className="font-mono font-semibold">{user.email}</span> to confirm
                  </Label>
                  <Input
                    id="delete-confirm-email"
                    value={deleteEmail}
                    onChange={(e) => { setDeleteEmail(e.target.value); setDeleteError(null); }}
                    placeholder={user.email}
                    className="h-9 font-mono text-xs"
                    autoComplete="off"
                  />
                </div>
                {deleteError && (
                  <p className="text-xs text-destructive">{deleteError}</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUser.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!emailMatches || deleteUser.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteUser();
              }}
            >
              {deleteUser.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Removing…
                </>
              ) : (
                "Remove user permanently"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

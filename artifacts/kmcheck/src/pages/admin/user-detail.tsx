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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, User2, Mail, Calendar, Clock, Key, Gift,
  Ban, CheckCircle2, Loader2, Save, Car,
  ShieldOff, AlertTriangle, ImageOff, ChevronLeft, ChevronRight, Trash2,
} from "lucide-react";

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
      <div className="h-10 w-14 rounded bg-muted flex items-center justify-center shrink-0">
        <ImageOff className="h-3.5 w-3.5 text-muted-foreground/40" />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt="vehicle"
      className="h-10 w-14 rounded object-cover shrink-0"
      onError={() => setErr(true)}
    />
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
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="h-10 w-10 text-destructive/60" />
        <p className="text-muted-foreground">{userError ?? "User not found"}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void refetchUser()}>Retry</Button>
          <Button variant="outline" onClick={() => setLocation("/adminx/users")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/adminx/users">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Users
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate flex items-center gap-2 flex-wrap">
            <User2 className="h-5 w-5 shrink-0" />
            {user.email}
          </h1>
          {user.name && <p className="text-sm text-muted-foreground mt-0.5">{user.name}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={user.isBanned ? "destructive" : "default"} className={!user.isBanned ? "bg-green-100 text-green-800 border-0" : ""}>
            {user.isBanned ? "Banned" : "Active"}
          </Badge>
          {user.isAdmin && <Badge variant="secondary">Admin</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-background p-4 text-center">
          <div className="text-2xl font-bold">{user.totalChecks ?? 0}</div>
          <div className="text-xs text-muted-foreground mt-0.5">VIN Checks</div>
        </div>
        <div className="rounded-xl border bg-background p-4 text-center">
          <div className="text-2xl font-bold">€{(user.totalSpent ?? 0).toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Total Spent</div>
        </div>
        <div className="rounded-xl border bg-background p-4 text-center col-span-2 sm:col-span-1">
          <div className="text-sm font-medium flex items-center justify-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(user.createdAt).toLocaleDateString()}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Joined</div>
        </div>
        <div className="rounded-xl border bg-background p-4 text-center col-span-2 sm:col-span-1">
          <div className="text-sm font-medium flex items-center justify-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Last Login</div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />Edit Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Display Name</Label>
              <Input placeholder="Name" value={editName} onChange={e => setEditName(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input type="email" placeholder="email@example.com" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="h-9" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSaveDetails} disabled={savingDetails}>
              {savingDetails ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span className="ml-1.5">Save Details</span>
            </Button>
            {detailsMsg && (
              <p className={`text-xs ${detailsMsg.ok ? "text-green-600" : "text-destructive"}`}>{detailsMsg.text}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {!user.isAdmin && (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" />Reset Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="New password (min 6 chars)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="h-9 flex-1"
              onKeyDown={e => { if (e.key === "Enter") handleResetPassword(); }}
            />
            <Button size="sm" onClick={handleResetPassword} disabled={savingPassword || newPassword.length < 6}>
              {savingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Set Password"}
            </Button>
          </div>
          {passwordMsg && (
            <p className={`text-xs ${passwordMsg.ok ? "text-green-600" : "text-destructive"}`}>{passwordMsg.text}</p>
          )}
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="h-4 w-4" />Grant Free Analysis
          </CardTitle>
          <p className="text-xs text-muted-foreground font-normal">
            Adds the full report to this user&apos;s account immediately. Uses catalog or existing cache when available — only fetches from the provider when no data exists yet.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="17-character VIN"
              value={grantVin}
              onChange={e => setGrantVin(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, ""))}
              className="h-9 flex-1 font-mono text-xs"
              maxLength={17}
              onKeyDown={e => { if (e.key === "Enter" && grantVin.length === 17) handleGrantAnalysis(); }}
            />
            <Button size="sm" onClick={handleGrantAnalysis} disabled={granting || grantVin.length !== 17}>
              {granting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Gift className="h-3.5 w-3.5 mr-1" />}
              Grant
            </Button>
          </div>
          {grantMsg && (
            <p className={`text-xs ${grantMsg.ok ? "text-green-600" : "text-destructive"}`}>{grantMsg.text}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-4 w-4" />VIN Lookups
              <span className="text-xs font-normal text-muted-foreground">({lookupsTotal})</span>
            </CardTitle>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{lookupsPage}/{totalPages}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6" disabled={lookupsPage <= 1} onClick={() => setLookupsPage(p => p - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" disabled={lookupsPage >= totalPages} onClick={() => setLookupsPage(p => p + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {lookupsLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map(i => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : lookups.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No VIN lookups yet</p>
          ) : (
            <div className="space-y-1.5">
              {lookups.map(lookup => {
                const vd = lookup.data;
                const vehicleName = vd?.make && vd?.model
                  ? `${vd.year ? vd.year + " " : ""}${vd.make} ${vd.model}`
                  : null;

                return (
                  <div
                    key={lookup.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg border text-sm hover:bg-muted/30 transition-colors"
                  >
                    <VinPhoto photos={vd?.photos} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link href={`/adminx/vin/${lookup.vin}`}>
                          <span className="font-mono text-xs font-semibold hover:underline">{lookup.vin}</span>
                        </Link>
                        <Badge
                          variant={lookup.status === "complete" ? "default" : "secondary"}
                          className="text-[10px] py-0 h-4 shrink-0"
                        >
                          {lookup.status}
                        </Badge>
                      </div>
                      {vehicleName && (
                        <p className="text-xs text-foreground font-medium mt-0.5 truncate">{vehicleName}</p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {vd?.odometer != null && (
                          <span className="text-[10px] text-muted-foreground tabular-nums">{vd.odometer.toLocaleString()} km</span>
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
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(lookup.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {lookup.status === "complete" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700 gap-1.5 text-xs"
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
        </CardContent>
      </Card>

      {!user.isAdmin && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold">Account Status</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {user.isBanned ? "This account is currently banned from the platform." : "This account is active and in good standing."}
                </p>
              </div>
              {user.isBanned ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { unbanUser.mutate({ userId: user.id }); void refetchUser(); }}
                  disabled={unbanUser.isPending}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Unban
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => { banUser.mutate({ userId: user.id, data: { reason: "Admin action" } }); void refetchUser(); }}
                  disabled={banUser.isPending}
                >
                  <Ban className="h-3.5 w-3.5 mr-1.5" />
                  Ban User
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!user.isAdmin && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-destructive flex items-center gap-1.5">
              <Trash2 className="h-3.5 w-3.5" />
              Remove User
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Permanently deletes this account, all payments, and VIN lookup history.
              Shared VIN catalog data is kept for other users.
            </p>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              setDeleteEmail("");
              setDeleteError(null);
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Remove User
          </Button>
        </div>
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

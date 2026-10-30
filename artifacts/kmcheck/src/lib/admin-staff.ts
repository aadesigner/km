import type { AuthUser } from "@/lib/auth-types";
import type { AdminRouteMatch } from "@/lib/admin-routes";

export type StaffRole = "admin" | "editor";

const EDITOR_ROUTE_IDS = new Set<AdminRouteMatch["id"]>([
  "overview",
  "analytics",
  "users",
  "user-detail",
  "lookups",
  "vin-catalog",
  "vin-detail",
  "pending-vin-checks",
  "pending-vin-detail",
  "transactions",
  "not-found",
]);

export function staffRoleFromUser(user: { isAdmin?: boolean; isEditor?: boolean } | null | undefined): StaffRole | null {
  if (user?.isAdmin === true) return "admin";
  if (user?.isEditor === true) return "editor";
  return null;
}

export function canAccessAdminArea(user: AuthUser | { isAdmin?: boolean; isEditor?: boolean } | null | undefined): boolean {
  return staffRoleFromUser(user) !== null;
}

export function isFullAdmin(user: { isAdmin?: boolean; isEditor?: boolean } | null | undefined): boolean {
  return staffRoleFromUser(user) === "admin";
}

export function canAccessAdminRoute(
  user: { isAdmin?: boolean; isEditor?: boolean } | null | undefined,
  routeId: AdminRouteMatch["id"],
): boolean {
  const role = staffRoleFromUser(user);
  if (!role) return false;
  if (role === "admin") return true;
  return EDITOR_ROUTE_IDS.has(routeId);
}

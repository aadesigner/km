/** Warm admin shell + dashboard before navigating from the public site. */
export function prefetchAdminArea(): void {
  void import("@/pages/admin/layout");
  void import("@/pages/admin/index");
  void import("@/pages/admin/admin-dashboard-chart").catch(() => {});
}

/**
 * Navigate to /adminx after closing overlays (user menu, etc.).
 * Defers one frame so dropdown portals can unmount cleanly before the route swap.
 */
export function scheduleAdminNavigation(
  setLocation: (path: string, options?: { replace?: boolean }) => void,
  beforeNav?: () => void,
): void {
  beforeNav?.();
  prefetchAdminArea();
  window.requestAnimationFrame(() => {
    setLocation("/adminx");
  });
}

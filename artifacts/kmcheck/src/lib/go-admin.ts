/** Navigate to the admin panel from the public site shell. */
export function navigateToAdmin(
  setLocation: (path: string, options?: { replace?: boolean }) => void,
  beforeNav?: () => void,
): void {
  beforeNav?.();
  setLocation("/adminx");
}

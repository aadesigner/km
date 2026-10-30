export type StaffRole = "admin" | "editor";

export type StaffFlags = {
  isAdmin?: boolean | null;
  isEditor?: boolean | null;
};

/** Admin always wins if both flags are set. */
export function staffRoleFromFlags(flags: StaffFlags): StaffRole | null {
  if (flags.isAdmin === true) return "admin";
  if (flags.isEditor === true) return "editor";
  return null;
}

export function isStaffFlags(flags: StaffFlags): boolean {
  return staffRoleFromFlags(flags) !== null;
}

export function isFullAdminFlags(flags: StaffFlags): boolean {
  return staffRoleFromFlags(flags) === "admin";
}

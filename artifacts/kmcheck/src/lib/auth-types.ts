export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  isAdmin: boolean;
  isBanned: boolean;
  hasPassword: boolean;
  createdAt?: string | Date | null;
}

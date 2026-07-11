export type AuthSessionUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  passwordHash: string | null;
  isAdmin: boolean;
  isBanned: boolean;
  createdAt: Date;
};

export type OAuthUser = AuthSessionUser & {
  googleId: string | null;
  facebookId: string | null;
  linkedinId: string | null;
  authProvider: string;
};

export function toPublicUser(user: AuthSessionUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    isAdmin: user.isAdmin,
    isBanned: user.isBanned,
    hasPassword: !!user.passwordHash,
    createdAt: user.createdAt,
  };
}

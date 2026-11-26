export type AppRole =
  | 'CLIENT'
  | 'SHAREHOLDER'
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'PROJECT_MANAGER'
  | 'CLIENT_ADMIN';

export type AuthenticatedUser = {
  userId: string;
  tenantId: string;
  role: AppRole;
  email?: string;
};

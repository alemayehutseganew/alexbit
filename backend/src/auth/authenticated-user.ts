export type AppRole =
  | 'CLIENT'
  | 'SHAREHOLDER'
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'PROJECT_MANAGER'
  | 'CLIENT_ADMIN'
  | 'SHAREHOLDER_ADMIN'
  | 'SHAREHOLDER_MANAGER';

export type AuthenticatedUser = {
  userId: string;
  tenantId: string;
  role: AppRole;
  email?: string;
};

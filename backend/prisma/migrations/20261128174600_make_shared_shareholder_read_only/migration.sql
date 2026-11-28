UPDATE "User"
SET "role" = 'SHAREHOLDER'
WHERE "email" = 'shareholder@primehorizon.com'
  AND "role" = 'SHAREHOLDER_MANAGER';

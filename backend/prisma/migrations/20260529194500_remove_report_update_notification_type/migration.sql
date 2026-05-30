-- Remove REPORT_UPDATE from NotificationType enum
-- First delete any existing rows using the value about to be removed
DELETE FROM "notifications" WHERE "type" = 'REPORT_UPDATE';

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('COMMENT_ON_POST', 'REPLY_TO_COMMENT', 'LIKE');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

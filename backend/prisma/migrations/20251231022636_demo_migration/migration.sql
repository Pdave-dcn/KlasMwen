-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'GUEST';

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "isMock" BOOLEAN NOT NULL DEFAULT false;

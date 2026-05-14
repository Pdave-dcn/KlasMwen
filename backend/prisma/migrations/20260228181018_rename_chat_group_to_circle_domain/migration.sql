/*
  Warnings:

  - You are about to drop the `chat_group_avatars` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chat_group_tags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chat_groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chat_members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chat_messages` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "CircleRole" AS ENUM ('OWNER', 'MODERATOR', 'MEMBER');

-- DropForeignKey
ALTER TABLE "chat_group_tags" DROP CONSTRAINT "chat_group_tags_chat_group_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_group_tags" DROP CONSTRAINT "chat_group_tags_tag_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_groups" DROP CONSTRAINT "chat_groups_avatar_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_groups" DROP CONSTRAINT "chat_groups_creator_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_members" DROP CONSTRAINT "chat_members_chat_group_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_members" DROP CONSTRAINT "chat_members_user_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_chat_group_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_sender_id_fkey";

-- DropTable
DROP TABLE "chat_group_avatars";

-- DropTable
DROP TABLE "chat_group_tags";

-- DropTable
DROP TABLE "chat_groups";

-- DropTable
DROP TABLE "chat_members";

-- DropTable
DROP TABLE "chat_messages";

-- DropEnum
DROP TYPE "ChatRole";

-- CreateTable
CREATE TABLE "circles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creator_id" TEXT NOT NULL,
    "avatar_id" INTEGER,

    CONSTRAINT "circles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circle_members" (
    "user_id" TEXT NOT NULL,
    "circle_id" TEXT NOT NULL,
    "role" "CircleRole" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "muted_until" TIMESTAMP(3),
    "last_read_at" TIMESTAMP(3),

    CONSTRAINT "circle_members_pkey" PRIMARY KEY ("user_id","circle_id")
);

-- CreateTable
CREATE TABLE "circle_messages" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sender_id" TEXT NOT NULL,
    "circle_id" TEXT NOT NULL,

    CONSTRAINT "circle_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circle_avatars" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "circle_avatars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circle_tags" (
    "circle_id" TEXT NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "circle_tags_pkey" PRIMARY KEY ("circle_id","tag_id")
);

-- CreateIndex
CREATE INDEX "circle_messages_circle_id_created_at_idx" ON "circle_messages"("circle_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "circle_avatars_url_key" ON "circle_avatars"("url");

-- AddForeignKey
ALTER TABLE "circles" ADD CONSTRAINT "circles_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circles" ADD CONSTRAINT "circles_avatar_id_fkey" FOREIGN KEY ("avatar_id") REFERENCES "circle_avatars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circle_members" ADD CONSTRAINT "circle_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circle_members" ADD CONSTRAINT "circle_members_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circle_messages" ADD CONSTRAINT "circle_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circle_messages" ADD CONSTRAINT "circle_messages_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circle_tags" ADD CONSTRAINT "circle_tags_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circle_tags" ADD CONSTRAINT "circle_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

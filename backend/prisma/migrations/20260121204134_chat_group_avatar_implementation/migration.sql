-- AlterTable
ALTER TABLE "chat_groups" ADD COLUMN     "avatar_id" INTEGER;

-- CreateTable
CREATE TABLE "chat_group_avatars" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "chat_group_avatars_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_group_avatars_url_key" ON "chat_group_avatars"("url");

-- AddForeignKey
ALTER TABLE "chat_groups" ADD CONSTRAINT "chat_groups_avatar_id_fkey" FOREIGN KEY ("avatar_id") REFERENCES "chat_group_avatars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

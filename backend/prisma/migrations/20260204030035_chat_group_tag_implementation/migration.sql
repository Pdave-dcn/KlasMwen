-- CreateTable
CREATE TABLE "chat_group_tags" (
    "chat_group_id" TEXT NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "chat_group_tags_pkey" PRIMARY KEY ("chat_group_id","tag_id")
);

-- AddForeignKey
ALTER TABLE "chat_group_tags" ADD CONSTRAINT "chat_group_tags_chat_group_id_fkey" FOREIGN KEY ("chat_group_id") REFERENCES "chat_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_group_tags" ADD CONSTRAINT "chat_group_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

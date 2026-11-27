-- AlterTable
ALTER TABLE "books" ADD COLUMN     "is_pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_read_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "books_user_id_is_pinned_idx" ON "books"("user_id", "is_pinned");

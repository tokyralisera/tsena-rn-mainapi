/*
  Warnings:

  - The primary key for the `info_publications` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `info_publications` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `publicationId` on the `info_publication_likes` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."info_publication_likes" DROP CONSTRAINT "info_publication_likes_publicationId_fkey";

-- AlterTable
ALTER TABLE "public"."info_publication_likes" DROP COLUMN "publicationId",
ADD COLUMN     "publicationId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."info_publications" DROP CONSTRAINT "info_publications_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "info_publications_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "info_publication_likes_publicationId_idx" ON "public"."info_publication_likes"("publicationId");

-- CreateIndex
CREATE UNIQUE INDEX "info_publication_likes_publicationId_userId_key" ON "public"."info_publication_likes"("publicationId", "userId");

-- AddForeignKey
ALTER TABLE "public"."info_publication_likes" ADD CONSTRAINT "info_publication_likes_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "public"."info_publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

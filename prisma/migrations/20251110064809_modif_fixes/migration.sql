/*
  Warnings:

  - The primary key for the `info_publication_likes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `info_publication_likes` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."info_publication_likes" DROP CONSTRAINT "info_publication_likes_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "info_publication_likes_pkey" PRIMARY KEY ("id");

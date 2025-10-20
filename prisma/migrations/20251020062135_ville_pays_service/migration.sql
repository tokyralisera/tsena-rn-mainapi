/*
  Warnings:

  - Made the column `villeId` on table `publications` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."publications" DROP CONSTRAINT "publications_villeId_fkey";

-- AlterTable
ALTER TABLE "public"."publications" ALTER COLUMN "villeId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."publications" ADD CONSTRAINT "publications_villeId_fkey" FOREIGN KEY ("villeId") REFERENCES "public"."villes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

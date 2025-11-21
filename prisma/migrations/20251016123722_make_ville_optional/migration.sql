-- DropForeignKey
ALTER TABLE "public"."publications" DROP CONSTRAINT "publications_villeId_fkey";

-- AlterTable
ALTER TABLE "public"."publications" ALTER COLUMN "villeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."publications" ADD CONSTRAINT "publications_villeId_fkey" FOREIGN KEY ("villeId") REFERENCES "public"."villes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

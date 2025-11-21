/*
  Warnings:

  - Added the required column `villeId` to the `publications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."offres" ALTER COLUMN "statut" SET DEFAULT 'NON_VENDU';

-- AlterTable
ALTER TABLE "public"."publications" ADD COLUMN     "villeId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."pays" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."villes" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "codePostal" TEXT,
    "paysId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "villes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pays_nom_key" ON "public"."pays"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "pays_code_key" ON "public"."pays"("code");

-- CreateIndex
CREATE UNIQUE INDEX "villes_nom_paysId_key" ON "public"."villes"("nom", "paysId");

-- AddForeignKey
ALTER TABLE "public"."publications" ADD CONSTRAINT "publications_villeId_fkey" FOREIGN KEY ("villeId") REFERENCES "public"."villes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."villes" ADD CONSTRAINT "villes_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "public"."pays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "public"."StatutDemande" AS ENUM ('TROUVEE', 'NON_TROUVEE', 'EXPIREE');

-- AlterEnum
ALTER TYPE "public"."PublicationType" ADD VALUE 'DEMANDE';

-- AlterTable
ALTER TABLE "public"."publications" ALTER COLUMN "type" DROP DEFAULT;

-- CreateTable
CREATE TABLE "public"."demandes" (
    "id" SERIAL NOT NULL,
    "statutDemande" "public"."StatutDemande" NOT NULL DEFAULT 'NON_TROUVEE',
    "deadline" TIMESTAMP(3),
    "budgetMin" DOUBLE PRECISION,
    "budgetMax" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publicationId" INTEGER NOT NULL,

    CONSTRAINT "demandes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."demande_produits" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "quantite" INTEGER,
    "demandeId" INTEGER NOT NULL,
    "categorieId" INTEGER NOT NULL,

    CONSTRAINT "demande_produits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "demandes_publicationId_key" ON "public"."demandes"("publicationId");

-- AddForeignKey
ALTER TABLE "public"."demandes" ADD CONSTRAINT "demandes_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "public"."publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."demande_produits" ADD CONSTRAINT "demande_produits_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "public"."demandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."demande_produits" ADD CONSTRAINT "demande_produits_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

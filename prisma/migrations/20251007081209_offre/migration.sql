-- CreateEnum
CREATE TYPE "public"."PublicationStatut" AS ENUM ('EN_ATTENTE', 'VALIDE', 'REJETE');

-- CreateEnum
CREATE TYPE "public"."PublicationType" AS ENUM ('OFFRE');

-- CreateEnum
CREATE TYPE "public"."OffreStatut" AS ENUM ('VENDU', 'NON_VENDU');

-- CreateEnum
CREATE TYPE "public"."UniteMesure" AS ENUM ('PIECE', 'TONNE', 'KILOGRAMME', 'LITRE', 'KILOMETRE', 'HECTARE');

-- CreateTable
CREATE TABLE "public"."publications" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "public"."PublicationType" NOT NULL DEFAULT 'OFFRE',
    "statut" "public"."PublicationStatut" NOT NULL DEFAULT 'EN_ATTENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "auteurId" INTEGER NOT NULL,

    CONSTRAINT "publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."offres" (
    "id" SERIAL NOT NULL,
    "statut" "public"."OffreStatut" NOT NULL,
    "publicationId" INTEGER NOT NULL,

    CONSTRAINT "offres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."produits" (
    "id" SERIAL NOT NULL,
    "libelle" TEXT NOT NULL,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "quantite" INTEGER NOT NULL,
    "uniteMesure" "public"."UniteMesure" NOT NULL,
    "offreId" INTEGER NOT NULL,
    "categorieId" INTEGER NOT NULL,

    CONSTRAINT "produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."publication_images" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "publicationId" INTEGER NOT NULL,

    CONSTRAINT "publication_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "offres_publicationId_key" ON "public"."offres"("publicationId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_nom_key" ON "public"."categories"("nom");

-- AddForeignKey
ALTER TABLE "public"."publications" ADD CONSTRAINT "publications_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "public"."utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offres" ADD CONSTRAINT "offres_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "public"."publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."produits" ADD CONSTRAINT "produits_offreId_fkey" FOREIGN KEY ("offreId") REFERENCES "public"."offres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."produits" ADD CONSTRAINT "produits_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."publication_images" ADD CONSTRAINT "publication_images_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "public"."publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

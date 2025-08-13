-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "public"."Sexe" AS ENUM ('HOMME', 'FEMME');

-- CreateEnum
CREATE TYPE "public"."Langue" AS ENUM ('MALAGASY', 'FRANCAIS', 'ENGLISH');

-- CreateTable
CREATE TABLE "public"."utilisateurs" (
    "id" SERIAL NOT NULL,
    "nomUtilisateur" TEXT NOT NULL,
    "prenomUtilisateur" TEXT NOT NULL,
    "NIF" INTEGER NOT NULL,
    "STAT" INTEGER NOT NULL,
    "telephone" INTEGER NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "sexe" "public"."Sexe" NOT NULL,
    "langue" "public"."Langue" NOT NULL DEFAULT 'MALAGASY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_NIF_key" ON "public"."utilisateurs"("NIF");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_STAT_key" ON "public"."utilisateurs"("STAT");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_telephone_key" ON "public"."utilisateurs"("telephone");

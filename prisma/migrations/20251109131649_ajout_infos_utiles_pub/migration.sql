-- CreateTable
CREATE TABLE "public"."info_publications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "images" TEXT[],
    "authorId" INTEGER NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "info_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."info_publication_likes" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "info_publication_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "info_publications_createdAt_idx" ON "public"."info_publications"("createdAt");

-- CreateIndex
CREATE INDEX "info_publications_authorId_idx" ON "public"."info_publications"("authorId");

-- CreateIndex
CREATE INDEX "info_publication_likes_userId_idx" ON "public"."info_publication_likes"("userId");

-- CreateIndex
CREATE INDEX "info_publication_likes_publicationId_idx" ON "public"."info_publication_likes"("publicationId");

-- CreateIndex
CREATE UNIQUE INDEX "info_publication_likes_publicationId_userId_key" ON "public"."info_publication_likes"("publicationId", "userId");

-- AddForeignKey
ALTER TABLE "public"."info_publications" ADD CONSTRAINT "info_publications_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."info_publication_likes" ADD CONSTRAINT "info_publication_likes_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "public"."info_publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."info_publication_likes" ADD CONSTRAINT "info_publication_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

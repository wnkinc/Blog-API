-- CreateTable
CREATE TABLE "Reaction" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "postId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_postId_type_key" ON "Reaction"("postId", "type");

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

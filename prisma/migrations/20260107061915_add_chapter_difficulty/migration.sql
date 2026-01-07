-- AlterTable
ALTER TABLE "Question" ADD COLUMN "chapter" TEXT;
ALTER TABLE "Question" ADD COLUMN "difficulty" TEXT;

-- CreateIndex
CREATE INDEX "Question_chapter_idx" ON "Question"("chapter");

-- CreateIndex
CREATE INDEX "Question_difficulty_idx" ON "Question"("difficulty");

-- CreateIndex
CREATE INDEX "Question_chapter_difficulty_idx" ON "Question"("chapter", "difficulty");

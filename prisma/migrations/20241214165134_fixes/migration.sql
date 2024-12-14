/*
  Warnings:

  - You are about to drop the column `parentFolderId` on the `Folder` table. All the data in the column will be lost.
  - You are about to drop the column `folderId` on the `Item` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_parentFolderId_fkey";

-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_folderId_fkey";

-- DropIndex
DROP INDEX "Folder_parentFolderId_idx";

-- DropIndex
DROP INDEX "Item_folderId_idx";

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "parentFolderId",
ADD COLUMN     "collapsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "folder_id" UUID,
ALTER COLUMN "order" SET DEFAULT 0,
ALTER COLUMN "order" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "folderId",
ADD COLUMN     "folder_id" UUID,
ALTER COLUMN "order" SET DEFAULT 0,
ALTER COLUMN "order" SET DATA TYPE DECIMAL(65,30);

-- CreateIndex
CREATE INDEX "Folder_folder_id_idx" ON "Folder"("folder_id");

-- CreateIndex
CREATE INDEX "Item_folder_id_idx" ON "Item"("folder_id");

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

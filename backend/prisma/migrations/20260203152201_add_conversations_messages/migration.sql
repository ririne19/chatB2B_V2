/*
  Warnings:

  - You are about to drop the column `status` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the `ConversationParticipant` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ConversationParticipant" DROP CONSTRAINT "ConversationParticipant_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "ConversationParticipant" DROP CONSTRAINT "ConversationParticipant_userId_fkey";

-- DropIndex
DROP INDEX "Conversation_createdAt_idx";

-- DropIndex
DROP INDEX "Conversation_status_idx";

-- DropIndex
DROP INDEX "Message_createdAt_idx";

-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "status",
ALTER COLUMN "title" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "ConversationParticipant";

-- DropEnum
DROP TYPE "ConversationStatus";

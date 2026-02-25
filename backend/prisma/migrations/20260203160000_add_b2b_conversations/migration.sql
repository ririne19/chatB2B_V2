-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "isAdminCompany" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "partnerOrganizationId" TEXT;

-- CreateIndex
CREATE INDEX "Organization_isAdminCompany_idx" ON "Organization"("isAdminCompany");

-- CreateIndex
CREATE INDEX "Conversation_partnerOrganizationId_idx" ON "Conversation"("partnerOrganizationId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_partnerOrganizationId_fkey" FOREIGN KEY ("partnerOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

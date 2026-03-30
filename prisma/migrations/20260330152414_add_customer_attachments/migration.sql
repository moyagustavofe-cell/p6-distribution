-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "customerId" TEXT;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

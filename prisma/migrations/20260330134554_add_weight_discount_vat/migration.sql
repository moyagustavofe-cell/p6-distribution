-- AlterTable
ALTER TABLE "QuotationItem" ADD COLUMN     "weightKg" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "SalesQuote" ADD COLUMN     "discountPercent" DOUBLE PRECISION,
ADD COLUMN     "vatPercent" DOUBLE PRECISION;

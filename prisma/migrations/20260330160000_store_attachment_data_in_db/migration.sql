-- Drop old filesystem columns
ALTER TABLE "Attachment" DROP COLUMN IF EXISTS "filename";
ALTER TABLE "Attachment" DROP COLUMN IF EXISTS "url";

-- Add binary data column
ALTER TABLE "Attachment" ADD COLUMN "data" BYTEA;

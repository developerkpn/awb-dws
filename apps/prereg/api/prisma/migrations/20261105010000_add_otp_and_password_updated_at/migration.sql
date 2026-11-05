-- AlterTable
ALTER TABLE "mst_user" ADD COLUMN "otp_code" TEXT,
ADD COLUMN "otp_expires_at" TIMESTAMP(3),
ADD COLUMN "password_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;


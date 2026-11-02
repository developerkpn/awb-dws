-- CreateTable
CREATE TABLE "pre_registrations" (
    "id" UUID NOT NULL,
    "site_id" VARCHAR(50) NOT NULL,
    "transaction_type" VARCHAR(3) NOT NULL,
    "reference_document" VARCHAR(100) NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pre_registrations_pkey" PRIMARY KEY ("id")
);

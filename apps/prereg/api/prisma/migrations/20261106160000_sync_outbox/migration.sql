-- AlterTable
ALTER TABLE "awb_driver_request" ADD COLUMN "site_id" TEXT;

-- CreateTable
CREATE TABLE "sys_sync_outbox" (
    "id" SERIAL NOT NULL,
    "event_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "acknowledged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sys_sync_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sys_sync_outbox_event_id_key" ON "sys_sync_outbox"("event_id");

-- CreateIndex
CREATE INDEX "sys_sync_outbox_site_id_id_idx" ON "sys_sync_outbox"("site_id", "id");

-- CreateIndex
CREATE INDEX "sys_sync_outbox_status_site_id_idx" ON "sys_sync_outbox"("status", "site_id");


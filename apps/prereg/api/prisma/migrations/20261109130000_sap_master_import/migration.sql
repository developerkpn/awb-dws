-- Drivers and trucks confirmed in SAP; only these are offered when creating a registration.
ALTER TABLE "mst_driver" ADD COLUMN "in_sap" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "sap_location" TEXT,
ADD COLUMN "sap_synced_at" TIMESTAMP(3),
ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "birth_place" DROP NOT NULL,
ALTER COLUMN "birth_date" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL;

ALTER TABLE "mst_vehicle" ADD COLUMN "in_sap" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "sap_location" TEXT,
ADD COLUMN "sap_synced_at" TIMESTAMP(3);

CREATE INDEX "mst_driver_in_sap_is_active_idx" ON "mst_driver"("in_sap", "is_active");
CREATE INDEX "mst_vehicle_in_sap_is_active_idx" ON "mst_vehicle"("in_sap", "is_active");

CREATE TABLE "sys_sap_master_import" (
    "id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "started_by_id" UUID NOT NULL,
    "driver_count" INTEGER NOT NULL DEFAULT 0,
    "vehicle_count" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "sys_sap_master_import_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sys_sap_master_import_started_at_idx" ON "sys_sap_master_import"("started_at");

-- At most one import runs at a time.
CREATE UNIQUE INDEX "sys_sap_master_import_running_key" ON "sys_sap_master_import"("status") WHERE "status" = 'RUNNING';

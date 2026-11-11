-- CreateTable
CREATE TABLE "mst_bel_document" (
    "id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "po_number" TEXT NOT NULL,
    "po_item" TEXT NOT NULL,
    "plant_id" UUID NOT NULL,
    "snapshot" JSONB NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_bel_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "awb_bel_registration" (
    "id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "vendor_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "decided_by_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "submitted_at" TIMESTAMP(3),
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "awb_bel_registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "awb_bel_line" (
    "id" UUID NOT NULL,
    "registration_id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "document_snapshot" JSONB NOT NULL,
    "driver_license_number" TEXT,
    "driver_name" TEXT,
    "vehicle_plate_number" TEXT,
    "quantity" DECIMAL(20,6) NOT NULL,
    "loading_date" DATE,
    "media_transport" TEXT NOT NULL,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "staged_at" TIMESTAMP(3),
    "stage_payload" JSONB,
    "stage_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "awb_bel_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "awb_bel_history" (
    "id" UUID NOT NULL,
    "registration_id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "awb_bel_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mst_bel_document_po_number_po_item_id_idx" ON "mst_bel_document"("po_number", "po_item", "id");

-- CreateIndex
CREATE INDEX "mst_bel_document_plant_id_fetched_at_idx" ON "mst_bel_document"("plant_id", "fetched_at");

-- CreateIndex
CREATE UNIQUE INDEX "mst_bel_document_vendor_id_po_number_po_item_key" ON "mst_bel_document"("vendor_id", "po_number", "po_item");

-- CreateIndex
CREATE UNIQUE INDEX "awb_bel_registration_number_key" ON "awb_bel_registration"("number");

-- CreateIndex
CREATE INDEX "awb_bel_registration_vendor_id_created_at_id_idx" ON "awb_bel_registration"("vendor_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "awb_bel_registration_status_created_at_id_idx" ON "awb_bel_registration"("status", "created_at", "id");

-- CreateIndex
CREATE INDEX "awb_bel_line_document_id_status_idx" ON "awb_bel_line"("document_id", "status");

-- CreateIndex
CREATE INDEX "awb_bel_line_registration_id_created_at_id_idx" ON "awb_bel_line"("registration_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "awb_bel_line_status_loading_date_id_idx" ON "awb_bel_line"("status", "loading_date", "id");

-- CreateIndex
CREATE INDEX "awb_bel_history_registration_id_created_at_id_idx" ON "awb_bel_history"("registration_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "awb_bel_history_actor_id_idx" ON "awb_bel_history"("actor_id");

-- AddForeignKey
ALTER TABLE "mst_bel_document" ADD CONSTRAINT "mst_bel_document_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "mst_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mst_bel_document" ADD CONSTRAINT "mst_bel_document_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "mst_plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awb_bel_registration" ADD CONSTRAINT "awb_bel_registration_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "mst_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awb_bel_registration" ADD CONSTRAINT "awb_bel_registration_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "mst_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awb_bel_registration" ADD CONSTRAINT "awb_bel_registration_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "mst_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awb_bel_line" ADD CONSTRAINT "awb_bel_line_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "awb_bel_registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awb_bel_line" ADD CONSTRAINT "awb_bel_line_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "mst_bel_document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awb_bel_history" ADD CONSTRAINT "awb_bel_history_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "awb_bel_registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awb_bel_history" ADD CONSTRAINT "awb_bel_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "mst_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Check constraint
ALTER TABLE "awb_bel_line" ADD CONSTRAINT "awb_bel_line_positive_quantity" CHECK (quantity > 0);


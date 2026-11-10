-- AlterTable
ALTER TABLE "mst_plant" ADD COLUMN     "sap_plant_code" TEXT;

-- CreateTable
CREATE TABLE "mst_jul_document" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "reference_document" TEXT NOT NULL,
    "provider_mode" TEXT NOT NULL,
    "plant_id" UUID NOT NULL,
    "snapshot" JSONB NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_jul_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "awb_jul_registration" (
    "id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "provider_mode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "awb_jul_registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "awb_jul_line" (
    "id" UUID NOT NULL,
    "registration_id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "document_snapshot" JSONB NOT NULL,
    "variant" TEXT NOT NULL,
    "sto_number" TEXT,
    "driver_license_number" TEXT,
    "driver_name" TEXT,
    "vehicle_plate_number" TEXT,
    "quantity" DECIMAL(20,6) NOT NULL,
    "loading_date" DATE,
    "media_transport" TEXT NOT NULL,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "loading_note_number" TEXT,
    "sap_error" TEXT,
    "factory_storage" TEXT,
    "other_storage" TEXT,
    "factory_valuation" TEXT,
    "other_valuation" TEXT,
    "factory_batch" TEXT,
    "other_batch" TEXT,
    "job_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "awb_jul_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "awb_jul_history" (
    "id" UUID NOT NULL,
    "registration_id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "awb_jul_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_jul_job" (
    "id" UUID NOT NULL,
    "registration_id" UUID NOT NULL,
    "provider_mode" TEXT NOT NULL,
    "operator_username" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "payload" JSONB NOT NULL,
    "trigger_started_at" TIMESTAMP(3),
    "next_poll_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sys_jul_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_jul_demo_stage" (
    "id" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "loading_note_number" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sys_jul_demo_stage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mst_jul_plant_rule" (
    "id" UUID NOT NULL,
    "plant_id" UUID NOT NULL,
    "material" TEXT NOT NULL,
    "incoterm" TEXT NOT NULL,
    "factory_storage" TEXT NOT NULL,
    "other_storage" TEXT NOT NULL,
    "factory_valuation" TEXT NOT NULL,
    "other_valuation" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_jul_plant_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mst_jul_transport_rule" (
    "id" UUID NOT NULL,
    "item_rule" TEXT NOT NULL,
    "modes" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_jul_transport_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mst_jul_hold" (
    "id" UUID NOT NULL,
    "provider_mode" TEXT NOT NULL,
    "reference_document" TEXT NOT NULL,
    "quantity" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "actor_id" UUID,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_jul_hold_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mst_jul_document_plant_id_fetched_at_idx" ON "mst_jul_document"("plant_id", "fetched_at");

-- CreateIndex
CREATE UNIQUE INDEX "mst_jul_document_customer_id_provider_mode_reference_docume_key" ON "mst_jul_document"("customer_id", "provider_mode", "reference_document");

-- CreateIndex
CREATE UNIQUE INDEX "awb_jul_registration_number_key" ON "awb_jul_registration"("number");

-- CreateIndex
CREATE INDEX "awb_jul_registration_customer_id_created_at_id_idx" ON "awb_jul_registration"("customer_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "awb_jul_registration_status_created_at_id_idx" ON "awb_jul_registration"("status", "created_at", "id");

-- CreateIndex
CREATE INDEX "awb_jul_line_document_id_status_idx" ON "awb_jul_line"("document_id", "status");

-- CreateIndex
CREATE INDEX "awb_jul_line_registration_id_created_at_id_idx" ON "awb_jul_line"("registration_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "awb_jul_line_status_loading_date_id_idx" ON "awb_jul_line"("status", "loading_date", "id");

-- CreateIndex
CREATE INDEX "awb_jul_line_job_id_idx" ON "awb_jul_line"("job_id");

-- CreateIndex
CREATE INDEX "awb_jul_history_registration_id_created_at_id_idx" ON "awb_jul_history"("registration_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "awb_jul_history_actor_id_idx" ON "awb_jul_history"("actor_id");

-- CreateIndex
CREATE INDEX "sys_jul_job_status_next_poll_at_id_idx" ON "sys_jul_job"("status", "next_poll_at", "id");

-- CreateIndex
CREATE INDEX "sys_jul_job_operator_username_status_idx" ON "sys_jul_job"("operator_username", "status");

-- CreateIndex
CREATE INDEX "sys_jul_job_registration_id_idx" ON "sys_jul_job"("registration_id");

-- CreateIndex
CREATE UNIQUE INDEX "mst_jul_plant_rule_plant_id_material_incoterm_key" ON "mst_jul_plant_rule"("plant_id", "material", "incoterm");

-- CreateIndex
CREATE UNIQUE INDEX "mst_jul_transport_rule_item_rule_key" ON "mst_jul_transport_rule"("item_rule");

-- CreateIndex
CREATE INDEX "mst_jul_hold_actor_id_idx" ON "mst_jul_hold"("actor_id");

-- CreateIndex
CREATE UNIQUE INDEX "mst_jul_hold_provider_mode_reference_document_key" ON "mst_jul_hold"("provider_mode", "reference_document");

-- CreateIndex
CREATE UNIQUE INDEX "mst_plant_sap_plant_code_key" ON "mst_plant"("sap_plant_code");

-- AddForeignKey
ALTER TABLE "mst_jul_document" ADD CONSTRAINT "mst_jul_document_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "mst_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mst_jul_document" ADD CONSTRAINT "mst_jul_document_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "mst_plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awb_jul_registration" ADD CONSTRAINT "awb_jul_registration_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "mst_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awb_jul_registration" ADD CONSTRAINT "awb_jul_registration_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "mst_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awb_jul_line" ADD CONSTRAINT "awb_jul_line_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "awb_jul_registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awb_jul_line" ADD CONSTRAINT "awb_jul_line_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "mst_jul_document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awb_jul_line" ADD CONSTRAINT "awb_jul_line_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "sys_jul_job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awb_jul_history" ADD CONSTRAINT "awb_jul_history_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "awb_jul_registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awb_jul_history" ADD CONSTRAINT "awb_jul_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "mst_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_jul_job" ADD CONSTRAINT "sys_jul_job_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "awb_jul_registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mst_jul_plant_rule" ADD CONSTRAINT "mst_jul_plant_rule_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "mst_plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mst_jul_hold" ADD CONSTRAINT "mst_jul_hold_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "mst_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

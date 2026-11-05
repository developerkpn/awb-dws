-- CreateTable
CREATE TABLE "mst_city" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_city_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mst_transporter" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "contact_person" TEXT,
    "city_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_transporter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mst_driver" (
    "id" SERIAL NOT NULL,
    "license_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "birth_place" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "phone" TEXT NOT NULL,
    "city_id" INTEGER,
    "license_photo_url" TEXT,
    "driver_photo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mst_vehicle" (
    "id" SERIAL NOT NULL,
    "plate_number" TEXT NOT NULL,
    "transporter_id" INTEGER,
    "stnk_photo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "awb_driver_request" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "submitted_by" INTEGER NOT NULL,
    "driver_id" INTEGER,
    "driver_license_number" TEXT NOT NULL,
    "driver_name" TEXT NOT NULL,
    "driver_address" TEXT NOT NULL,
    "driver_birth_place" TEXT NOT NULL,
    "driver_birth_date" TIMESTAMP(3) NOT NULL,
    "driver_phone" TEXT NOT NULL,
    "driver_city_id" INTEGER,
    "driver_license_photo_url" TEXT,
    "driver_photo_url" TEXT,
    "vehicle_id" INTEGER,
    "vehicle_plate_number" TEXT NOT NULL,
    "transporter_id" INTEGER,
    "vehicle_stnk_photo_url" TEXT,
    "decided_by" INTEGER,
    "decided_at" TIMESTAMP(3),
    "decision" TEXT,
    "rejection_reason" TEXT,
    "sent_to_plant_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "awb_driver_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "awb_driver_request_decision" (
    "id" SERIAL NOT NULL,
    "request_id" INTEGER NOT NULL,
    "decision" TEXT NOT NULL,
    "rejection_reason" TEXT,
    "decided_by" INTEGER NOT NULL,
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "awb_driver_request_decision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mst_city_name_key" ON "mst_city"("name");

-- CreateIndex
CREATE UNIQUE INDEX "mst_transporter_code_key" ON "mst_transporter"("code");

-- CreateIndex
CREATE UNIQUE INDEX "mst_driver_license_number_key" ON "mst_driver"("license_number");

-- CreateIndex
CREATE UNIQUE INDEX "mst_vehicle_plate_number_key" ON "mst_vehicle"("plate_number");

-- AddForeignKey
ALTER TABLE "mst_transporter" ADD CONSTRAINT "mst_transporter_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "mst_city"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mst_driver" ADD CONSTRAINT "mst_driver_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "mst_city"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mst_vehicle" ADD CONSTRAINT "mst_vehicle_transporter_id_fkey" FOREIGN KEY ("transporter_id") REFERENCES "mst_transporter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awb_driver_request" ADD CONSTRAINT "awb_driver_request_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "mst_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awb_driver_request" ADD CONSTRAINT "awb_driver_request_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "mst_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awb_driver_request" ADD CONSTRAINT "awb_driver_request_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "mst_driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awb_driver_request" ADD CONSTRAINT "awb_driver_request_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "mst_vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awb_driver_request" ADD CONSTRAINT "awb_driver_request_driver_city_id_fkey" FOREIGN KEY ("driver_city_id") REFERENCES "mst_city"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awb_driver_request" ADD CONSTRAINT "awb_driver_request_transporter_id_fkey" FOREIGN KEY ("transporter_id") REFERENCES "mst_transporter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awb_driver_request_decision" ADD CONSTRAINT "awb_driver_request_decision_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "awb_driver_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awb_driver_request_decision" ADD CONSTRAINT "awb_driver_request_decision_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "mst_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


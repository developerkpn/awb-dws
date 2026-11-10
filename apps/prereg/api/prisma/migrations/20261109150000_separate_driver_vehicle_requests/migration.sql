-- A request now covers either one driver or one vehicle, each with its own plant target.
ALTER TABLE "awb_driver_request" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'DRIVER',
ADD COLUMN "driver_address2" TEXT,
ADD COLUMN "driver_address3" TEXT,
ALTER COLUMN "driver_license_number" DROP NOT NULL,
ALTER COLUMN "driver_name" DROP NOT NULL,
ALTER COLUMN "driver_address" DROP NOT NULL,
ALTER COLUMN "driver_birth_place" DROP NOT NULL,
ALTER COLUMN "driver_birth_date" DROP NOT NULL,
ALTER COLUMN "driver_phone" DROP NOT NULL,
ALTER COLUMN "vehicle_plate_number" DROP NOT NULL;

-- Split existing combined requests: the vehicle part becomes its own request with the same review history.
CREATE TABLE "split_vehicle_request" AS
SELECT gen_random_uuid() AS "id", "id" AS "source_id", "status", "submitted_by", "vehicle_id",
  "vehicle_plate_number", "transporter_id", "vehicle_stnk_photo_url", "site_id", "decided_by",
  "decided_at", "decision", "rejection_reason", "sent_to_plant_at", "created_at", "updated_at"
FROM "awb_driver_request"
WHERE "vehicle_plate_number" IS NOT NULL AND "driver_license_number" IS NOT NULL;

UPDATE "awb_driver_request" r
SET "vehicle_plate_number" = NULL, "vehicle_id" = NULL, "transporter_id" = NULL,
  "vehicle_stnk_photo_url" = NULL
FROM "split_vehicle_request" s
WHERE r."id" = s."source_id";

INSERT INTO "awb_driver_request" (
  "id", "kind", "status", "submitted_by", "vehicle_id", "vehicle_plate_number", "transporter_id",
  "vehicle_stnk_photo_url", "site_id", "decided_by", "decided_at", "decision", "rejection_reason",
  "sent_to_plant_at", "created_at", "updated_at"
)
SELECT "id", 'VEHICLE', "status", "submitted_by", "vehicle_id", "vehicle_plate_number",
  "transporter_id", "vehicle_stnk_photo_url", "site_id", "decided_by", "decided_at", "decision",
  "rejection_reason", "sent_to_plant_at", "created_at", "updated_at"
FROM "split_vehicle_request";

INSERT INTO "awb_driver_request_decision" (
  "id", "request_id", "decision", "rejection_reason", "note", "decided_by", "decided_at",
  "created_at", "updated_at"
)
SELECT gen_random_uuid(), s."id", d."decision", d."rejection_reason", d."note", d."decided_by",
  d."decided_at", d."created_at", d."updated_at"
FROM "split_vehicle_request" s
JOIN "awb_driver_request_decision" d ON d."request_id" = s."source_id";

DROP TABLE "split_vehicle_request";

ALTER TABLE "awb_driver_request" ADD CONSTRAINT "awb_driver_request_kind_check" CHECK (
  ("kind" = 'DRIVER' AND "driver_license_number" IS NOT NULL AND "vehicle_plate_number" IS NULL)
  OR ("kind" = 'VEHICLE' AND "vehicle_plate_number" IS NOT NULL AND "driver_license_number" IS NULL)
);

CREATE INDEX "awb_driver_request_kind_status_created_at_idx" ON "awb_driver_request"("kind", "status", "created_at");

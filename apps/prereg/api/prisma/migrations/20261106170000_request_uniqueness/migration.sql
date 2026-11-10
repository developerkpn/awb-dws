-- Active requests reserve identities even when concurrent submissions arrive.
CREATE UNIQUE INDEX "awb_driver_request_active_license_key"
ON "awb_driver_request" (lower(btrim("driver_license_number")))
WHERE "status" IN ('SUBMITTED', 'APPROVED', 'SENT_TO_PLANT');

CREATE UNIQUE INDEX "awb_driver_request_active_plate_key"
ON "awb_driver_request" (lower(regexp_replace("vehicle_plate_number", '\s+', '', 'g')))
WHERE "status" IN ('SUBMITTED', 'APPROVED', 'SENT_TO_PLANT');

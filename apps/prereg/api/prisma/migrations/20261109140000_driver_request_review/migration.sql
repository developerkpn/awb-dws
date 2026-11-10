-- Optional note Logistics adds when approving; rejections keep using rejection_reason.
ALTER TABLE "awb_driver_request_decision" ADD COLUMN "note" TEXT;

CREATE INDEX "awb_driver_request_site_id_status_created_at_idx" ON "awb_driver_request"("site_id", "status", "created_at");

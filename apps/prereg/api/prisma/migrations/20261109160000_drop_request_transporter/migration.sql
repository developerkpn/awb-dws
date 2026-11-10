-- Driver and vehicle requests no longer ask for a transporter, as in the previous application.
ALTER TABLE "awb_driver_request" DROP CONSTRAINT "awb_driver_request_transporter_id_fkey";

DROP INDEX "awb_driver_request_transporter_id_idx";

ALTER TABLE "awb_driver_request" DROP COLUMN "transporter_id";

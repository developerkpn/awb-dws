ALTER TABLE "mst_plant" ADD COLUMN "company_group" TEXT;

CREATE INDEX "mst_jul_document_provider_mode_reference_document_id_idx"
ON "mst_jul_document"("provider_mode", "reference_document", "id");

ALTER TABLE "awb_jul_line" ADD CONSTRAINT "awb_jul_line_positive_quantity" CHECK (quantity > 0);
ALTER TABLE "mst_jul_hold" ADD CONSTRAINT "mst_jul_hold_nonnegative_quantity" CHECK (quantity >= 0);

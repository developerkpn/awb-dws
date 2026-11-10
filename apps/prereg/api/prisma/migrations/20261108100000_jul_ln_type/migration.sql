CREATE TABLE "mst_jul_ln_type" (
    "id" UUID NOT NULL,
    "incoterm" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_jul_ln_type_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mst_jul_ln_type_incoterm_key" ON "mst_jul_ln_type"("incoterm");

-- Same values as the legacy ln_type rows for the DOWNSTREAM business unit.
INSERT INTO "mst_jul_ln_type" ("id", "incoterm", "type", "updated_at") VALUES
    (gen_random_uuid(), 'LCO', 'S', CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'FRC', 'S', CURRENT_TIMESTAMP);

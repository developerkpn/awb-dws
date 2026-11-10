DROP TABLE "mst_jul_transport_rule";

CREATE TABLE "mst_jul_transport_mode" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_jul_transport_mode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mst_jul_transport_mode_code_key" ON "mst_jul_transport_mode"("code");

-- Same codes and active flags as the legacy MEDTP keys; only Truck is active.
INSERT INTO "mst_jul_transport_mode" ("id", "code", "name", "is_active", "updated_at") VALUES
    (gen_random_uuid(), 'T', 'Truck', true, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'V', 'Vessel', false, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'L', 'Pipe Line', false, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'E', 'Paper Trade', false, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'R', 'Railway', false, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'P', 'Ponton', false, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'A', 'Airplane', false, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'W', 'Waterway', false, CURRENT_TIMESTAMP);

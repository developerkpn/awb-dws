BEGIN;

ALTER TABLE "mst_transporter" ADD COLUMN "city" TEXT;
ALTER TABLE "mst_driver" ADD COLUMN "city" TEXT;
ALTER TABLE "awb_driver_request" ADD COLUMN "driver_city" TEXT;

UPDATE "mst_transporter" AS target SET "city" = source."name"
FROM "mst_city" AS source WHERE target."city_id" = source."id";

UPDATE "mst_driver" AS target SET "city" = source."name"
FROM "mst_city" AS source WHERE target."city_id" = source."id";

UPDATE "awb_driver_request" AS target SET "driver_city" = source."name"
FROM "mst_city" AS source WHERE target."driver_city_id" = source."id";

ALTER TABLE "mst_transporter" DROP COLUMN "city_id";
ALTER TABLE "mst_driver" DROP COLUMN "city_id";
ALTER TABLE "awb_driver_request" DROP COLUMN "driver_city_id";
DROP TABLE "mst_city";

ALTER TABLE "mst_user" ADD COLUMN "city" TEXT, ADD COLUMN "country" TEXT;
UPDATE "mst_user" AS target
SET "city" = source."city", "country" = source."country"
FROM (
  SELECT DISTINCT ON (link."user_id") link."user_id", partner."city", partner."country"
  FROM "mst_user_partner" AS link
  JOIN "mst_partner" AS partner ON partner."id" = link."partner_id"
  ORDER BY link."user_id", link."is_primary" DESC, link."id" ASC
) AS source
WHERE target."id" = source."user_id" AND target."account_type" = 'PARTNER';

DROP TABLE "mst_user_partner";
DROP TABLE "mst_partner";

COMMIT;

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "mst_user_name_search_idx" ON "mst_user" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "mst_user_username_search_idx" ON "mst_user" USING GIN ("username" gin_trgm_ops);
CREATE INDEX "mst_user_email_search_idx" ON "mst_user" USING GIN ("email" gin_trgm_ops);
CREATE INDEX "mst_partner_name_search_idx" ON "mst_partner" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "mst_partner_sap_code_search_idx" ON "mst_partner" USING GIN ("sap_code" gin_trgm_ops);
CREATE UNIQUE INDEX "mst_user_partner_partner_id_key" ON "mst_user_partner"("partner_id");

INSERT INTO "mst_role" ("id", "code", "name", "is_active", "created_at", "updated_at")
VALUES (gen_random_uuid(), 'INTERCO', 'Intercompany Partner', true, now(), now())
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "mst_permission" ("id", "code", "name", "module", "created_at", "updated_at") VALUES
  (gen_random_uuid(), 'admin:users:read', 'View accounts', 'admin', now(), now()),
  (gen_random_uuid(), 'admin:users:create', 'Create accounts', 'admin', now(), now()),
  (gen_random_uuid(), 'admin:users:update', 'Update or deactivate accounts', 'admin', now(), now()),
  (gen_random_uuid(), 'admin:users:reset-password', 'Reset account passwords', 'admin', now(), now()),
  (gen_random_uuid(), 'admin:roles:read', 'View role permissions', 'admin', now(), now()),
  (gen_random_uuid(), 'admin:roles:update', 'Update role permissions', 'admin', now(), now()),
  (gen_random_uuid(), 'prereg:read', 'View pre-registrations', 'prereg', now(), now()),
  (gen_random_uuid(), 'prereg:create', 'Create pre-registrations', 'prereg', now(), now()),
  (gen_random_uuid(), 'prereg:update', 'Update pre-registrations', 'prereg', now(), now()),
  (gen_random_uuid(), 'prereg:delete', 'Delete pre-registrations', 'prereg', now(), now()),
  (gen_random_uuid(), 'prereg:approve', 'Approve pre-registrations', 'prereg', now(), now()),
  (gen_random_uuid(), 'documents:read', 'Read permitted documents', 'documents', now(), now()),
  (gen_random_uuid(), 'documents:create', 'Upload documents', 'documents', now(), now())
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "module" = EXCLUDED."module", "updated_at" = now();

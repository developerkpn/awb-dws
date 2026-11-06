CREATE INDEX "mst_user_created_at_id_idx" ON "mst_user" ("created_at", "id");
CREATE INDEX "mst_user_updated_at_idx" ON "mst_user" ("updated_at");
CREATE INDEX "mst_user_phone_search_idx" ON "mst_user" USING GIN ("phone" gin_trgm_ops);
CREATE INDEX "mst_plant_name_search_idx" ON "mst_plant" USING GIN ("name" gin_trgm_ops);

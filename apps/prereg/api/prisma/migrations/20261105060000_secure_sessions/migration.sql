CREATE TABLE "auth_session" (
  "id" UUID NOT NULL PRIMARY KEY,
  "token_hash" TEXT NOT NULL UNIQUE,
  "user_id" UUID NOT NULL REFERENCES "mst_user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "auth_session_user_id_idx" ON "auth_session"("user_id");
CREATE INDEX "auth_session_expires_at_idx" ON "auth_session"("expires_at");
CREATE TABLE "auth_rate_limit" (
  "id" UUID NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "attempts" INTEGER NOT NULL DEFAULT 1,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "auth_rate_limit_expires_at_idx" ON "auth_rate_limit"("expires_at");
CREATE TABLE "account_audit" (
  "id" UUID NOT NULL PRIMARY KEY,
  "actor_id" UUID,
  "subject_id" UUID NOT NULL,
  "action" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "account_audit_subject_id_created_at_idx" ON "account_audit"("subject_id", "created_at");
CREATE UNIQUE INDEX "mst_user_username_lower_key" ON "mst_user"(lower("username"));
CREATE UNIQUE INDEX "mst_user_email_lower_key" ON "mst_user"(lower("email")) WHERE "email" IS NOT NULL;

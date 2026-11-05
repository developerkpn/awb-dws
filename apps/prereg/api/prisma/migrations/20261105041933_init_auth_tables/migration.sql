-- CreateTable
CREATE TABLE "mst_user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "account_type" TEXT NOT NULL DEFAULT 'PARTNER',
    "role_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mst_role" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mst_permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mst_role_permission" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_role_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mst_partner" (
    "id" TEXT NOT NULL,
    "sap_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "partner_type" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT DEFAULT 'ID',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mst_user_partner" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_user_partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mst_plant" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mst_user_plant" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_user_plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_otp" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT NOT NULL,
    "otp_code" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'FORGOT_PASSWORD',
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sys_otp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mst_user_username_key" ON "mst_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "mst_role_code_key" ON "mst_role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "mst_permission_code_key" ON "mst_permission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "mst_role_permission_role_id_permission_id_key" ON "mst_role_permission"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "mst_partner_sap_code_key" ON "mst_partner"("sap_code");

-- CreateIndex
CREATE UNIQUE INDEX "mst_user_partner_user_id_partner_id_key" ON "mst_user_partner"("user_id", "partner_id");

-- CreateIndex
CREATE UNIQUE INDEX "mst_plant_code_key" ON "mst_plant"("code");

-- CreateIndex
CREATE UNIQUE INDEX "mst_user_plant_user_id_plant_id_key" ON "mst_user_plant"("user_id", "plant_id");

-- CreateIndex
CREATE INDEX "sys_otp_email_otp_code_idx" ON "sys_otp"("email", "otp_code");

-- AddForeignKey
ALTER TABLE "mst_user" ADD CONSTRAINT "mst_user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "mst_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mst_role_permission" ADD CONSTRAINT "mst_role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "mst_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mst_role_permission" ADD CONSTRAINT "mst_role_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "mst_permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mst_user_partner" ADD CONSTRAINT "mst_user_partner_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "mst_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mst_user_partner" ADD CONSTRAINT "mst_user_partner_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "mst_partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mst_user_plant" ADD CONSTRAINT "mst_user_plant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "mst_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mst_user_plant" ADD CONSTRAINT "mst_user_plant_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "mst_plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_otp" ADD CONSTRAINT "sys_otp_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "mst_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

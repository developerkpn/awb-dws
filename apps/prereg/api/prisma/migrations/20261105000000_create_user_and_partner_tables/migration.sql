-- CreateTable
CREATE TABLE "mst_user" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mst_partner" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mst_user_partner" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "partner_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_user_partner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mst_user_email_key" ON "mst_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "mst_partner_code_key" ON "mst_partner"("code");

-- CreateIndex
CREATE UNIQUE INDEX "mst_user_partner_partner_id_key" ON "mst_user_partner"("partner_id");

-- AddForeignKey
ALTER TABLE "mst_user_partner" ADD CONSTRAINT "mst_user_partner_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "mst_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mst_user_partner" ADD CONSTRAINT "mst_user_partner_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "mst_partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;


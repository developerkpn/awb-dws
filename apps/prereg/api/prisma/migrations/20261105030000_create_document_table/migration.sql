-- CreateTable
CREATE TABLE "awb_document" (
    "id" SERIAL NOT NULL,
    "file_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "uploaded_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "awb_document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "awb_document_file_key_key" ON "awb_document"("file_key");

-- AddForeignKey
ALTER TABLE "awb_document" ADD CONSTRAINT "awb_document_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "mst_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


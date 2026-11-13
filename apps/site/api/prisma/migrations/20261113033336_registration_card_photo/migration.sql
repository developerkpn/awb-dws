BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[awb_registration_photo] (
    [id] NVARCHAR(1000) NOT NULL,
    [registration_id] NVARCHAR(1000) NOT NULL,
    [kind] NVARCHAR(20) NOT NULL,
    [mime_type] NVARCHAR(50) NOT NULL,
    [content] VARBINARY(max) NOT NULL,
    [size_bytes] INT NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [awb_registration_photo_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [awb_registration_photo_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [awb_registration_photo_registration_id_kind_key] UNIQUE NONCLUSTERED ([registration_id],[kind])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [awb_registration_card_number_status_idx] ON [dbo].[awb_registration]([card_number], [status]);

-- AddForeignKey
ALTER TABLE [dbo].[awb_registration_photo] ADD CONSTRAINT [awb_registration_photo_registration_id_fkey] FOREIGN KEY ([registration_id]) REFERENCES [dbo].[awb_registration]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH


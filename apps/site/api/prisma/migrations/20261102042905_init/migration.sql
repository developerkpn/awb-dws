BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[journeys] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [site_id] VARCHAR(50) NOT NULL,
    [transaction_type] VARCHAR(3) NOT NULL,
    [registration_origin] VARCHAR(20) NOT NULL,
    [current_stage] VARCHAR(50) NOT NULL,
    [status] VARCHAR(20) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [journeys_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [journeys_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [journeys_site_id_status_idx] ON [dbo].[journeys]([site_id], [status]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[mst_driver] (
    [id] NVARCHAR(1000) NOT NULL,
    [license_number] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [address] NVARCHAR(1000) NOT NULL,
    [birth_place] NVARCHAR(1000) NOT NULL,
    [birth_date] DATETIME2 NOT NULL,
    [phone] NVARCHAR(1000) NOT NULL,
    [city] NVARCHAR(1000),
    [license_photo_url] NVARCHAR(1000),
    [driver_photo_url] NVARCHAR(1000),
    [is_active] BIT NOT NULL CONSTRAINT [mst_driver_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [mst_driver_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [mst_driver_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [mst_driver_license_number_key] UNIQUE NONCLUSTERED ([license_number])
);

-- CreateTable
CREATE TABLE [dbo].[mst_vehicle] (
    [id] NVARCHAR(1000) NOT NULL,
    [plate_number] NVARCHAR(1000) NOT NULL,
    [transporter_id] NVARCHAR(1000),
    [transporter_name] NVARCHAR(1000),
    [transporter_code] NVARCHAR(1000),
    [stnk_photo_url] NVARCHAR(1000),
    [is_active] BIT NOT NULL CONSTRAINT [mst_vehicle_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [mst_vehicle_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [mst_vehicle_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [mst_vehicle_plate_number_key] UNIQUE NONCLUSTERED ([plate_number])
);

-- CreateTable
CREATE TABLE [dbo].[sys_sync_inbox] (
    [id] INT NOT NULL IDENTITY(1,1),
    [sequence_number] INT NOT NULL,
    [event_id] NVARCHAR(1000) NOT NULL,
    [event_type] NVARCHAR(1000) NOT NULL,
    [aggregate_id] NVARCHAR(1000) NOT NULL,
    [payload] NVARCHAR(max) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [sys_sync_inbox_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [sys_sync_inbox_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [sys_sync_inbox_event_id_key] UNIQUE NONCLUSTERED ([event_id])
);

-- CreateTable
CREATE TABLE [dbo].[sys_sync_state] (
    [key] NVARCHAR(1000) NOT NULL,
    [last_sequence] INT NOT NULL CONSTRAINT [sys_sync_state_last_sequence_df] DEFAULT 0,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [sys_sync_state_pkey] PRIMARY KEY CLUSTERED ([key])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [sys_sync_inbox_sequence_number_idx] ON [dbo].[sys_sync_inbox]([sequence_number]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

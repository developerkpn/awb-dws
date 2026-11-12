BEGIN TRY

BEGIN TRAN;

-- DropIndex
ALTER TABLE [dbo].[mst_driver] DROP CONSTRAINT [mst_driver_license_number_key];

-- DropIndex
ALTER TABLE [dbo].[mst_vehicle] DROP CONSTRAINT [mst_vehicle_plate_number_key];

-- AlterTable
ALTER TABLE [dbo].[mst_driver] ALTER COLUMN [license_number] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[mst_driver] ALTER COLUMN [name] NVARCHAR(150) NOT NULL;
ALTER TABLE [dbo].[mst_driver] ALTER COLUMN [address] NVARCHAR(250) NULL;
ALTER TABLE [dbo].[mst_driver] ALTER COLUMN [birth_place] NVARCHAR(100) NULL;
ALTER TABLE [dbo].[mst_driver] ALTER COLUMN [birth_date] DATETIME2 NULL;
ALTER TABLE [dbo].[mst_driver] ALTER COLUMN [phone] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[mst_driver] ALTER COLUMN [city] NVARCHAR(100) NULL;
ALTER TABLE [dbo].[mst_driver] ALTER COLUMN [license_photo_url] NVARCHAR(500) NULL;
ALTER TABLE [dbo].[mst_driver] ALTER COLUMN [driver_photo_url] NVARCHAR(500) NULL;
ALTER TABLE [dbo].[mst_driver] ADD [is_blacklisted] BIT NOT NULL CONSTRAINT [mst_driver_is_blacklisted_df] DEFAULT 0,
[pulled_at] DATETIME2,
[source] NVARCHAR(10) NOT NULL CONSTRAINT [mst_driver_source_df] DEFAULT 'PREREG',
[truck_number] NVARCHAR(30);

-- AlterTable
ALTER TABLE [dbo].[mst_vehicle] ALTER COLUMN [plate_number] NVARCHAR(30) NOT NULL;
ALTER TABLE [dbo].[mst_vehicle] ALTER COLUMN [transporter_id] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[mst_vehicle] ALTER COLUMN [transporter_name] NVARCHAR(150) NULL;
ALTER TABLE [dbo].[mst_vehicle] ALTER COLUMN [transporter_code] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[mst_vehicle] ALTER COLUMN [stnk_photo_url] NVARCHAR(500) NULL;
ALTER TABLE [dbo].[mst_vehicle] ADD [is_blacklisted] BIT NOT NULL CONSTRAINT [mst_vehicle_is_blacklisted_df] DEFAULT 0,
[pulled_at] DATETIME2,
[source] NVARCHAR(10) NOT NULL CONSTRAINT [mst_vehicle_source_df] DEFAULT 'PREREG',
[tanker_number] NVARCHAR(30),
[tare_max_kg] DECIMAL(15,3),
[tare_min_kg] DECIMAL(15,3);

-- CreateTable
CREATE TABLE [dbo].[mst_transporter] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(50) NOT NULL,
    [name] NVARCHAR(150) NOT NULL,
    [address] NVARCHAR(250),
    [phone] NVARCHAR(50),
    [sap_code] NVARCHAR(50),
    [is_blacklisted] BIT NOT NULL CONSTRAINT [mst_transporter_is_blacklisted_df] DEFAULT 0,
    [source] NVARCHAR(10) NOT NULL CONSTRAINT [mst_transporter_source_df] DEFAULT 'SAP',
    [pulled_at] DATETIME2,
    [is_active] BIT NOT NULL CONSTRAINT [mst_transporter_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [mst_transporter_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [mst_transporter_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [mst_transporter_code_source_key] UNIQUE NONCLUSTERED ([code],[source])
);

-- CreateTable
CREATE TABLE [dbo].[mst_tanker] (
    [id] NVARCHAR(1000) NOT NULL,
    [number] NVARCHAR(30) NOT NULL,
    [truck_number] NVARCHAR(30),
    [capacity_kg] DECIMAL(15,3),
    [check_mode] NVARCHAR(1),
    [tolerance_percent] DECIMAL(9,3),
    [tolerance_kg] DECIMAL(15,3),
    [source] NVARCHAR(10) NOT NULL CONSTRAINT [mst_tanker_source_df] DEFAULT 'SAP',
    [pulled_at] DATETIME2,
    [is_active] BIT NOT NULL CONSTRAINT [mst_tanker_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [mst_tanker_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [mst_tanker_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [mst_tanker_number_source_key] UNIQUE NONCLUSTERED ([number],[source])
);

-- CreateTable
CREATE TABLE [dbo].[mst_destination] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(20) NOT NULL,
    [name] NVARCHAR(100),
    [storage_location] NVARCHAR(20),
    [source] NVARCHAR(10) NOT NULL CONSTRAINT [mst_destination_source_df] DEFAULT 'SAP',
    [pulled_at] DATETIME2,
    [is_active] BIT NOT NULL CONSTRAINT [mst_destination_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [mst_destination_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [mst_destination_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [mst_destination_code_source_key] UNIQUE NONCLUSTERED ([code],[source])
);

-- CreateTable
CREATE TABLE [dbo].[mst_contract] (
    [id] NVARCHAR(1000) NOT NULL,
    [do_number] NVARCHAR(100) NOT NULL,
    [do_date] DATETIME2,
    [contract_number] NVARCHAR(50),
    [transaction_code] NVARCHAR(10) NOT NULL,
    [commodity_code] NVARCHAR(50),
    [relation_code] NVARCHAR(50),
    [transporter_code] NVARCHAR(50),
    [estate_code] NVARCHAR(20),
    [pi_number] NVARCHAR(30),
    [quantity_kg] DECIMAL(18,3),
    [tolerance_percent] DECIMAL(9,3),
    [incoterm] NVARCHAR(3),
    [so_number] NVARCHAR(20),
    [so_item] NVARCHAR(10),
    [sto_number] NVARCHAR(20),
    [is_closed] BIT NOT NULL CONSTRAINT [mst_contract_is_closed_df] DEFAULT 0,
    [closed_at] DATETIME2,
    [source] NVARCHAR(10) NOT NULL CONSTRAINT [mst_contract_source_df] DEFAULT 'SAP',
    [pulled_at] DATETIME2,
    [is_active] BIT NOT NULL CONSTRAINT [mst_contract_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [mst_contract_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [mst_contract_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [mst_contract_do_number_source_key] UNIQUE NONCLUSTERED ([do_number],[source])
);

-- CreateTable
CREATE TABLE [dbo].[mst_contract_quality] (
    [id] NVARCHAR(1000) NOT NULL,
    [contract_id] NVARCHAR(1000) NOT NULL,
    [sap_code] NVARCHAR(15) NOT NULL,
    [value] NVARCHAR(20),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [mst_contract_quality_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [mst_contract_quality_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [mst_contract_quality_contract_id_sap_code_key] UNIQUE NONCLUSTERED ([contract_id],[sap_code])
);

-- CreateTable
CREATE TABLE [dbo].[mst_transaction_type] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(10) NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    [direction] NVARCHAR(1),
    [is_return] BIT NOT NULL CONSTRAINT [mst_transaction_type_is_return_df] DEFAULT 0,
    [is_vessel] BIT NOT NULL CONSTRAINT [mst_transaction_type_is_vessel_df] DEFAULT 0,
    [requires_loading_note] BIT NOT NULL CONSTRAINT [mst_transaction_type_requires_loading_note_df] DEFAULT 0,
    [requires_tanker] BIT NOT NULL CONSTRAINT [mst_transaction_type_requires_tanker_df] DEFAULT 0,
    [source] NVARCHAR(10) NOT NULL CONSTRAINT [mst_transaction_type_source_df] DEFAULT 'SAP',
    [pulled_at] DATETIME2,
    [is_active] BIT NOT NULL CONSTRAINT [mst_transaction_type_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [mst_transaction_type_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [mst_transaction_type_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [mst_transaction_type_code_source_key] UNIQUE NONCLUSTERED ([code],[source])
);

-- CreateTable
CREATE TABLE [dbo].[mst_commodity] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(50) NOT NULL,
    [name] NVARCHAR(250) NOT NULL,
    [unit] NVARCHAR(20),
    [tolerance_percent] DECIMAL(9,3),
    [sap_material_code] NVARCHAR(20),
    [source] NVARCHAR(10) NOT NULL CONSTRAINT [mst_commodity_source_df] DEFAULT 'SAP',
    [pulled_at] DATETIME2,
    [is_active] BIT NOT NULL CONSTRAINT [mst_commodity_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [mst_commodity_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [mst_commodity_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [mst_commodity_code_source_key] UNIQUE NONCLUSTERED ([code],[source])
);

-- CreateTable
CREATE TABLE [dbo].[mst_relation] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(50) NOT NULL,
    [name] NVARCHAR(150) NOT NULL,
    [type] NVARCHAR(1),
    [city] NVARCHAR(100),
    [is_blacklisted] BIT NOT NULL CONSTRAINT [mst_relation_is_blacklisted_df] DEFAULT 0,
    [source] NVARCHAR(10) NOT NULL CONSTRAINT [mst_relation_source_df] DEFAULT 'SAP',
    [pulled_at] DATETIME2,
    [is_active] BIT NOT NULL CONSTRAINT [mst_relation_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [mst_relation_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [mst_relation_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [mst_relation_code_source_key] UNIQUE NONCLUSTERED ([code],[source])
);

-- CreateTable
CREATE TABLE [dbo].[mst_estate] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(20) NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    [city] NVARCHAR(100),
    [sap_code] NVARCHAR(30),
    [source] NVARCHAR(10) NOT NULL CONSTRAINT [mst_estate_source_df] DEFAULT 'SAP',
    [pulled_at] DATETIME2,
    [is_active] BIT NOT NULL CONSTRAINT [mst_estate_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [mst_estate_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [mst_estate_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [mst_estate_code_source_key] UNIQUE NONCLUSTERED ([code],[source])
);

-- CreateTable
CREATE TABLE [dbo].[mst_quality_item] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(20) NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    [sap_code] NVARCHAR(15),
    [source] NVARCHAR(10) NOT NULL CONSTRAINT [mst_quality_item_source_df] DEFAULT 'SAP',
    [pulled_at] DATETIME2,
    [is_active] BIT NOT NULL CONSTRAINT [mst_quality_item_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [mst_quality_item_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [mst_quality_item_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [mst_quality_item_code_source_key] UNIQUE NONCLUSTERED ([code],[source])
);

-- CreateTable
CREATE TABLE [dbo].[sys_master_pull] (
    [kind] NVARCHAR(30) NOT NULL,
    [last_pulled_at] DATETIME2,
    [last_pull_status] NVARCHAR(10),
    [last_pull_error] NVARCHAR(500),
    [last_pull_row_count] INT,
    [last_backfilled_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [sys_master_pull_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [sys_master_pull_pkey] PRIMARY KEY CLUSTERED ([kind])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [mst_contract_contract_number_idx] ON [dbo].[mst_contract]([contract_number]);

-- CreateIndex
ALTER TABLE [dbo].[mst_driver] ADD CONSTRAINT [mst_driver_license_number_source_key] UNIQUE NONCLUSTERED ([license_number], [source]);

-- CreateIndex
ALTER TABLE [dbo].[mst_vehicle] ADD CONSTRAINT [mst_vehicle_plate_number_source_key] UNIQUE NONCLUSTERED ([plate_number], [source]);

-- AddForeignKey
ALTER TABLE [dbo].[mst_contract_quality] ADD CONSTRAINT [mst_contract_quality_contract_id_fkey] FOREIGN KEY ([contract_id]) REFERENCES [dbo].[mst_contract]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH


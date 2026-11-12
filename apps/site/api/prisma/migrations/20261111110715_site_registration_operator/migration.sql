BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[mst_user] (
    [id] NVARCHAR(1000) NOT NULL,
    [username] NVARCHAR(100) NOT NULL,
    [name] NVARCHAR(150) NOT NULL,
    [password_hash] NVARCHAR(100) NOT NULL,
    [role] NVARCHAR(20) NOT NULL CONSTRAINT [mst_user_role_df] DEFAULT 'OPERATOR',
    [is_active] BIT NOT NULL CONSTRAINT [mst_user_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [mst_user_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [mst_user_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [mst_user_username_key] UNIQUE NONCLUSTERED ([username])
);

-- CreateTable
CREATE TABLE [dbo].[sys_auth_session] (
    [id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [token_hash] NVARCHAR(64) NOT NULL,
    [expires_at] DATETIME2 NOT NULL,
    [last_seen_at] DATETIME2 NOT NULL CONSTRAINT [sys_auth_session_last_seen_at_df] DEFAULT CURRENT_TIMESTAMP,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [sys_auth_session_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [sys_auth_session_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [sys_auth_session_token_hash_key] UNIQUE NONCLUSTERED ([token_hash])
);

-- CreateTable
CREATE TABLE [dbo].[sys_counter] (
    [key] NVARCHAR(50) NOT NULL,
    [value] INT NOT NULL CONSTRAINT [sys_counter_value_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [sys_counter_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [sys_counter_pkey] PRIMARY KEY CLUSTERED ([key])
);

-- CreateTable
CREATE TABLE [dbo].[awb_registration] (
    [id] NVARCHAR(1000) NOT NULL,
    [number] NVARCHAR(20) NOT NULL,
    [registered_at] DATETIME2 NOT NULL CONSTRAINT [awb_registration_registered_at_df] DEFAULT CURRENT_TIMESTAMP,
    [reference_number] NVARCHAR(30),
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [awb_registration_status_df] DEFAULT 'OPEN',
    [card_number] NVARCHAR(30),
    [weighing_type] NVARCHAR(5) NOT NULL CONSTRAINT [awb_registration_weighing_type_df] DEFAULT '2X',
    [plate_number] NVARCHAR(20) NOT NULL,
    [transporter_code] NVARCHAR(20),
    [transporter_name] NVARCHAR(150),
    [license_number] NVARCHAR(30),
    [driver_name] NVARCHAR(150),
    [tanker_number] NVARCHAR(30),
    [passenger_count] INT NOT NULL CONSTRAINT [awb_registration_passenger_count_df] DEFAULT 0,
    [passenger_names] NVARCHAR(500),
    [needs_last_weighing_check] BIT NOT NULL CONSTRAINT [awb_registration_needs_last_weighing_check_df] DEFAULT 0,
    [delivery_note] NVARCHAR(50),
    [is_different_estate] BIT NOT NULL CONSTRAINT [awb_registration_is_different_estate_df] DEFAULT 0,
    [is_return] BIT NOT NULL CONSTRAINT [awb_registration_is_return_df] DEFAULT 0,
    [seal_number] NVARCHAR(100),
    [ticket_remark] NVARCHAR(250),
    [report_remark] NVARCHAR(250),
    [additional_info] NVARCHAR(250),
    [needs_container_check] BIT NOT NULL CONSTRAINT [awb_registration_needs_container_check_df] DEFAULT 0,
    [has_other_party_weight] BIT NOT NULL CONSTRAINT [awb_registration_has_other_party_weight_df] DEFAULT 0,
    [other_party_reference] NVARCHAR(50),
    [other_party_weighed_at] DATETIME2,
    [other_party_gross] DECIMAL(15,3),
    [other_party_tare] DECIMAL(15,3),
    [other_party_net] DECIMAL(15,3),
    [created_by] NVARCHAR(1000) NOT NULL,
    [revised_by] NVARCHAR(1000),
    [revised_at] DATETIME2,
    [cancelled_by] NVARCHAR(1000),
    [cancelled_at] DATETIME2,
    [cancel_reason] NVARCHAR(500),
    [checked_out_by] NVARCHAR(1000),
    [checked_out_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [awb_registration_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [awb_registration_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [awb_registration_number_key] UNIQUE NONCLUSTERED ([number])
);

-- CreateTable
CREATE TABLE [dbo].[awb_registration_destination] (
    [id] NVARCHAR(1000) NOT NULL,
    [registration_id] NVARCHAR(1000) NOT NULL,
    [line_number] INT NOT NULL,
    [code] NVARCHAR(20) NOT NULL,
    [name] NVARCHAR(100),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [awb_registration_destination_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [awb_registration_destination_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [awb_registration_destination_registration_id_line_number_key] UNIQUE NONCLUSTERED ([registration_id],[line_number])
);

-- CreateTable
CREATE TABLE [dbo].[awb_registration_container] (
    [id] NVARCHAR(1000) NOT NULL,
    [registration_id] NVARCHAR(1000) NOT NULL,
    [line_number] INT NOT NULL,
    [container_number] NVARCHAR(30) NOT NULL,
    [seal_number] NVARCHAR(50),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [awb_registration_container_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [awb_registration_container_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [awb_registration_container_registration_id_line_number_key] UNIQUE NONCLUSTERED ([registration_id],[line_number])
);

-- CreateTable
CREATE TABLE [dbo].[awb_registration_do] (
    [id] NVARCHAR(1000) NOT NULL,
    [registration_id] NVARCHAR(1000) NOT NULL,
    [line_number] INT NOT NULL,
    [transaction_code] NVARCHAR(10) NOT NULL,
    [transaction_name] NVARCHAR(100),
    [do_number] NVARCHAR(50) NOT NULL,
    [pi_number] NVARCHAR(50),
    [commodity_code] NVARCHAR(30),
    [commodity_name] NVARCHAR(100),
    [contract_number] NVARCHAR(50),
    [relation_code] NVARCHAR(20),
    [relation_name] NVARCHAR(150),
    [transporter_code] NVARCHAR(20),
    [estate] NVARCHAR(100),
    [other_party_net] DECIMAL(15,3),
    [factory_net] DECIMAL(15,3),
    [loading_quantity] DECIMAL(15,3),
    [other_party_loading_quantity] DECIMAL(15,3),
    [so_item] NVARCHAR(10),
    [do_sap_number] NVARCHAR(20),
    [do_sap_item] NVARCHAR(10),
    [loading_note_number] NVARCHAR(20),
    [loading_note_item] NVARCHAR(10),
    [quantity_kg] DECIMAL(15,3),
    [quantity] DECIMAL(15,3),
    [quantity_uom] NVARCHAR(10),
    [base_quantity] DECIMAL(15,3),
    [base_uom] NVARCHAR(10),
    [customer_qq] NVARCHAR(150),
    [sto_number] NVARCHAR(20),
    [do_sto_number] NVARCHAR(20),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [awb_registration_do_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [awb_registration_do_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [awb_registration_do_registration_id_line_number_key] UNIQUE NONCLUSTERED ([registration_id],[line_number])
);

-- CreateTable
CREATE TABLE [dbo].[awb_registration_deduction] (
    [id] NVARCHAR(1000) NOT NULL,
    [registration_do_id] NVARCHAR(1000) NOT NULL,
    [line_number] INT NOT NULL,
    [code] NVARCHAR(20) NOT NULL,
    [name] NVARCHAR(100),
    [percentage] DECIMAL(15,3),
    [deduction_kg] DECIMAL(15,3),
    [unit_quantity] DECIMAL(15,3),
    [is_return] BIT NOT NULL CONSTRAINT [awb_registration_deduction_is_return_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [awb_registration_deduction_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [awb_registration_deduction_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [awb_registration_deduction_registration_do_id_line_number_key] UNIQUE NONCLUSTERED ([registration_do_id],[line_number])
);

-- CreateTable
CREATE TABLE [dbo].[awb_registration_quality] (
    [id] NVARCHAR(1000) NOT NULL,
    [registration_id] NVARCHAR(1000) NOT NULL,
    [line_number] INT NOT NULL,
    [code] NVARCHAR(20) NOT NULL,
    [name] NVARCHAR(100),
    [sap_specification] NVARCHAR(50),
    [estate_value] NVARCHAR(30),
    [factory_value] NVARCHAR(30),
    [net_deduction] NVARCHAR(30),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [awb_registration_quality_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [awb_registration_quality_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [awb_registration_quality_registration_id_line_number_key] UNIQUE NONCLUSTERED ([registration_id],[line_number])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [sys_auth_session_user_id_idx] ON [dbo].[sys_auth_session]([user_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [awb_registration_registered_at_idx] ON [dbo].[awb_registration]([registered_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [awb_registration_status_registered_at_idx] ON [dbo].[awb_registration]([status], [registered_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [awb_registration_plate_number_idx] ON [dbo].[awb_registration]([plate_number]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [awb_registration_do_do_number_idx] ON [dbo].[awb_registration_do]([do_number]);

-- AddForeignKey
ALTER TABLE [dbo].[sys_auth_session] ADD CONSTRAINT [sys_auth_session_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[mst_user]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[awb_registration] ADD CONSTRAINT [awb_registration_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[mst_user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[awb_registration] ADD CONSTRAINT [awb_registration_revised_by_fkey] FOREIGN KEY ([revised_by]) REFERENCES [dbo].[mst_user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[awb_registration] ADD CONSTRAINT [awb_registration_cancelled_by_fkey] FOREIGN KEY ([cancelled_by]) REFERENCES [dbo].[mst_user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[awb_registration] ADD CONSTRAINT [awb_registration_checked_out_by_fkey] FOREIGN KEY ([checked_out_by]) REFERENCES [dbo].[mst_user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[awb_registration_destination] ADD CONSTRAINT [awb_registration_destination_registration_id_fkey] FOREIGN KEY ([registration_id]) REFERENCES [dbo].[awb_registration]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[awb_registration_container] ADD CONSTRAINT [awb_registration_container_registration_id_fkey] FOREIGN KEY ([registration_id]) REFERENCES [dbo].[awb_registration]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[awb_registration_do] ADD CONSTRAINT [awb_registration_do_registration_id_fkey] FOREIGN KEY ([registration_id]) REFERENCES [dbo].[awb_registration]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[awb_registration_deduction] ADD CONSTRAINT [awb_registration_deduction_registration_do_id_fkey] FOREIGN KEY ([registration_do_id]) REFERENCES [dbo].[awb_registration_do]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[awb_registration_quality] ADD CONSTRAINT [awb_registration_quality_registration_id_fkey] FOREIGN KEY ([registration_id]) REFERENCES [dbo].[awb_registration]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

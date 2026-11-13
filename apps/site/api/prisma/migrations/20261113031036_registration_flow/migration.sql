BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[mst_flow] (
    [code] NVARCHAR(20) NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    [is_active] BIT NOT NULL CONSTRAINT [mst_flow_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [mst_flow_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [mst_flow_pkey] PRIMARY KEY CLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[mst_flow_stage] (
    [flow_code] NVARCHAR(20) NOT NULL,
    [stage_code] NVARCHAR(30) NOT NULL,
    [step_order] INT NOT NULL,
    [stage_type] NVARCHAR(30) NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    [requires_tap_in] BIT NOT NULL CONSTRAINT [mst_flow_stage_requires_tap_in_df] DEFAULT 0,
    [requires_tap_out] BIT NOT NULL CONSTRAINT [mst_flow_stage_requires_tap_out_df] DEFAULT 0,
    [requires_cctv] BIT NOT NULL CONSTRAINT [mst_flow_stage_requires_cctv_df] DEFAULT 0,
    [can_hold] BIT NOT NULL CONSTRAINT [mst_flow_stage_can_hold_df] DEFAULT 0,
    [can_reject] BIT NOT NULL CONSTRAINT [mst_flow_stage_can_reject_df] DEFAULT 0,
    [is_optional] BIT NOT NULL CONSTRAINT [mst_flow_stage_is_optional_df] DEFAULT 0,
    [parallel_group] NVARCHAR(30),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [mst_flow_stage_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [mst_flow_stage_pkey] PRIMARY KEY CLUSTERED ([flow_code],[stage_code]),
    CONSTRAINT [mst_flow_stage_flow_code_step_order_key] UNIQUE NONCLUSTERED ([flow_code],[step_order])
);

-- CreateTable
CREATE TABLE [dbo].[mst_flow_rule] (
    [id] INT NOT NULL IDENTITY(1,1),
    [transaction_code] NVARCHAR(10),
    [commodity_code] NVARCHAR(30),
    [flow_code] NVARCHAR(20) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [mst_flow_rule_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [mst_flow_rule_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [mst_flow_rule_transaction_code_commodity_code_key] UNIQUE NONCLUSTERED ([transaction_code],[commodity_code])
);

-- Flows and stages as configured in VCF (mst_flows / mst_flow_stages on vcs-box, 2026-11-13).
INSERT INTO [dbo].[mst_flow] ([code], [name], [updated_at]) VALUES
(N'BEL', N'Purchase', CURRENT_TIMESTAMP),
(N'JUL', N'Sale', CURRENT_TIMESTAMP),
(N'LSK', N'Transfer out', CURRENT_TIMESTAMP),
(N'LSM', N'Transfer in', CURRENT_TIMESTAMP),
(N'FAME', N'FAME (weighing only)', CURRENT_TIMESTAMP);

INSERT INTO [dbo].[mst_flow_stage] ([flow_code], [stage_code], [step_order], [stage_type], [name], [requires_tap_in], [requires_tap_out], [requires_cctv], [can_hold], [can_reject], [is_optional], [parallel_group], [updated_at]) VALUES
(N'BEL', N'regist_in', 1, N'gate_only', N'Registration In', 0, 0, 0, 0, 0, 0, NULL, CURRENT_TIMESTAMP),
(N'BEL', N'wb_in', 2, N'weighbridge', N'Weighbridge In', 1, 0, 1, 0, 0, 0, NULL, CURRENT_TIMESTAMP),
(N'BEL', N'sampling', 3, N'sampling', N'QC Sampling', 1, 0, 0, 0, 0, 0, NULL, CURRENT_TIMESTAMP),
(N'BEL', N'lab', 4, N'lab', N'QC Lab Testing', 0, 0, 0, 1, 1, 0, NULL, CURRENT_TIMESTAMP),
(N'BEL', N'unloading', 5, N'unloading', N'Unloading', 1, 0, 1, 1, 1, 0, NULL, CURRENT_TIMESTAMP),
(N'BEL', N'wb_out', 6, N'weighbridge', N'Weighbridge Out', 1, 0, 1, 0, 0, 0, NULL, CURRENT_TIMESTAMP),
(N'BEL', N'regist_out', 7, N'gate_only', N'Registration Out', 0, 0, 0, 0, 0, 0, NULL, CURRENT_TIMESTAMP),
(N'JUL', N'regist_in', 1, N'gate_only', N'Registration In', 0, 0, 0, 0, 0, 0, NULL, CURRENT_TIMESTAMP),
(N'JUL', N'wb_in', 2, N'weighbridge', N'Weighbridge In', 1, 0, 1, 0, 0, 0, NULL, CURRENT_TIMESTAMP),
(N'JUL', N'inspection', 3, N'inspection', N'Inspection', 1, 0, 0, 0, 0, 0, NULL, CURRENT_TIMESTAMP),
(N'JUL', N'loading', 4, N'loading', N'Loading', 0, 0, 1, 1, 1, 0, N'qc_phase', CURRENT_TIMESTAMP),
(N'JUL', N'sampling', 5, N'sampling', N'QC Sampling', 0, 0, 0, 0, 0, 0, N'qc_phase', CURRENT_TIMESTAMP),
(N'JUL', N'lab', 6, N'lab', N'QC Lab Testing', 0, 0, 0, 1, 1, 0, N'qc_phase', CURRENT_TIMESTAMP),
(N'JUL', N'wb_out', 7, N'weighbridge', N'Weighbridge Out', 1, 0, 1, 0, 0, 0, NULL, CURRENT_TIMESTAMP),
(N'JUL', N'regist_out', 8, N'gate_only', N'Registration Out', 0, 0, 0, 0, 0, 0, NULL, CURRENT_TIMESTAMP),
(N'LSK', N'regist_in', 1, N'gate_only', N'Registration In', 0, 0, 0, 0, 0, 0, NULL, CURRENT_TIMESTAMP),
(N'LSK', N'wb_in', 2, N'weighbridge', N'Weighbridge In', 1, 0, 1, 0, 0, 0, NULL, CURRENT_TIMESTAMP),
(N'LSK', N'inspection', 3, N'inspection', N'Inspection', 1, 0, 0, 0, 0, 0, NULL, CURRENT_TIMESTAMP),
(N'LSK', N'loading', 4, N'loading', N'Loading', 1, 0, 1, 1, 1, 0, N'qc_phase', CURRENT_TIMESTAMP),
(N'LSK', N'sampling', 5, N'sampling', N'QC Sampling', 0, 0, 0, 0, 0, 1, N'qc_phase', CURRENT_TIMESTAMP),
(N'LSK', N'lab', 6, N'lab', N'QC Lab Testing', 0, 0, 0, 1, 1, 1, N'qc_phase', CURRENT_TIMESTAMP),
(N'LSK', N'wb_out', 7, N'weighbridge', N'Weighbridge Out', 1, 0, 1, 0, 0, 0, NULL, CURRENT_TIMESTAMP),
(N'LSK', N'regist_out', 8, N'gate_only', N'Registration Out', 0, 0, 0, 0, 0, 0, NULL, CURRENT_TIMESTAMP),
(N'LSM', N'regist_in', 1, N'gate_only', N'Registration In', 0, 0, 0, 0, 0, 0, NULL, CURRENT_TIMESTAMP),
(N'LSM', N'wb_in', 2, N'weighbridge', N'Weighbridge In', 1, 0, 1, 0, 0, 0, NULL, CURRENT_TIMESTAMP),
(N'LSM', N'inspection', 3, N'inspection', N'Inspection', 1, 0, 0, 0, 0, 0, NULL, CURRENT_TIMESTAMP),
(N'LSM', N'sampling', 4, N'sampling', N'QC Sampling', 0, 0, 0, 0, 0, 1, NULL, CURRENT_TIMESTAMP),
(N'LSM', N'lab', 5, N'lab', N'QC Lab Testing', 0, 0, 0, 1, 1, 1, NULL, CURRENT_TIMESTAMP),
(N'LSM', N'unloading', 6, N'unloading', N'Unloading', 1, 0, 1, 1, 1, 0, NULL, CURRENT_TIMESTAMP),
(N'LSM', N'wb_out', 7, N'weighbridge', N'Weighbridge Out', 1, 0, 1, 0, 0, 0, NULL, CURRENT_TIMESTAMP),
(N'LSM', N'regist_out', 8, N'gate_only', N'Registration Out', 0, 0, 0, 0, 0, 0, NULL, CURRENT_TIMESTAMP),
(N'FAME', N'regist_in', 1, N'gate_only', N'Registration In', 0, 0, 0, 0, 0, 0, NULL, CURRENT_TIMESTAMP),
(N'FAME', N'wb_in', 2, N'weighbridge', N'Weighbridge In', 1, 0, 1, 0, 0, 0, NULL, CURRENT_TIMESTAMP),
(N'FAME', N'wb_out', 3, N'weighbridge', N'Weighbridge Out', 1, 0, 1, 0, 0, 0, NULL, CURRENT_TIMESTAMP),
(N'FAME', N'regist_out', 4, N'gate_only', N'Registration Out', 0, 0, 0, 0, 0, 0, NULL, CURRENT_TIMESTAMP);

-- Incoming transaction types follow the purchase flow, outgoing ones the sale flow; FAME skips QC whatever the type.
INSERT INTO [dbo].[mst_flow_rule] ([transaction_code], [commodity_code], [flow_code], [updated_at]) VALUES
(N'BEL', NULL, N'BEL', CURRENT_TIMESTAMP),
(N'JUL', NULL, N'JUL', CURRENT_TIMESTAMP),
(N'LSK', NULL, N'LSK', CURRENT_TIMESTAMP),
(N'LSM', NULL, N'LSM', CURRENT_TIMESTAMP),
(N'TBM', NULL, N'BEL', CURRENT_TIMESTAMP),
(N'TOM', NULL, N'BEL', CURRENT_TIMESTAMP),
(N'LSO', NULL, N'BEL', CURRENT_TIMESTAMP),
(N'LTM', NULL, N'BEL', CURRENT_TIMESTAMP),
(N'LGM', NULL, N'BEL', CURRENT_TIMESTAMP),
(N'RTJ', NULL, N'BEL', CURRENT_TIMESTAMP),
(N'TPI', NULL, N'BEL', CURRENT_TIMESTAMP),
(N'TBK', NULL, N'JUL', CURRENT_TIMESTAMP),
(N'TOK', NULL, N'JUL', CURRENT_TIMESTAMP),
(N'LTK', NULL, N'JUL', CURRENT_TIMESTAMP),
(N'LGK', NULL, N'JUL', CURRENT_TIMESTAMP),
(N'RTB', NULL, N'JUL', CURRENT_TIMESTAMP),
(N'TPO', NULL, N'JUL', CURRENT_TIMESTAMP),
(N'LSI', NULL, N'JUL', CURRENT_TIMESTAMP),
(NULL, N'8010-50.40000', N'FAME', CURRENT_TIMESTAMP),
(NULL, N'8010-50.40002', N'FAME', CURRENT_TIMESTAMP),
(NULL, N'8010-50.40010', N'FAME', CURRENT_TIMESTAMP),
(NULL, N'8010-50.40102', N'FAME', CURRENT_TIMESTAMP);

-- AlterTable
ALTER TABLE [dbo].[awb_registration] DROP CONSTRAINT [awb_registration_status_df];
ALTER TABLE [dbo].[awb_registration] ADD CONSTRAINT [awb_registration_status_df] DEFAULT 'ACTIVE' FOR [status];
ALTER TABLE [dbo].[awb_registration] ADD [flow_code] NVARCHAR(20) NULL,
[stage_code] NVARCHAR(30) NULL;

-- Existing registrations: flow from their first DO, OPEN waits at the weighbridge, CHECKED_OUT is done.
EXEC(N'
UPDATE r SET [flow_code] = COALESCE(
  (SELECT TOP 1 fr.[flow_code] FROM [dbo].[awb_registration_do] d
     JOIN [dbo].[mst_flow_rule] fr ON fr.[commodity_code] = d.[commodity_code] AND fr.[transaction_code] IS NULL
   WHERE d.[registration_id] = r.[id] ORDER BY d.[line_number]),
  (SELECT TOP 1 fr.[flow_code] FROM [dbo].[awb_registration_do] d
     JOIN [dbo].[mst_flow_rule] fr ON fr.[transaction_code] = d.[transaction_code] AND fr.[commodity_code] IS NULL
   WHERE d.[registration_id] = r.[id] ORDER BY d.[line_number]),
  N''BEL'')
FROM [dbo].[awb_registration] r;

UPDATE [dbo].[awb_registration] SET
  [stage_code] = CASE WHEN [status] = N''CHECKED_OUT'' THEN N''regist_out'' ELSE N''wb_in'' END,
  [status] = CASE [status] WHEN N''OPEN'' THEN N''ACTIVE'' WHEN N''CHECKED_OUT'' THEN N''COMPLETED'' ELSE [status] END;
');

ALTER TABLE [dbo].[awb_registration] ALTER COLUMN [flow_code] NVARCHAR(20) NOT NULL;
ALTER TABLE [dbo].[awb_registration] ALTER COLUMN [stage_code] NVARCHAR(30) NOT NULL;

-- CreateIndex
CREATE NONCLUSTERED INDEX [awb_registration_stage_code_status_idx] ON [dbo].[awb_registration]([stage_code], [status]);

-- AddForeignKey
ALTER TABLE [dbo].[awb_registration] ADD CONSTRAINT [awb_registration_flow_code_fkey] FOREIGN KEY ([flow_code]) REFERENCES [dbo].[mst_flow]([code]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[awb_registration] ADD CONSTRAINT [awb_registration_flow_code_stage_code_fkey] FOREIGN KEY ([flow_code], [stage_code]) REFERENCES [dbo].[mst_flow_stage]([flow_code],[stage_code]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[mst_flow_stage] ADD CONSTRAINT [mst_flow_stage_flow_code_fkey] FOREIGN KEY ([flow_code]) REFERENCES [dbo].[mst_flow]([code]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[mst_flow_rule] ADD CONSTRAINT [mst_flow_rule_flow_code_fkey] FOREIGN KEY ([flow_code]) REFERENCES [dbo].[mst_flow]([code]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

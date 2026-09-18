ALTER TABLE "cheque_submissions" ADD COLUMN "rejection_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL;

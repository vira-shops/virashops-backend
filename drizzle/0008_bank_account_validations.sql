CREATE TABLE "bank_account_validations" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"user_id" integer NOT NULL,
	"full_name" varchar(160) NOT NULL,
	"account_number" varchar(40) NOT NULL,
	"national_id" varchar(10) NOT NULL,
	"branch_code" varchar(20) NOT NULL,
	"credit_grade" varchar(8),
	"credit_ceiling" integer,
	"provider" varchar(30) DEFAULT 'STUB' NOT NULL,
	"provider_ref" varchar(120),
	"status" varchar(30) DEFAULT 'SUCCEEDED' NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "bank_account_validations" ADD CONSTRAINT "bank_account_validations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "IDX_bank_account_validations_user_id" ON "bank_account_validations" USING btree ("user_id");
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "bank_account_validation_id" integer;
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_bank_account_validation_id_bank_account_validations_id_fk" FOREIGN KEY ("bank_account_validation_id") REFERENCES "public"."bank_account_validations"("id") ON DELETE set null ON UPDATE no action;

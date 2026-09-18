CREATE TABLE "cheque_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"payment_id" integer NOT NULL,
	"full_name" varchar(160) NOT NULL,
	"account_number" varchar(40) NOT NULL,
	"national_id" varchar(10) NOT NULL,
	"branch_code" varchar(20) NOT NULL,
	"status" varchar(30) DEFAULT 'AWAITING_REVIEW' NOT NULL,
	"rejection_reason" varchar(500),
	"reviewed_by_user_id" integer,
	"reviewed_at" timestamp with time zone,
	"cadence" varchar(30),
	"down_payment" integer,
	"plan_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "UQ_cheque_submissions_payment_id" UNIQUE("payment_id")
);
--> statement-breakpoint
ALTER TABLE "cheque_submissions" ADD CONSTRAINT "cheque_submissions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cheque_submissions" ADD CONSTRAINT "cheque_submissions_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "cheque_submission_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"submission_id" integer NOT NULL,
	"image_key" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cheque_submission_photos" ADD CONSTRAINT "cheque_submission_photos_submission_id_cheque_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."cheque_submissions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "IDX_cheque_submissions_status" ON "cheque_submissions" USING btree ("status");

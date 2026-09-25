ALTER TABLE "product_questions" ADD COLUMN IF NOT EXISTS "kind" varchar(20);
--> statement-breakpoint
ALTER TABLE "product_questions" ADD COLUMN IF NOT EXISTS "status" varchar(20);
--> statement-breakpoint
UPDATE "product_questions" SET
  "kind" = COALESCE("kind", 'QUESTION'),
  "status" = COALESCE("status", 'NOT_CONFIRMED');
--> statement-breakpoint
ALTER TABLE "product_questions" ALTER COLUMN "kind" SET DEFAULT 'QUESTION';
--> statement-breakpoint
ALTER TABLE "product_questions" ALTER COLUMN "status" SET DEFAULT 'NOT_CONFIRMED';
--> statement-breakpoint
ALTER TABLE "product_questions" ALTER COLUMN "kind" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "product_questions" ALTER COLUMN "status" SET NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"user_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"rating" integer NOT NULL,
	CONSTRAINT "UQ_product_ratings_user_product" UNIQUE("user_id","product_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_ratings" ADD CONSTRAINT "product_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

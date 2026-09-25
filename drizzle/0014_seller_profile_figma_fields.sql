ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "national_id" varchar(10);
--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "date_of_birth" date;
--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "gender" varchar(10);
--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "avatar_key" varchar(255);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seller_warehouses" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"seller_id" integer NOT NULL,
	"phone" varchar(20),
	"postal_code" varchar(10),
	"city" varchar(80),
	"address" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "seller_warehouses" ADD CONSTRAINT "seller_warehouses_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IDX_seller_warehouses_seller_id" ON "seller_warehouses" ("seller_id");

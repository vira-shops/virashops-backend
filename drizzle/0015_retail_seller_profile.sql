ALTER TABLE "sellers" DROP COLUMN IF EXISTS "email";
--> statement-breakpoint
ALTER TABLE "sellers" DROP COLUMN IF EXISTS "occupation";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "retail_seller_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"user_id" integer NOT NULL,
	"email" varchar(160),
	"occupation" varchar(80),
	"national_id" varchar(10),
	"date_of_birth" date,
	"gender" varchar(10),
	"avatar_key" varchar(255),
	"province" varchar(80),
	"city" varchar(80),
	"address" text,
	"postal_code" varchar(10),
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	CONSTRAINT "UQ_retail_seller_profiles_user_id" UNIQUE("user_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "retail_seller_profiles" ADD CONSTRAINT "retail_seller_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

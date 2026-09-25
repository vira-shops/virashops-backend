ALTER TABLE "buyer_profiles" ADD COLUMN IF NOT EXISTS "national_id" varchar(10);
--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD COLUMN IF NOT EXISTS "gender" varchar(10);
--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD COLUMN IF NOT EXISTS "postal_code" varchar(20);
--> statement-breakpoint
ALTER TABLE "buyer_profiles" DROP COLUMN IF EXISTS "contact_phone";
--> statement-breakpoint
ALTER TABLE "buyer_profiles" DROP COLUMN IF EXISTS "neighborhood";

ALTER TABLE "users" ADD COLUMN "first_name" varchar(80);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" varchar(80);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "activity_type" varchar(80);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "guild_type" varchar(80);--> statement-breakpoint
UPDATE "users" SET
  "first_name" = split_part("full_name", ' ', 1),
  "last_name" = CASE
    WHEN position(' ' in "full_name") > 0 THEN substring("full_name" from position(' ' in "full_name") + 1)
    ELSE ''
  END
WHERE "first_name" IS NULL;--> statement-breakpoint
UPDATE "users" SET "first_name" = '' WHERE "first_name" IS NULL;--> statement-breakpoint
UPDATE "users" SET "last_name" = '' WHERE "last_name" IS NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "first_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "full_name";--> statement-breakpoint
UPDATE "user_roles" SET "role" = 'RETAIL_BUYER' WHERE "role" = 'USER';--> statement-breakpoint
ALTER TABLE "sellers" ALTER COLUMN "shop_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sellers" ALTER COLUMN "province" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sellers" ALTER COLUMN "city" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sellers" ALTER COLUMN "sales_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sellers" ALTER COLUMN "address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "industry_type" varchar(120);--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "category" varchar(120);--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "activity_type" varchar(80);--> statement-breakpoint
UPDATE "sellers" SET "industry_type" = 'UNKNOWN' WHERE "industry_type" IS NULL;--> statement-breakpoint
UPDATE "sellers" SET "category" = 'UNKNOWN' WHERE "category" IS NULL;--> statement-breakpoint
UPDATE "sellers" SET "activity_type" = COALESCE("sales_type", 'STORE') WHERE "activity_type" IS NULL;--> statement-breakpoint
ALTER TABLE "sellers" ALTER COLUMN "industry_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sellers" ALTER COLUMN "category" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sellers" ALTER COLUMN "activity_type" SET NOT NULL;

ALTER TABLE "addresses" ADD COLUMN "recipient_full_name" varchar(160);
--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "recipient_phone" varchar(11);
--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "national_id" varchar(10);
--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "house_number" varchar(40);
--> statement-breakpoint
UPDATE "addresses" SET
  "recipient_full_name" = COALESCE(NULLIF(TRIM("label"), ''), 'Receiver'),
  "recipient_phone" = '09000000000',
  "national_id" = '0000000000',
  "house_number" = '-';
--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "recipient_full_name" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "recipient_phone" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "national_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "house_number" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" varchar(30);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "price_total" integer;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_total" integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "price_after_discount" integer;
--> statement-breakpoint
UPDATE "orders" SET
  "payment_method" = 'ONLINE',
  "price_total" = "goods_total",
  "discount_total" = 0,
  "price_after_discount" = "goods_total";
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "payment_method" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "price_total" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "discount_total" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "price_after_discount" SET NOT NULL;

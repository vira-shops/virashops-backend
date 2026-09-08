CREATE TABLE "product_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"product_id" integer NOT NULL,
	"image_key" varchar(120) NOT NULL,
	"alt_fa" varchar(160),
	"alt_en" varchar(160),
	"is_primary" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_price_tiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"product_id" integer NOT NULL,
	"min_qty" integer NOT NULL,
	"max_qty" integer,
	"unit_price" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"seller_id" integer NOT NULL,
	"seller_shop_name" varchar(160) NOT NULL,
	"seller_logo_key" varchar(80),
	"category_id" integer NOT NULL,
	"category_slug" varchar(80) NOT NULL,
	"category_name_fa" varchar(120) NOT NULL,
	"category_name_en" varchar(120) NOT NULL,
	"parent_category_id" integer,
	"slug" varchar(80) NOT NULL,
	"name_fa" varchar(180) NOT NULL,
	"name_en" varchar(180) NOT NULL,
	"short_description_fa" varchar(240),
	"short_description_en" varchar(240),
	"description_fa" varchar(4000),
	"description_en" varchar(4000),
	"brand" varchar(80),
	"sku" varchar(80),
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 5 NOT NULL,
	"retail_price" integer NOT NULL,
	"compare_at_price" integer,
	"discount_percent" integer DEFAULT 0 NOT NULL,
	"catalog_key" varchar(80),
	"wholesale_moq" integer,
	"wholesale_max_qty" integer,
	"wholesale_pack_multiple" integer,
	"wholesale_cash_price" integer,
	"wholesale_pack_price" integer,
	"wholesale_installment_months" integer,
	"wholesale_installment_fee_percent" integer,
	"specs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"production_date" varchar(16),
	"expiry_date" varchar(16),
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "UQ_products_slug" UNIQUE("slug")
);
--> statement-breakpoint
DROP INDEX "IDX_categories_parent_id";--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price_tiers" ADD CONSTRAINT "product_price_tiers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_product_images_product_id" ON "product_images" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "IDX_product_price_tiers_product_id" ON "product_price_tiers" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "IDX_products_seller_id" ON "products" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "IDX_products_category_id" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "IDX_products_category_slug" ON "products" USING btree ("category_slug");--> statement-breakpoint
CREATE INDEX "IDX_products_status" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_products_published" ON "products" USING btree ("published");--> statement-breakpoint
CREATE INDEX "IDX_products_updated_at" ON "products" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "IDX_categories_parent_id" ON "categories" ("parent_id");--> statement-breakpoint
CREATE INDEX "IDX_products_name_fa_trgm" ON "products" USING gin ("name_fa" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "IDX_products_name_en_trgm" ON "products" USING gin ("name_en" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "IDX_products_slug_trgm" ON "products" USING gin ("slug" gin_trgm_ops);--> statement-breakpoint
INSERT INTO "users" (
  "id", "phone", "first_name", "last_name", "status", "phone_verified_at", "activity_type", "guild_type"
) VALUES (
  900001, '09000000999', 'Catalog', 'Seller', 'ACTIVE', now(), 'STORE', 'FOOD'
);--> statement-breakpoint
INSERT INTO "user_roles" ("user_id", "role") VALUES
  (900001, 'RETAIL_SELLER'),
  (900001, 'WHOLESALE_SELLER');--> statement-breakpoint
INSERT INTO "sellers" (
  "id", "user_id", "kind", "shop_name", "workplace_phone", "province", "city",
  "postal_code", "sales_type", "address", "industry_type", "category",
  "activity_type", "document_type", "document_key", "status"
) VALUES (
  900001, 900001, 'BOTH', 'ویراشاپس', '02100000000', 'Tehran', 'Tehran',
  '1234567890', 'STORE', 'Catalog seed booth', 'FOOD', 'GROCERY',
  'STORE', 'BUSINESS_LICENSE', 'seed/catalog-seller.pdf', 'ACTIVE'
);--> statement-breakpoint
INSERT INTO "products" (
  "id", "seller_id", "seller_shop_name", "seller_logo_key",
  "category_id", "category_slug", "category_name_fa", "category_name_en", "parent_category_id",
  "slug", "name_fa", "name_en", "short_description_fa", "short_description_en",
  "description_fa", "description_en", "brand", "sku", "status", "published",
  "quantity", "low_stock_threshold", "retail_price", "compare_at_price", "discount_percent",
  "catalog_key", "wholesale_moq", "wholesale_max_qty", "wholesale_pack_multiple",
  "wholesale_cash_price", "wholesale_pack_price",
  "wholesale_installment_months", "wholesale_installment_fee_percent",
  "specs", "production_date", "expiry_date", "sort_order"
) VALUES
(
  1, 900001, 'ویراشاپس', 'virashops',
  18, 'soda', 'نوشابه', 'Soda', 7,
  'pepsi-cola-6pk', 'نوشابه کولا پپسی', 'Pepsi Cola Soft Drink',
  'بسته ۶ عددی ۱.۵ لیتر', '6-pack of 1.5L bottles',
  'نوشابه گازدار کولا پپسی در بسته شش‌عددی.', 'Pepsi cola soft drink in a six-pack.',
  'Pepsi', 'PEPSI-15-6', 'ACTIVE', true,
  120, 5, 2540000, 2800000, 20,
  'pepsi-1.5l-6pk', 1, 40, 1,
  2400000, 2540000, 5, 4,
  '[{"key":"volume","labelFa":"حجم","labelEn":"Volume","valueFa":"۱.۵ لیتر","valueEn":"1.5 liters"},{"key":"pack","labelFa":"بسته‌بندی","labelEn":"Packaging","valueFa":"بسته ۶ عددی","valueEn":"6-pack"},{"key":"material","labelFa":"جنس","labelEn":"Material","valueFa":"پلاستیکی","valueEn":"Plastic"}]'::jsonb,
  '1402/05/17', '1403/05/17', 1
),
(
  2, 900001, 'ویراشاپس', 'virashops',
  18, 'soda', 'نوشابه', 'Soda', 7,
  'coca-cola-6pk', 'نوشابه کولا کوکاکولا', 'Coca-Cola Soft Drink',
  'بسته ۶ عددی ۱.۵ لیتر', '6-pack of 1.5L bottles',
  'نوشابه گازدار کوکاکولا.', 'Coca-Cola soft drink six-pack.',
  'Coca-Cola', 'COKE-15-6', 'ACTIVE', true,
  80, 5, 2520000, 2750000, 15,
  'coke-1.5l-6pk', 1, 40, 1,
  2380000, 2520000, 5, 4,
  '[{"key":"volume","labelFa":"حجم","labelEn":"Volume","valueFa":"۱.۵ لیتر","valueEn":"1.5 liters"},{"key":"pack","labelFa":"بسته‌بندی","labelEn":"Packaging","valueFa":"بسته ۶ عددی","valueEn":"6-pack"}]'::jsonb,
  '1402/06/01', '1403/06/01', 2
),
(
  3, 900001, 'ویراشاپس', 'virashops',
  4, 'snacks', 'تنقلات', 'Snacks', 1,
  'cheetoz-cheese', 'چیپس چیزوز پنیری', 'Cheetoz Cheese Chips',
  'چیبس پنیری ۱۰۰ گرم', '100g cheese chips',
  'اسنک پنیری چیزوز.', 'Cheetoz cheese snack.',
  'Cheetoz', 'CHEETOZ-100', 'ACTIVE', true,
  0, 5, 89000, 110000, 20,
  'cheetoz-cheese-100', NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  '[{"key":"weight","labelFa":"وزن","labelEn":"Weight","valueFa":"۱۰۰ گرم","valueEn":"100 grams"}]'::jsonb,
  NULL, NULL, 3
),
(
  4, 900001, 'ویراشاپس', 'virashops',
  4, 'snacks', 'تنقلات', 'Snacks', 1,
  'chips-classic', 'چیپس سیب‌زمینی کلاسیک', 'Classic Potato Chips',
  'بسته ۱۴۰ گرم', '140g pack',
  'چیپس سیب‌زمینی کلاسیک.', 'Classic potato chips.',
  'Vira', 'CHIPS-140', 'ACTIVE', true,
  45, 5, 75000, NULL, 0,
  'chips-classic-140', NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  '[{"key":"weight","labelFa":"وزن","labelEn":"Weight","valueFa":"۱۴۰ گرم","valueEn":"140 grams"}]'::jsonb,
  NULL, NULL, 4
),
(
  5, 900001, 'ویراشاپس', 'virashops',
  15, 'chicken', 'مرغ', 'Chicken', 3,
  'chicken-breast-1kg', 'سینه مرغ تازه', 'Fresh Chicken Breast',
  'یک کیلوگرم', '1 kilogram',
  'سینه مرغ تازه بسته‌بندی شده.', 'Packaged fresh chicken breast.',
  'Pouya', 'CHK-BR-1', 'ACTIVE', true,
  25, 5, 420000, 450000, 10,
  'chicken-breast-1kg', 2, 30, 1,
  400000, 420000, NULL, NULL,
  '[{"key":"weight","labelFa":"وزن","labelEn":"Weight","valueFa":"۱ کیلوگرم","valueEn":"1 kilogram"}]'::jsonb,
  '1403/01/10', '1403/01/17', 5
),
(
  6, 900001, 'ویراشاپس', 'virashops',
  3, 'protein', 'پروتئین', 'Protein', 1,
  'minced-meat-1kg', 'گوشت چرخ‌کرده مخلوط', 'Mixed Minced Meat',
  'گوساله و گوسفند - ۱ کیلوگرم', 'Beef and lamb - 1kg',
  'گوشت چرخ‌کرده مخلوط پویا پروتئین.', 'Pouya Protein mixed minced meat.',
  'Pouya Protein', 'MEAT-MINCE-1', 'ACTIVE', true,
  18, 5, 890000, 950000, 10,
  'minced-meat-1kg', 1, 20, 1,
  850000, 890000, 5, 3,
  '[{"key":"weight","labelFa":"وزن","labelEn":"Weight","valueFa":"۱ کیلوگرم","valueEn":"1 kilogram"}]'::jsonb,
  '1403/01/12', '1403/01/18', 6
),
(
  7, 900001, 'ویراشاپس', 'virashops',
  10, 'bread', 'نان', 'Bread', 2,
  'barbari-bread', 'نان بربری تازه', 'Fresh Barbari Bread',
  'نان سنتی', 'Traditional bread',
  'نان بربری تازه روزانه.', 'Fresh daily barbari bread.',
  'Vira Bakery', 'BREAD-BAR', 'ACTIVE', true,
  60, 5, 35000, NULL, 0,
  'barbari-bread', NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  '[{"key":"type","labelFa":"نوع","labelEn":"Type","valueFa":"بربری","valueEn":"Barbari"}]'::jsonb,
  NULL, NULL, 7
),
(
  8, 900001, 'ویراشاپس', 'virashops',
  2, 'staples', 'کالای اساسی', 'Staples', 1,
  'sugar-1kg', 'شکر سفید یک کیلویی', 'White Sugar 1kg',
  'بسته یک کیلویی', '1kg pack',
  'شکر سفید فله بسته‌بندی شده.', 'Packaged white sugar.',
  'Vira', 'SUGAR-1KG', 'ACTIVE', true,
  200, 10, 68000, 75000, 10,
  'sugar-1kg', 5, 100, 5,
  65000, 68000, NULL, NULL,
  '[{"key":"weight","labelFa":"وزن","labelEn":"Weight","valueFa":"۱ کیلوگرم","valueEn":"1 kilogram"}]'::jsonb,
  NULL, NULL, 8
);--> statement-breakpoint
INSERT INTO "product_images" (
  "product_id", "image_key", "alt_fa", "alt_en", "is_primary", "sort_order"
) VALUES
  (1, 'pepsi-cola-6pk', 'نوشابه کولا پپسی', 'Pepsi Cola Soft Drink', true, 0),
  (1, 'pepsi-cola-6pk-side', 'نمای جانبی پپسی', 'Pepsi side view', false, 1),
  (2, 'coca-cola-6pk', 'نوشابه کولا کوکاکولا', 'Coca-Cola Soft Drink', true, 0),
  (3, 'cheetoz-cheese', 'چیپس چیزوز', 'Cheetoz chips', true, 0),
  (4, 'chips-classic', 'چیپس کلاسیک', 'Classic chips', true, 0),
  (5, 'chicken-breast-1kg', 'سینه مرغ', 'Chicken breast', true, 0),
  (6, 'minced-meat-1kg', 'گوشت چرخ‌کرده', 'Minced meat', true, 0),
  (7, 'barbari-bread', 'نان بربری', 'Barbari bread', true, 0),
  (8, 'sugar-1kg', 'شکر سفید', 'White sugar', true, 0);--> statement-breakpoint
INSERT INTO "product_price_tiers" (
  "product_id", "min_qty", "max_qty", "unit_price"
) VALUES
  (1, 1, 5, 2540000),
  (1, 6, 10, 2480000),
  (1, 11, 20, 2420000),
  (1, 21, NULL, 2360000),
  (2, 1, 10, 2520000),
  (2, 11, NULL, 2400000),
  (5, 2, 10, 410000),
  (5, 11, NULL, 400000),
  (6, 1, 5, 890000),
  (6, 6, NULL, 850000),
  (8, 5, 20, 68000),
  (8, 21, NULL, 65000);--> statement-breakpoint
SELECT setval('users_id_seq', GREATEST((SELECT MAX(id) FROM "users"), 900001));--> statement-breakpoint
SELECT setval('sellers_id_seq', GREATEST((SELECT MAX(id) FROM "sellers"), 900001));--> statement-breakpoint
SELECT setval('products_id_seq', (SELECT MAX(id) FROM "products"));
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"parent_id" integer,
	"slug" varchar(80) NOT NULL,
	"name_fa" varchar(120) NOT NULL,
	"name_en" varchar(120) NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"icon_key" varchar(80),
	"image_key" varchar(80),
	"depth" integer NOT NULL,
	CONSTRAINT "UQ_categories_slug" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "IDX_categories_parent_id" ON "categories" ("parent_id");
--> statement-breakpoint
CREATE INDEX "IDX_categories_name_fa_trgm" ON "categories" USING gin ("name_fa" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX "IDX_categories_name_en_trgm" ON "categories" USING gin ("name_en" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX "IDX_categories_slug_trgm" ON "categories" USING gin ("slug" gin_trgm_ops);
--> statement-breakpoint
INSERT INTO "categories" (
  "id", "parent_id", "slug", "name_fa", "name_en", "status", "sort_order", "icon_key", "image_key", "depth"
) VALUES
  (1, NULL, 'food', 'مواد غذایی', 'Food', 'ACTIVE', 1, 'food', 'food', 1),
  (2, 1, 'staples', 'کالای اساسی', 'Staples', 'ACTIVE', 1, 'staples', 'staples', 2),
  (3, 1, 'protein', 'پروتئین', 'Protein', 'ACTIVE', 2, 'protein', 'protein', 2),
  (4, 1, 'snacks', 'تنقلات', 'Snacks', 'ACTIVE', 3, 'snacks', 'snacks', 2),
  (5, 1, 'canned', 'کنسرویجات', 'Canned goods', 'ACTIVE', 4, 'canned', 'canned', 2),
  (6, 1, 'nuts', 'آجیل و خشکبار', 'Nuts and dried fruits', 'ACTIVE', 5, 'nuts', 'nuts', 2),
  (7, 1, 'drinks', 'نوشیدنی', 'Drinks', 'ACTIVE', 6, 'drinks', 'drinks', 2),
  (8, 1, 'dairy', 'لبنیات', 'Dairy', 'ACTIVE', 7, 'dairy', 'dairy', 2),
  (9, 1, 'hot-drinks', 'نوشیدنی گرم', 'Hot drinks', 'ACTIVE', 8, 'hot-drinks', 'hot-drinks', 2),
  (10, 2, 'bread', 'نان', 'Bread', 'ACTIVE', 1, NULL, NULL, 3),
  (11, 2, 'pasta', 'ماکارونی', 'Pasta', 'ACTIVE', 2, NULL, NULL, 3),
  (12, 2, 'sugar', 'شکر', 'Sugar', 'ACTIVE', 3, NULL, NULL, 3),
  (13, 2, 'tomato-paste', 'رب گوجه', 'Tomato paste', 'ACTIVE', 4, NULL, NULL, 3),
  (14, 2, 'tea', 'چای', 'Tea', 'ACTIVE', 5, NULL, NULL, 3),
  (15, 3, 'chicken', 'مرغ', 'Chicken', 'ACTIVE', 1, NULL, NULL, 3),
  (16, 3, 'kingfish', 'ماهی شیر', 'Kingfish', 'ACTIVE', 2, NULL, NULL, 3),
  (17, 3, 'shrimp', 'میگو', 'Shrimp', 'ACTIVE', 3, NULL, NULL, 3),
  (18, 7, 'soda', 'نوشابه', 'Soda', 'ACTIVE', 1, NULL, NULL, 3),
  (19, 8, 'ice-cream', 'بستنی', 'Ice cream', 'ACTIVE', 1, NULL, NULL, 3);
--> statement-breakpoint
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM "categories"));

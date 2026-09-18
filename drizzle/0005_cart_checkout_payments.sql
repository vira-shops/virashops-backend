CREATE TABLE "idempotency_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"actor_type" varchar(16) NOT NULL,
	"actor_id" varchar(64) NOT NULL,
	"endpoint" varchar(150) NOT NULL,
	"idempotency_key" varchar(100) NOT NULL,
	"request_hash" varchar(64) NOT NULL,
	"status" varchar(20) DEFAULT 'processing' NOT NULL,
	"status_code" integer,
	"response_body" jsonb,
	"resource_id" varchar(64),
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "UQ_idempotency_actor_endpoint_key" UNIQUE("actor_type","actor_id","endpoint","idempotency_key")
);
--> statement-breakpoint
CREATE INDEX "IDX_idempotency_expires_at" ON "idempotency_records" USING btree ("expires_at");
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"user_id" integer NOT NULL,
	"label" varchar(120) NOT NULL,
	"line1" varchar(255) NOT NULL,
	"line2" varchar(255),
	"city" varchar(120) NOT NULL,
	"province" varchar(120) NOT NULL,
	"postal_code" varchar(20),
	"is_default" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"user_id" integer NOT NULL,
	"channel" varchar(20) DEFAULT 'WHOLESALE' NOT NULL,
	CONSTRAINT "UQ_carts_user_id" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"cart_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"seller_id" integer NOT NULL,
	"seller_shop_name" varchar(160) NOT NULL,
	"seller_logo_key" varchar(255),
	"product_name_fa" varchar(255) NOT NULL,
	"product_name_en" varchar(255) NOT NULL,
	"image_key" varchar(255),
	"pack_qty" integer DEFAULT 0 NOT NULL,
	"piece_qty" integer DEFAULT 0 NOT NULL,
	"pack_multiple" integer DEFAULT 1 NOT NULL,
	"unit_price" integer NOT NULL,
	"pack_price" integer NOT NULL,
	"commission_percent" integer DEFAULT 5 NOT NULL,
	"prepayment_amount" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "UQ_cart_items_cart_product" UNIQUE("cart_id","product_id")
);
--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "checkout_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"user_id" integer NOT NULL,
	"seller_id" integer NOT NULL,
	"seller_shop_name" varchar(160) NOT NULL,
	"seller_logo_key" varchar(255),
	"status" varchar(30) DEFAULT 'AWAITING_PAYMENT' NOT NULL,
	"address" jsonb NOT NULL,
	"shipping_method" varchar(40) NOT NULL,
	"shipping_fee" integer DEFAULT 0 NOT NULL,
	"delivery_date" varchar(10) NOT NULL,
	"window_start_hour" integer NOT NULL,
	"window_end_hour" integer NOT NULL,
	"note" varchar(500),
	"lines" jsonb NOT NULL,
	"lines_hash" varchar(64) NOT NULL,
	"goods_total" integer NOT NULL,
	"commission_total" integer NOT NULL,
	"prepayment_total" integer NOT NULL,
	"payable_amount" integer NOT NULL,
	"order_id" integer
);
--> statement-breakpoint
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"order_number" varchar(40) NOT NULL,
	"user_id" integer NOT NULL,
	"seller_id" integer NOT NULL,
	"seller_shop_name" varchar(160) NOT NULL,
	"checkout_session_id" integer NOT NULL,
	"status" varchar(30) DEFAULT 'PAID' NOT NULL,
	"payment_status" varchar(30) DEFAULT 'PAID' NOT NULL,
	"address" jsonb NOT NULL,
	"shipping_method" varchar(40) NOT NULL,
	"shipping_fee" integer NOT NULL,
	"delivery_date" varchar(10) NOT NULL,
	"window_start_hour" integer NOT NULL,
	"window_end_hour" integer NOT NULL,
	"note" varchar(500),
	"goods_total" integer NOT NULL,
	"commission_total" integer NOT NULL,
	"prepayment_total" integer NOT NULL,
	"grand_total" integer NOT NULL,
	CONSTRAINT "UQ_orders_order_number" UNIQUE("order_number"),
	CONSTRAINT "UQ_orders_checkout_session" UNIQUE("checkout_session_id")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"product_name_fa" varchar(255) NOT NULL,
	"product_name_en" varchar(255) NOT NULL,
	"image_key" varchar(255),
	"pack_qty" integer NOT NULL,
	"piece_qty" integer NOT NULL,
	"pack_multiple" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"pack_price" integer NOT NULL,
	"commission_percent" integer NOT NULL,
	"commission_amount" integer NOT NULL,
	"prepayment_amount" integer NOT NULL,
	"goods_amount" integer NOT NULL,
	"line_total" integer NOT NULL,
	"total_units" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"user_id" integer NOT NULL,
	"checkout_session_id" integer NOT NULL,
	"order_id" integer,
	"method" varchar(30) NOT NULL,
	"amount" integer NOT NULL,
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"provider_ref" varchar(120),
	"redirect_url" varchar(500),
	CONSTRAINT "UQ_payments_provider_ref" UNIQUE("provider_ref")
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;

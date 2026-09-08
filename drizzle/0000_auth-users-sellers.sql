CREATE TABLE "user_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"role" varchar(32) NOT NULL,
	CONSTRAINT "UQ_user_roles_user_id_role" UNIQUE("user_id","role")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"phone" varchar(11) NOT NULL,
	"full_name" varchar(120) NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"phone_verified_at" timestamp with time zone,
	CONSTRAINT "UQ_users_phone" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "sellers" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"user_id" integer NOT NULL,
	"kind" varchar(20) NOT NULL,
	"shop_name" varchar(160) NOT NULL,
	"workplace_phone" varchar(20),
	"province" varchar(80) NOT NULL,
	"city" varchar(80) NOT NULL,
	"postal_code" varchar(10),
	"sales_type" varchar(20) NOT NULL,
	"address" text NOT NULL,
	"document_type" varchar(32) NOT NULL,
	"document_key" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	CONSTRAINT "UQ_sellers_user_id" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
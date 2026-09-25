CREATE TABLE "buyer_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"user_id" integer NOT NULL,
	"national_id" varchar(10),
	"date_of_birth" date,
	"gender" varchar(10),
	"avatar_key" varchar(255),
	"business_name" varchar(160),
	"business_phone" varchar(20),
	"postal_code" varchar(20),
	"province" varchar(80),
	"city" varchar(80),
	"address" text,
	"identity_type" varchar(20),
	"document_key_1" varchar(255),
	"document_key_2" varchar(255),
	CONSTRAINT "UQ_buyer_profiles_user_id" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD CONSTRAINT "buyer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

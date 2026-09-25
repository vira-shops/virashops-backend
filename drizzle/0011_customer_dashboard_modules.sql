CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"recipient_user_id" integer NOT NULL,
	"type" varchar(30) DEFAULT 'SYSTEM' NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"priority" varchar(20) DEFAULT 'NORMAL' NOT NULL,
	"related_entity_type" varchar(60),
	"related_entity_id" varchar(60),
	"metadata" jsonb,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"user_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	CONSTRAINT "UQ_favorites_user_product" UNIQUE("user_id","product_id")
);
--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "product_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"user_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"body" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_questions" ADD CONSTRAINT "product_questions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "product_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"question_id" integer NOT NULL,
	"author_user_id" integer NOT NULL,
	"body" text NOT NULL,
	"seen_by_asker_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "product_answers" ADD CONSTRAINT "product_answers_question_id_product_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."product_questions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "product_answers" ADD CONSTRAINT "product_answers_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;

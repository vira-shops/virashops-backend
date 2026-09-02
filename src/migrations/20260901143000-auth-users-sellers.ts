import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthUsersSellers20260901143000 implements MigrationInterface {
  name = 'AuthUsersSellers20260901143000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "phone" character varying(11) NOT NULL,
        "full_name" character varying(120) NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'ACTIVE',
        "phone_verified_at" TIMESTAMPTZ,
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_phone" UNIQUE ("phone")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "role" character varying(32) NOT NULL,
        CONSTRAINT "PK_user_roles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_roles_user_id_role" UNIQUE ("user_id", "role"),
        CONSTRAINT "FK_user_roles_user_id" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "sellers" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "user_id" integer NOT NULL,
        "kind" character varying(20) NOT NULL,
        "shop_name" character varying(160) NOT NULL,
        "workplace_phone" character varying(20),
        "province" character varying(80) NOT NULL,
        "city" character varying(80) NOT NULL,
        "postal_code" character varying(10),
        "sales_type" character varying(20) NOT NULL,
        "address" text NOT NULL,
        "document_type" character varying(32) NOT NULL,
        "document_key" character varying(255) NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'PENDING',
        CONSTRAINT "PK_sellers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sellers_user_id" UNIQUE ("user_id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_sellers_user_id" ON "sellers" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "sellers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import type { DrizzleDB } from './drizzle.token';

@Injectable()
export default class DrizzleClient implements OnModuleDestroy {
  readonly db: DrizzleDB;
  private readonly pool: Pool;

  constructor(config: ConfigService) {
    this.pool = new Pool({
      host: config.getOrThrow<string>('DB_HOST'),
      port: config.getOrThrow<number>('DB_PORT'),
      user: config.getOrThrow<string>('DB_USER'),
      password: config.getOrThrow<string>('DB_PASSWORD'),
      database: config.getOrThrow<string>('DB_NAME'),
    });
    this.db = drizzle(this.pool, {
      schema,
      logger: Boolean(config.get('DB_LOGGING')),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}

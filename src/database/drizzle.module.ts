import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import DrizzleClient from './drizzle.client';
import { DRIZZLE } from './drizzle.token';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    DrizzleClient,
    {
      provide: DRIZZLE,
      useFactory: (client: DrizzleClient) => client.db,
      inject: [DrizzleClient],
    },
  ],
  exports: [DRIZZLE],
})
export default class DrizzleModule {}

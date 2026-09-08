import { Module } from '@nestjs/common';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import {
  PENDING_SIGNUP_REPOSITORY,
  USER_REPOSITORY,
} from '../shared/tokens/port.token';
import RedisPendingSignupAdapter from './redis/pending-signup.repository.adapter';
import DrizzleUserRepositoryAdapter from './drizzle/repositories/user.repository.adapter';

@Module({
  imports: [CoreInfrastructureModule],
  providers: [
    { provide: USER_REPOSITORY, useClass: DrizzleUserRepositoryAdapter },
    {
      provide: PENDING_SIGNUP_REPOSITORY,
      useClass: RedisPendingSignupAdapter,
    },
  ],
  exports: [USER_REPOSITORY, PENDING_SIGNUP_REPOSITORY],
})
export default class UsersInfrastructureModule {}

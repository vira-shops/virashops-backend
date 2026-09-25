import { Module } from '@nestjs/common';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import {
  BUYER_PROFILE_REPOSITORY,
  PENDING_SIGNUP_REPOSITORY,
  USER_REPOSITORY,
} from '../shared/tokens/port.token';
import RedisPendingSignupAdapter from './redis/pending-signup.repository.adapter';
import DrizzleBuyerProfileRepositoryAdapter from './drizzle/repositories/buyer-profile.repository.adapter';
import DrizzleUserRepositoryAdapter from './drizzle/repositories/user.repository.adapter';

@Module({
  imports: [CoreInfrastructureModule],
  providers: [
    { provide: USER_REPOSITORY, useClass: DrizzleUserRepositoryAdapter },
    {
      provide: BUYER_PROFILE_REPOSITORY,
      useClass: DrizzleBuyerProfileRepositoryAdapter,
    },
    {
      provide: PENDING_SIGNUP_REPOSITORY,
      useClass: RedisPendingSignupAdapter,
    },
  ],
  exports: [
    USER_REPOSITORY,
    BUYER_PROFILE_REPOSITORY,
    PENDING_SIGNUP_REPOSITORY,
  ],
})
export default class UsersInfrastructureModule {}

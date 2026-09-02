import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import {
  PENDING_SIGNUP_REPOSITORY,
  USER_REPOSITORY,
} from '../shared/tokens/port.token';
import RedisPendingSignupAdapter from './redis/pending-signup.repository.adapter';
import UserEntity from './typeorm/entities/user.entity';
import UserRoleEntity from './typeorm/entities/user-role.entity';
import TypeOrmUserRepositoryAdapter from './typeorm/repositories/user.repository.adapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, UserRoleEntity]),
    CoreInfrastructureModule,
  ],
  providers: [
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepositoryAdapter },
    {
      provide: PENDING_SIGNUP_REPOSITORY,
      useClass: RedisPendingSignupAdapter,
    },
  ],
  exports: [USER_REPOSITORY, PENDING_SIGNUP_REPOSITORY],
})
export default class UsersInfrastructureModule {}

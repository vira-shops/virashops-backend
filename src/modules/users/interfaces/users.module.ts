import { Module } from '@nestjs/common';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import EnsureUserForSellerUseCase from '../domain/application/usecases/ensure-user-for-seller.usecase';
import GetBuyerProfileUseCase from '../domain/application/usecases/get-buyer-profile.usecase';
import GetMeUseCase from '../domain/application/usecases/get-me.usecase';
import IssueSessionUseCase from '../domain/application/usecases/issue-session.usecase';
import LogoutUseCase from '../domain/application/usecases/logout.usecase';
import RequestOtpUseCase from '../domain/application/usecases/request-otp.usecase';
import SignupStep1UseCase from '../domain/application/usecases/signup-step1.usecase';
import SignupStep2UseCase from '../domain/application/usecases/signup-step2.usecase';
import SignupUserUseCase from '../domain/application/usecases/signup-user.usecase';
import UpdateBuyerProfileUseCase from '../domain/application/usecases/update-buyer-profile.usecase';
import VerifyOtpUseCase from '../domain/application/usecases/verify-otp.usecase';
import UsersInfrastructureModule from '../infrastructure/infrastructure.module';
import AdminSeedService from './admin-seed.service';
import AuthController from './http/controllers/auth.controller';
import BuyerProfileController from './http/controllers/buyer-profile.controller';
import JwtAuthGuard from './http/guards/jwt-auth.guard';
import RolesGuard from './http/guards/roles.guard';

@Module({
  imports: [UsersInfrastructureModule, CoreInfrastructureModule],
  controllers: [AuthController, BuyerProfileController],
  providers: [
    SignupUserUseCase,
    SignupStep1UseCase,
    SignupStep2UseCase,
    RequestOtpUseCase,
    VerifyOtpUseCase,
    LogoutUseCase,
    GetMeUseCase,
    GetBuyerProfileUseCase,
    UpdateBuyerProfileUseCase,
    IssueSessionUseCase,
    EnsureUserForSellerUseCase,
    JwtAuthGuard,
    RolesGuard,
    AdminSeedService,
  ],
  exports: [
    UsersInfrastructureModule,
    EnsureUserForSellerUseCase,
    IssueSessionUseCase,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export default class UsersModule {}

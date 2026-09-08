import { Global, Module } from '@nestjs/common';
import { CREATE_PENDING_SELLER } from '../../users/shared/tokens/port.token';
import { SELLER_SUMMARY_QUERY } from '../../users/shared/tokens/port.token';
import { SELLER_REPOSITORY } from '../shared/tokens/port.token';
import SignupSellerUseCase from '../domain/application/usecases/signup-seller.usecase';
import SellerSummaryQueryAdapter from './drizzle/repositories/seller-summary.query.adapter';
import DrizzleSellerRepositoryAdapter from './drizzle/repositories/seller.repository.adapter';

@Global()
@Module({
  providers: [
    { provide: SELLER_REPOSITORY, useClass: DrizzleSellerRepositoryAdapter },
    {
      provide: SELLER_SUMMARY_QUERY,
      useClass: SellerSummaryQueryAdapter,
    },
    SignupSellerUseCase,
    { provide: CREATE_PENDING_SELLER, useExisting: SignupSellerUseCase },
  ],
  exports: [
    SELLER_REPOSITORY,
    SELLER_SUMMARY_QUERY,
    CREATE_PENDING_SELLER,
    SignupSellerUseCase,
  ],
})
export default class SellersInfrastructureModule {}

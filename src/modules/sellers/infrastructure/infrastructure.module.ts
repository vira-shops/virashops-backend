import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SELLER_SUMMARY_QUERY } from '../../users/shared/tokens/port.token';
import { SELLER_REPOSITORY } from '../shared/tokens/port.token';
import SellerEntity from './typeorm/entities/seller.entity';
import TypeOrmSellerSummaryQueryAdapter from './typeorm/repositories/seller-summary.query.adapter';
import TypeOrmSellerRepositoryAdapter from './typeorm/repositories/seller.repository.adapter';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SellerEntity])],
  providers: [
    { provide: SELLER_REPOSITORY, useClass: TypeOrmSellerRepositoryAdapter },
    {
      provide: SELLER_SUMMARY_QUERY,
      useClass: TypeOrmSellerSummaryQueryAdapter,
    },
  ],
  exports: [SELLER_REPOSITORY, SELLER_SUMMARY_QUERY],
})
export default class SellersInfrastructureModule {}

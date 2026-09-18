import { Module } from '@nestjs/common';
import { ADDRESS_REPOSITORY } from '../shared/tokens/port.token';
import DrizzleAddressRepositoryAdapter from './drizzle/repositories/address.repository.adapter';

@Module({
  providers: [
    {
      provide: ADDRESS_REPOSITORY,
      useClass: DrizzleAddressRepositoryAdapter,
    },
  ],
  exports: [ADDRESS_REPOSITORY],
})
export default class AddressesInfrastructureModule {}

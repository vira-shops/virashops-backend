import { Module } from '@nestjs/common';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import UsersModule from '../../users/interfaces/users.module';
import CreateAddressUseCase from '../domain/application/usecases/create-address.usecase';
import DeleteAddressUseCase from '../domain/application/usecases/delete-address.usecase';
import GetAddressForUserUseCase from '../domain/application/usecases/get-address-for-user.usecase';
import ListAddressesUseCase from '../domain/application/usecases/list-addresses.usecase';
import UpdateAddressUseCase from '../domain/application/usecases/update-address.usecase';
import AddressesInfrastructureModule from '../infrastructure/infrastructure.module';
import AddressesController from './http/controllers/addresses.controller';

@Module({
  imports: [
    AddressesInfrastructureModule,
    CoreInfrastructureModule,
    UsersModule,
  ],
  controllers: [AddressesController],
  providers: [
    ListAddressesUseCase,
    CreateAddressUseCase,
    UpdateAddressUseCase,
    DeleteAddressUseCase,
    GetAddressForUserUseCase,
  ],
  exports: [GetAddressForUserUseCase, ListAddressesUseCase],
})
export default class AddressesModule {}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import ApiResponse from '../../../../../common/http/api-response';
import Role from '../../../../users/domain/model/enums/role.enum';
import User from '../../../../users/domain/model/user.model';
import CurrentUser from '../../../../users/interfaces/http/decorators/current-user.decorator';
import Roles from '../../../../users/interfaces/http/decorators/roles.decorator';
import JwtAuthGuard from '../../../../users/interfaces/http/guards/jwt-auth.guard';
import RolesGuard from '../../../../users/interfaces/http/guards/roles.guard';
import DeleteAddressCommand from '../../../domain/application/commands/delete-address.command';
import ListAddressesQuery from '../../../domain/application/queries/list-addresses.query';
import CreateAddressUseCase from '../../../domain/application/usecases/create-address.usecase';
import DeleteAddressUseCase from '../../../domain/application/usecases/delete-address.usecase';
import ListAddressesUseCase from '../../../domain/application/usecases/list-addresses.usecase';
import UpdateAddressUseCase from '../../../domain/application/usecases/update-address.usecase';
import UpsertAddressHttpDto from '../dto/upsert-address.http-dto';
import AddressHttpMapper from '../mappers/address-http.mapper';

@ApiTags('addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RETAIL_BUYER, Role.WHOLESALE_BUYER)
@Controller('addresses')
export default class AddressesController {
  constructor(
    private readonly listAddresses: ListAddressesUseCase,
    private readonly createAddress: CreateAddressUseCase,
    private readonly updateAddress: UpdateAddressUseCase,
    private readonly deleteAddress: DeleteAddressUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List buyer addresses' })
  async list(@CurrentUser() user: User) {
    const items = await this.listAddresses.execute(
      new ListAddressesQuery(user.getId()),
    );
    return ApiResponse.of(
      items.map((item) => AddressHttpMapper.toResponse(item)),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create address' })
  async create(@CurrentUser() user: User, @Body() dto: UpsertAddressHttpDto) {
    const address = await this.createAddress.execute(
      AddressHttpMapper.toCreateCommand(user.getId(), dto),
    );
    return ApiResponse.created(AddressHttpMapper.toResponse(address));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update address' })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertAddressHttpDto,
  ) {
    const address = await this.updateAddress.execute(
      AddressHttpMapper.toUpdateCommand(user.getId(), id, dto),
    );
    return ApiResponse.of(AddressHttpMapper.toResponse(address));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete address' })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.deleteAddress.execute(
      new DeleteAddressCommand(user.getId(), id),
    );
    return ApiResponse.of({ deleted: true });
  }
}

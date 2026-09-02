import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import ApiResponse from '../../../../../common/http/api-response';
import AuthHttpMapper from '../../../../users/interfaces/http/mappers/auth-http.mapper';
import SignupSellerUseCase from '../../../domain/application/usecases/signup-seller.usecase';
import SignupSellerHttpDto from '../dto/signup-seller.http-dto';
import SellerHttpMapper from '../mappers/seller-http.mapper';

@ApiTags('auth')
@Controller('auth/sellers')
export default class SellerAuthController {
  constructor(private readonly signupSeller: SignupSellerUseCase) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('document', { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'kind',
        'fullName',
        'phone',
        'shopName',
        'province',
        'city',
        'salesType',
        'address',
        'documentType',
        'document',
      ],
      properties: {
        kind: { type: 'string', enum: ['RETAIL', 'WHOLESALE'] },
        fullName: { type: 'string' },
        phone: { type: 'string' },
        shopName: { type: 'string' },
        workplacePhone: { type: 'string' },
        province: { type: 'string' },
        city: { type: 'string' },
        postalCode: { type: 'string' },
        salesType: { type: 'string', enum: ['SUPERMARKET', 'STORE'] },
        address: { type: 'string' },
        documentType: {
          type: 'string',
          enum: ['NATIONAL_ID', 'BUSINESS_LICENSE'],
        },
        document: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({
    summary: 'Seller signup (no OTP). Returns JWT; shop stays PENDING',
  })
  async signup(
    @Body() dto: SignupSellerHttpDto,
    @UploadedFile()
    file?: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    const session = await this.signupSeller.execute(
      SellerHttpMapper.toSignupCommand(dto, file),
    );
    return ApiResponse.created(AuthHttpMapper.toSession(session));
  }
}

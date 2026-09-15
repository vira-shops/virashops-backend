import {
  Controller,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import ApiResponse from '../../../../../common/http/api-response';
import JwtAuthGuard from '../../../../users/interfaces/http/guards/jwt-auth.guard';
import UploadFileCommand from '../../../domain/application/commands/upload-file.command';
import GetFileDownloadUrlQuery from '../../../domain/application/queries/get-file-download-url.query';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from '../../../domain/application/services/file-upload.constants';
import GetFileDownloadUrlUseCase from '../../../domain/application/usecases/get-file-download-url.usecase';
import UploadFileUseCase from '../../../domain/application/usecases/upload-file.usecase';
import FileHttpMapper from '../mappers/file-http.mapper';

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('files')
export default class FilesController {
  constructor(
    private readonly uploadFile: UploadFileUseCase,
    private readonly getDownloadUrl: GetFileDownloadUrlUseCase,
  ) {}

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'JPEG, PNG, WebP, GIF, or PDF (max 10 MB)',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload a file to private storage and return a short-lived URL',
  })
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({ fileType: ALLOWED_MIME_TYPES }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const data = await this.uploadFile.execute(
      new UploadFileCommand(
        file.buffer,
        file.originalname,
        file.mimetype,
        file.size,
      ),
    );
    return ApiResponse.of(FileHttpMapper.toUploadResponse(data));
  }

  @Get('download')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'key',
    required: true,
    description: 'Storage object key, e.g. uploads/1739-uuid.jpg',
  })
  @ApiOperation({
    summary: 'Get a short-lived presigned URL for a stored object key',
  })
  async download(@Query('key') key: string) {
    const data = await this.getDownloadUrl.execute(
      new GetFileDownloadUrlQuery(key ?? ''),
    );
    return ApiResponse.of(
      FileHttpMapper.toDownloadResponse(data.url, data.key),
    );
  }
}

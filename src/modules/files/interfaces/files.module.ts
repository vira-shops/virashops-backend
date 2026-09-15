import { Module } from '@nestjs/common';
import CoreInfrastructureModule from '../../shared/infrastructure/infrastructure.module';
import UsersModule from '../../users/interfaces/users.module';
import GetFileDownloadUrlUseCase from '../domain/application/usecases/get-file-download-url.usecase';
import UploadFileUseCase from '../domain/application/usecases/upload-file.usecase';
import FilesController from './http/controllers/files.controller';

@Module({
  imports: [CoreInfrastructureModule, UsersModule],
  controllers: [FilesController],
  providers: [UploadFileUseCase, GetFileDownloadUrlUseCase],
  exports: [UploadFileUseCase, GetFileDownloadUrlUseCase],
})
export default class FilesModule {}

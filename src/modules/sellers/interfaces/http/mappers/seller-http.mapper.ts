import SignupSellerCommand from '../../../domain/application/commands/signup-seller.command';
import SignupSellerHttpDto from '../dto/signup-seller.http-dto';

type UploadedDocument = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

export default class SellerHttpMapper {
  static toSignupCommand(
    dto: SignupSellerHttpDto,
    file?: UploadedDocument,
  ): SignupSellerCommand {
    return new SignupSellerCommand(
      dto.kind,
      dto.fullName,
      dto.phone,
      dto.shopName,
      dto.workplacePhone ?? null,
      dto.province,
      dto.city,
      dto.postalCode ?? null,
      dto.salesType,
      dto.address,
      dto.documentType,
      file
        ? {
            buffer: file.buffer,
            mimeType: file.mimetype,
            originalName: file.originalname,
          }
        : null,
    );
  }
}

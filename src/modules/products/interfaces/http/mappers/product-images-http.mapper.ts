import SetProductImagesCommand from '../../../domain/application/commands/set-product-images.command';
import type SetProductImagesHttpDto from '../dto/set-product-images.http-dto';
import Role from '../../../../users/domain/model/enums/role.enum';

export function toSetProductImagesCommand(
  productId: number,
  actorUserId: number,
  actorRoles: Role[],
  dto: SetProductImagesHttpDto,
): SetProductImagesCommand {
  return new SetProductImagesCommand(
    productId,
    actorUserId,
    actorRoles,
    dto.images.map((image) => ({
      keyOrUrl: (image.key ?? image.url ?? '').trim(),
      altFa: image.altFa ?? null,
      altEn: image.altEn ?? null,
      isPrimary: image.isPrimary,
      sortOrder: image.sortOrder,
    })),
  );
}

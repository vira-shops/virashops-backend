import { Inject, Injectable } from '@nestjs/common';
import GetSellerByUserIdQuery from '../../../../sellers/domain/application/queries/get-seller-by-user-id.query';
import GetSellerByUserIdUseCase from '../../../../sellers/domain/application/usecases/get-seller-by-user-id.usecase';
import ForbiddenError from '../../../../users/domain/errors/forbidden.error';
import Role from '../../../../users/domain/model/enums/role.enum';
import InvalidFileError from '../../../../files/domain/errors/invalid-file.error';
import { resolveStoredFileKey } from '../../../../shared/utils/stored-file-url.util';
import InvalidProductFieldError from '../../errors/invalid-product-field.error';
import ProductNotFoundError from '../../errors/product-not-found.error';
import type { ProductImageProps } from '../../model/product.types';
import type ProductRepositoryPort from '../../ports/product.repository.port';
import { PRODUCT_REPOSITORY } from '../../../shared/tokens/port.token';
import SetProductImagesCommand from '../commands/set-product-images.command';
import ProductMediaPresenter from '../services/product-media.presenter';

export type SetProductImagesResult = {
  id: number;
  images: Array<{
    imageKey: string;
    url: string | null;
    altFa: string | null;
    altEn: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }>;
};

@Injectable()
export default class SetProductImagesUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: ProductRepositoryPort,
    private readonly getSellerByUserId: GetSellerByUserIdUseCase,
    private readonly media: ProductMediaPresenter,
  ) {}

  async execute(
    command: SetProductImagesCommand,
  ): Promise<SetProductImagesResult> {
    if (!command.images?.length) {
      throw new InvalidProductFieldError(
        'At least one product image is required',
      );
    }

    const product = await this.products.findById(command.productId);
    if (!product) {
      throw new ProductNotFoundError();
    }

    await this.assertCanEdit(command, product.getSeller().id);

    const images: ProductImageProps[] = command.images.map((image, index) => {
      const key = resolveStoredFileKey(image.keyOrUrl);
      if (!key) {
        throw new InvalidFileError(
          'Product images must be uploaded via /files/upload (key under uploads/)',
        );
      }
      return {
        imageKey: key,
        altFa: image.altFa ?? null,
        altEn: image.altEn ?? null,
        isPrimary: image.isPrimary ?? index === 0,
        sortOrder: image.sortOrder ?? index,
      };
    });

    product.replaceImages(images);
    await this.products.replaceImages(product.getId(), product.getImages());

    const stored = product.getImages();
    const withUrls = await Promise.all(
      stored.map(async (image) => ({
        imageKey: image.imageKey,
        url: await this.media.urlForKey(image.imageKey),
        altFa: image.altFa,
        altEn: image.altEn,
        isPrimary: image.isPrimary,
        sortOrder: image.sortOrder,
      })),
    );

    return { id: product.getId(), images: withUrls };
  }

  private async assertCanEdit(
    command: SetProductImagesCommand,
    productSellerId: number,
  ): Promise<void> {
    if (command.actorRoles.includes(Role.ADMIN)) {
      return;
    }

    const isSeller =
      command.actorRoles.includes(Role.RETAIL_SELLER) ||
      command.actorRoles.includes(Role.WHOLESALE_SELLER);
    if (!isSeller) {
      throw new ForbiddenError();
    }

    const seller = await this.getSellerByUserId.execute(
      new GetSellerByUserIdQuery(command.actorUserId),
    );
    if (!seller || seller.id !== productSellerId) {
      throw new ForbiddenError();
    }
  }
}

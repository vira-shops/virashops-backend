import { Inject, Injectable } from '@nestjs/common';
import type FileStorageServicePort from '../../../../shared/application/ports/s3-storage.service.port';
import { FILE_STORAGE_SERVICE } from '../../../../shared/tokens/port.tokens';
import { isStoredFileKey } from '../../../../shared/utils/stored-file-url.util';
import { DEFAULT_PRESIGN_EXPIRES_SECONDS } from '../../../../files/domain/application/services/file-upload.constants';
import type {
  ProductCardView,
  ProductDetailView,
  ProductImageView,
  ProductPageView,
} from '../../view-models/product.view-model';

@Injectable()
export default class ProductMediaPresenter {
  constructor(
    @Inject(FILE_STORAGE_SERVICE)
    private readonly storage: FileStorageServicePort,
  ) {}

  async enrichPage(page: ProductPageView): Promise<ProductPageView> {
    const items = await Promise.all(
      page.items.map((item) => this.enrichCard(item)),
    );
    return { ...page, items };
  }

  async enrichDetail(detail: ProductDetailView): Promise<ProductDetailView> {
    const keys = this.collectKeys([
      detail.imageKey,
      detail.seller.logoKey,
      ...detail.gallery.map((image) => image.imageKey),
      ...detail.related.flatMap((item) => [item.imageKey, item.seller.logoKey]),
    ]);
    const urls = await this.resolveUrls(keys);

    return {
      ...detail,
      imageUrl: this.urlFor(detail.imageKey, urls),
      seller: {
        ...detail.seller,
        logoUrl: this.urlFor(detail.seller.logoKey, urls),
      },
      gallery: detail.gallery.map((image): ProductImageView => ({
        ...image,
        url: this.urlFor(image.imageKey, urls),
      })),
      related: detail.related.map((item) => ({
        ...item,
        imageUrl: this.urlFor(item.imageKey, urls),
        seller: {
          ...item.seller,
          logoUrl: this.urlFor(item.seller.logoKey, urls),
        },
      })),
    };
  }

  async enrichCard(card: ProductCardView): Promise<ProductCardView> {
    const urls = await this.resolveUrls(
      this.collectKeys([card.imageKey, card.seller.logoKey]),
    );
    return {
      ...card,
      imageUrl: this.urlFor(card.imageKey, urls),
      seller: {
        ...card.seller,
        logoUrl: this.urlFor(card.seller.logoKey, urls),
      },
    };
  }

  async urlForKey(key: string | null | undefined): Promise<string | null> {
    if (!key || !isStoredFileKey(key)) {
      return null;
    }
    try {
      return await this.storage.getSignedUrl(
        key,
        DEFAULT_PRESIGN_EXPIRES_SECONDS,
      );
    } catch {
      return null;
    }
  }

  private collectKeys(keys: Array<string | null | undefined>): string[] {
    return [
      ...new Set(
        keys.filter(
          (key): key is string =>
            typeof key === 'string' && isStoredFileKey(key),
        ),
      ),
    ];
  }

  private async resolveUrls(keys: string[]): Promise<Map<string, string>> {
    const entries = await Promise.all(
      keys.map(async (key) => {
        const url = await this.urlForKey(key);
        return [key, url] as const;
      }),
    );
    const map = new Map<string, string>();
    for (const [key, url] of entries) {
      if (url) {
        map.set(key, url);
      }
    }
    return map;
  }

  private urlFor(
    key: string | null | undefined,
    urls: Map<string, string>,
  ): string | null {
    if (!key) {
      return null;
    }
    return urls.get(key) ?? null;
  }
}

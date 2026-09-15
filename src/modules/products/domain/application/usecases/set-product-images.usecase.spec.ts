import GetSellerByUserIdQuery from '../../../../sellers/domain/application/queries/get-seller-by-user-id.query';
import SellerStatus from '../../../../sellers/domain/model/enums/seller-status.enum';
import SellerKind from '../../../../sellers/domain/model/enums/seller-kind.enum';
import ForbiddenError from '../../../../users/domain/errors/forbidden.error';
import Role from '../../../../users/domain/model/enums/role.enum';
import InvalidFileError from '../../../../files/domain/errors/invalid-file.error';
import ProductMediaPresenter from '../services/product-media.presenter';
import SetProductImagesCommand from '../commands/set-product-images.command';
import InMemoryProductRepository from './in-memory-product.repository';
import SetProductImagesUseCase from './set-product-images.usecase';
import type FileStorageServicePort from '../../../../shared/application/ports/s3-storage.service.port';

describe('SetProductImagesUseCase', () => {
  const products = new InMemoryProductRepository();
  const getSignedUrl = jest.fn((key: string) =>
    Promise.resolve(`http://files.test/${key}`),
  );
  const storage: FileStorageServicePort = {
    upload: jest.fn(),
    delete: jest.fn(),
    getSignedUrl,
  };
  const media = new ProductMediaPresenter(storage);
  const getSellerByUserIdExecute = jest.fn();
  const getSellerByUserId = {
    execute: getSellerByUserIdExecute,
  };

  const useCase = new SetProductImagesUseCase(
    products,
    getSellerByUserId as never,
    media,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    getSignedUrl.mockImplementation((key: string) =>
      Promise.resolve(`http://files.test/${key}`),
    );
  });

  it('lets the owning seller replace images with uploaded keys', async () => {
    getSellerByUserIdExecute.mockResolvedValue({
      id: 1,
      kind: SellerKind.BOTH,
      status: SellerStatus.ACTIVE,
      shopName: 'ویراشاپس',
      profileComplete: true,
    });

    const result = await useCase.execute(
      new SetProductImagesCommand(
        1,
        10,
        [Role.RETAIL_SELLER],
        [{ keyOrUrl: 'uploads/1-uuid.jpg', isPrimary: true }],
      ),
    );

    expect(result.id).toBe(1);
    expect(result.images[0]).toEqual({
      imageKey: 'uploads/1-uuid.jpg',
      url: 'http://files.test/uploads/1-uuid.jpg',
      altFa: null,
      altEn: null,
      isPrimary: true,
      sortOrder: 0,
    });
    expect(getSellerByUserIdExecute).toHaveBeenCalledWith(
      new GetSellerByUserIdQuery(10),
    );

    const detail = await products.findById(1);
    expect(detail?.getPrimaryImageKey()).toBe('uploads/1-uuid.jpg');
  });

  it('lets admin replace images on any product', async () => {
    const result = await useCase.execute(
      new SetProductImagesCommand(
        1,
        1,
        [Role.ADMIN],
        [{ keyOrUrl: 'uploads/admin.jpg' }],
      ),
    );
    expect(result.images[0].imageKey).toBe('uploads/admin.jpg');
    expect(getSellerByUserIdExecute).not.toHaveBeenCalled();
  });

  it('forbids a non-owner seller', async () => {
    getSellerByUserIdExecute.mockResolvedValue({
      id: 999,
      kind: SellerKind.RETAIL,
      status: SellerStatus.ACTIVE,
      shopName: 'Other',
      profileComplete: true,
    });

    await expect(
      useCase.execute(
        new SetProductImagesCommand(
          1,
          20,
          [Role.RETAIL_SELLER],
          [{ keyOrUrl: 'uploads/x.jpg' }],
        ),
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('rejects non-upload keys', async () => {
    getSellerByUserIdExecute.mockResolvedValue({
      id: 1,
      kind: SellerKind.BOTH,
      status: SellerStatus.ACTIVE,
      shopName: 'ویراشاپس',
      profileComplete: true,
    });

    await expect(
      useCase.execute(
        new SetProductImagesCommand(
          1,
          10,
          [Role.RETAIL_SELLER],
          [{ keyOrUrl: 'pepsi-cola-6pk' }],
        ),
      ),
    ).rejects.toBeInstanceOf(InvalidFileError);
  });
});

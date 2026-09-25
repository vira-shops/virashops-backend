import AddFavoriteCommand from '../commands/add-favorite.command';
import Favorite from '../../model/favorite.model';
import AddFavoriteUseCase from './add-favorite.usecase';

describe('AddFavoriteUseCase', () => {
  const favorites = {
    findByUserAndProduct: jest.fn(),
    save: jest.fn((f: Favorite) =>
      Favorite.restore({ ...f.toSnapshot(), id: 7 }),
    ),
  };
  const getProductById = {
    execute: jest.fn(() => ({ getId: () => 3 })),
  };

  const useCase = new AddFavoriteUseCase(
    favorites as never,
    getProductById as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('adds a favorite when product exists', async () => {
    favorites.findByUserAndProduct.mockResolvedValue(null);
    const result = await useCase.execute(new AddFavoriteCommand(1, 3));
    expect(result.getId()).toBe(7);
    expect(favorites.save).toHaveBeenCalled();
  });

  it('returns existing favorite idempotently', async () => {
    favorites.findByUserAndProduct.mockResolvedValue(
      Favorite.restore({
        id: 2,
        userId: 1,
        productId: 3,
        createdAt: null,
      }),
    );
    const result = await useCase.execute(new AddFavoriteCommand(1, 3));
    expect(result.getId()).toBe(2);
    expect(favorites.save).not.toHaveBeenCalled();
  });
});

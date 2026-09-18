import CartItem from './cart-item.model';
import InvalidCartQuantityError from '../errors/invalid-cart-quantity.error';

const base = {
  id: 1,
  cartId: 1,
  productId: 10,
  sellerId: 2,
  sellerShopName: 'Shop',
  sellerLogoKey: null,
  productNameFa: 'گوشت',
  productNameEn: 'Meat',
  imageKey: null,
  packQty: 2,
  pieceQty: 1,
  packMultiple: 6,
  unitPrice: 1000,
  packPrice: 5000,
  commissionPercent: 5,
  prepaymentAmount: 0,
};

describe('CartItem', () => {
  it('computes goods, commission, line total and units', () => {
    const item = CartItem.create({ ...base, prepaymentAmount: 11000 });
    expect(item.totalUnits()).toBe(13);
    expect(item.goodsAmount()).toBe(11000);
    expect(item.commissionAmount()).toBe(550);
    expect(item.lineTotal()).toBe(11550);
    expect(item.deferredAmount()).toBe(550);
  });

  it('rejects prepayment above line total', () => {
    expect(() =>
      CartItem.create({ ...base, prepaymentAmount: 999999 }),
    ).toThrow(InvalidCartQuantityError);
  });

  it('rejects zero quantities', () => {
    expect(() => CartItem.create({ ...base, packQty: 0, pieceQty: 0 })).toThrow(
      InvalidCartQuantityError,
    );
  });
});

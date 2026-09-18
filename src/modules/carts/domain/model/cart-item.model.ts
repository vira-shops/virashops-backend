import InvalidCartQuantityError from '../errors/invalid-cart-quantity.error';

/**
 * Line economics:
 * - goodsAmount = packQty * packPrice + pieceQty * unitPrice
 * - commissionAmount = round(goodsAmount * commissionPercent / 100)
 * - lineTotal = goodsAmount + commissionAmount (full invoice line)
 * - prepaymentAmount = amount due now (0 ≤ prepayment ≤ lineTotal); remainder is deferred
 */
export type CartItemProps = {
  id: number | null;
  cartId: number | null;
  productId: number;
  sellerId: number;
  sellerShopName: string;
  sellerLogoKey: string | null;
  productNameFa: string;
  productNameEn: string;
  imageKey: string | null;
  packQty: number;
  pieceQty: number;
  packMultiple: number;
  unitPrice: number;
  packPrice: number;
  commissionPercent: number;
  prepaymentAmount: number;
};

export default class CartItem {
  private constructor(private props: CartItemProps) {}

  static create(input: CartItemProps): CartItem {
    return new CartItem(CartItem.validated(input));
  }

  static restore(props: CartItemProps): CartItem {
    return new CartItem(CartItem.validated(props));
  }

  getId(): number {
    if (this.props.id === null) {
      throw new Error('Cart item has not been persisted');
    }
    return this.props.id;
  }

  hasId(): boolean {
    return this.props.id !== null;
  }

  getCartId(): number | null {
    return this.props.cartId;
  }

  getProductId(): number {
    return this.props.productId;
  }

  getSellerId(): number {
    return this.props.sellerId;
  }

  getSellerShopName(): string {
    return this.props.sellerShopName;
  }

  getSellerLogoKey(): string | null {
    return this.props.sellerLogoKey;
  }

  getProductNameFa(): string {
    return this.props.productNameFa;
  }

  getProductNameEn(): string {
    return this.props.productNameEn;
  }

  getImageKey(): string | null {
    return this.props.imageKey;
  }

  getPackQty(): number {
    return this.props.packQty;
  }

  getPieceQty(): number {
    return this.props.pieceQty;
  }

  getPackMultiple(): number {
    return this.props.packMultiple;
  }

  getUnitPrice(): number {
    return this.props.unitPrice;
  }

  getPackPrice(): number {
    return this.props.packPrice;
  }

  getCommissionPercent(): number {
    return this.props.commissionPercent;
  }

  getPrepaymentAmount(): number {
    return this.props.prepaymentAmount;
  }

  totalUnits(): number {
    return this.props.packQty * this.props.packMultiple + this.props.pieceQty;
  }

  goodsAmount(): number {
    return (
      this.props.packQty * this.props.packPrice +
      this.props.pieceQty * this.props.unitPrice
    );
  }

  commissionAmount(): number {
    return Math.round(
      (this.goodsAmount() * this.props.commissionPercent) / 100,
    );
  }

  lineTotal(): number {
    return this.goodsAmount() + this.commissionAmount();
  }

  /** Amount due now; remainder of lineTotal is deferred. */
  amountDueNow(): number {
    return this.props.prepaymentAmount;
  }

  deferredAmount(): number {
    return this.lineTotal() - this.props.prepaymentAmount;
  }

  updateQuantities(packQty: number, pieceQty: number): void {
    this.props = CartItem.validated({
      ...this.props,
      packQty,
      pieceQty,
      prepaymentAmount: Math.min(
        this.props.prepaymentAmount,
        this.computeLineTotal(packQty, pieceQty),
      ),
    });
  }

  updatePrepayment(prepaymentAmount: number): void {
    this.props = CartItem.validated({
      ...this.props,
      prepaymentAmount,
    });
  }

  refreshPricing(input: {
    unitPrice: number;
    packPrice: number;
    packMultiple: number;
    commissionPercent: number;
    productNameFa: string;
    productNameEn: string;
    imageKey: string | null;
    sellerShopName: string;
    sellerLogoKey: string | null;
  }): void {
    this.props = CartItem.validated({
      ...this.props,
      ...input,
      prepaymentAmount: Math.min(
        this.props.prepaymentAmount,
        this.computeLineTotal(this.props.packQty, this.props.pieceQty, input),
      ),
    });
  }

  mergeQuantities(packQty: number, pieceQty: number): void {
    this.updateQuantities(
      this.props.packQty + packQty,
      this.props.pieceQty + pieceQty,
    );
  }

  toSnapshot(): CartItemProps {
    return { ...this.props };
  }

  private computeLineTotal(
    packQty: number,
    pieceQty: number,
    pricing?: {
      unitPrice: number;
      packPrice: number;
      commissionPercent: number;
    },
  ): number {
    const unitPrice = pricing?.unitPrice ?? this.props.unitPrice;
    const packPrice = pricing?.packPrice ?? this.props.packPrice;
    const commissionPercent =
      pricing?.commissionPercent ?? this.props.commissionPercent;
    const goods = packQty * packPrice + pieceQty * unitPrice;
    return goods + Math.round((goods * commissionPercent) / 100);
  }

  private static validated(props: CartItemProps): CartItemProps {
    if (!Number.isInteger(props.packQty) || props.packQty < 0) {
      throw new InvalidCartQuantityError(
        'Pack quantity must be a non-negative integer',
      );
    }
    if (!Number.isInteger(props.pieceQty) || props.pieceQty < 0) {
      throw new InvalidCartQuantityError(
        'Piece quantity must be a non-negative integer',
      );
    }
    if (props.packQty === 0 && props.pieceQty === 0) {
      throw new InvalidCartQuantityError(
        'At least one pack or piece is required',
      );
    }
    if (!Number.isInteger(props.packMultiple) || props.packMultiple < 1) {
      throw new InvalidCartQuantityError(
        'Pack multiple must be a positive integer',
      );
    }
    if (!Number.isInteger(props.unitPrice) || props.unitPrice < 0) {
      throw new InvalidCartQuantityError('Unit price is invalid');
    }
    if (!Number.isInteger(props.packPrice) || props.packPrice < 0) {
      throw new InvalidCartQuantityError('Pack price is invalid');
    }
    if (
      !Number.isFinite(props.commissionPercent) ||
      props.commissionPercent < 0 ||
      props.commissionPercent > 100
    ) {
      throw new InvalidCartQuantityError('Commission percent is invalid');
    }
    const goods =
      props.packQty * props.packPrice + props.pieceQty * props.unitPrice;
    const commission = Math.round((goods * props.commissionPercent) / 100);
    const lineTotal = goods + commission;
    if (
      !Number.isInteger(props.prepaymentAmount) ||
      props.prepaymentAmount < 0 ||
      props.prepaymentAmount > lineTotal
    ) {
      throw new InvalidCartQuantityError(
        'Prepayment must be between 0 and line total',
      );
    }
    return { ...props };
  }
}

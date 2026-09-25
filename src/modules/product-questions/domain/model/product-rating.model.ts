export default class ProductRating {
  private constructor(
    private readonly props: {
      id: number | null;
      userId: number;
      productId: number;
      rating: number;
      createdAt: Date | null;
    },
  ) {}

  static create(
    userId: number,
    productId: number,
    rating: number,
  ): ProductRating {
    return new ProductRating({
      id: null,
      userId,
      productId,
      rating,
      createdAt: null,
    });
  }

  static restore(props: {
    id: number | null;
    userId: number;
    productId: number;
    rating: number;
    createdAt: Date | null;
  }): ProductRating {
    return new ProductRating({ ...props });
  }

  getId(): number {
    if (this.props.id === null) {
      throw new Error('Product rating has not been persisted');
    }
    return this.props.id;
  }

  getUserId(): number {
    return this.props.userId;
  }

  getProductId(): number {
    return this.props.productId;
  }

  getRating(): number {
    return this.props.rating;
  }

  getCreatedAt(): Date | null {
    return this.props.createdAt;
  }

  toSnapshot() {
    return { ...this.props };
  }
}

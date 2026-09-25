export type FavoriteProps = {
  id: number | null;
  userId: number;
  productId: number;
  createdAt: Date | null;
};

export default class Favorite {
  private constructor(private props: FavoriteProps) {}

  static create(userId: number, productId: number): Favorite {
    return new Favorite({
      id: null,
      userId,
      productId,
      createdAt: null,
    });
  }

  static restore(props: FavoriteProps): Favorite {
    return new Favorite(props);
  }

  getId(): number {
    if (this.props.id === null) {
      throw new Error('Favorite has not been persisted');
    }
    return this.props.id;
  }

  getUserId(): number {
    return this.props.userId;
  }

  getProductId(): number {
    return this.props.productId;
  }

  getCreatedAt(): Date | null {
    return this.props.createdAt;
  }

  toSnapshot(): FavoriteProps {
    return { ...this.props };
  }
}

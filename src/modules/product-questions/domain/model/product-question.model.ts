export type ProductAnswerProps = {
  id: number | null;
  questionId: number;
  authorUserId: number;
  body: string;
  createdAt: Date | null;
};

export type ProductQuestionProps = {
  id: number | null;
  userId: number;
  productId: number;
  body: string;
  createdAt: Date | null;
  answers: ProductAnswerProps[];
};

export default class ProductQuestion {
  private constructor(private props: ProductQuestionProps) {}

  static create(
    userId: number,
    productId: number,
    body: string,
  ): ProductQuestion {
    const trimmed = body.trim();
    if (!trimmed) {
      throw new Error('Question body is required');
    }
    return new ProductQuestion({
      id: null,
      userId,
      productId,
      body: trimmed,
      createdAt: null,
      answers: [],
    });
  }

  static restore(props: ProductQuestionProps): ProductQuestion {
    return new ProductQuestion({
      ...props,
      answers: props.answers.map((answer) => ({ ...answer })),
    });
  }

  getId(): number {
    if (this.props.id === null) {
      throw new Error('Product question has not been persisted');
    }
    return this.props.id;
  }

  hasId(): boolean {
    return this.props.id !== null;
  }

  getUserId(): number {
    return this.props.userId;
  }

  getProductId(): number {
    return this.props.productId;
  }

  getBody(): string {
    return this.props.body;
  }

  getCreatedAt(): Date | null {
    return this.props.createdAt;
  }

  getAnswers(): ProductAnswerProps[] {
    return this.props.answers.map((answer) => ({ ...answer }));
  }

  toSnapshot(): ProductQuestionProps {
    return {
      ...this.props,
      answers: this.getAnswers(),
    };
  }
}

import ProductQuestionKind from './enums/product-question-kind.enum';
import ProductQuestionStatus from './enums/product-question-status.enum';

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
  kind: ProductQuestionKind;
  status: ProductQuestionStatus;
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
    kind: ProductQuestionKind = ProductQuestionKind.QUESTION,
  ): ProductQuestion {
    const trimmed = body.trim();
    if (!trimmed) {
      throw new Error('Question body is required');
    }
    return new ProductQuestion({
      id: null,
      userId,
      productId,
      kind,
      status: ProductQuestionStatus.NOT_CONFIRMED,
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

  getKind(): ProductQuestionKind {
    return this.props.kind;
  }

  getStatus(): ProductQuestionStatus {
    return this.props.status;
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

  confirm(): void {
    this.props.status = ProductQuestionStatus.CONFIRMED;
  }

  toSnapshot(): ProductQuestionProps {
    return {
      ...this.props,
      answers: this.getAnswers(),
    };
  }
}

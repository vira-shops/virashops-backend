import AnswerProductQuestionCommand from '../commands/answer-product-question.command';
import ProductQuestionKind from '../../model/enums/product-question-kind.enum';
import ProductQuestionStatus from '../../model/enums/product-question-status.enum';
import ProductQuestion from '../../model/product-question.model';
import AnswerProductQuestionUseCase from './answer-product-question.usecase';
import ForbiddenError from '../../../../users/domain/errors/forbidden.error';
import Role from '../../../../users/domain/model/enums/role.enum';

describe('AnswerProductQuestionUseCase', () => {
  const questions = {
    findById: jest.fn(),
    saveAnswer: jest.fn(
      (a: { body: string; questionId: number; authorUserId: number }) => ({
        id: 3,
        questionId: a.questionId,
        authorUserId: a.authorUserId,
        body: a.body,
        createdAt: new Date('2024-01-01'),
      }),
    ),
  };
  const getProductById = {
    execute: jest.fn(() => ({
      getSeller: () => ({ id: 10 }),
    })),
  };
  const getSellerByUserId = {
    execute: jest.fn(() => ({ id: 10 })),
  };

  const useCase = new AnswerProductQuestionUseCase(
    questions as never,
    getProductById as never,
    getSellerByUserId as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('allows the product owner seller to answer', async () => {
    questions.findById.mockResolvedValue(
      ProductQuestion.restore({
        id: 1,
        userId: 5,
        productId: 20,
        kind: ProductQuestionKind.QUESTION,
        status: ProductQuestionStatus.NOT_CONFIRMED,
        body: 'Where is it produced?',
        createdAt: new Date(),
        answers: [],
      }),
    );

    const result = await useCase.execute(
      new AnswerProductQuestionCommand(
        1,
        99,
        [Role.WHOLESALE_SELLER],
        'Mashhad',
      ),
    );

    expect(result.body).toBe('Mashhad');
    expect(result.questionId).toBe(1);
    expect(questions.saveAnswer).toHaveBeenCalled();
  });

  it('forbids answering another seller product question', async () => {
    questions.findById.mockResolvedValue(
      ProductQuestion.restore({
        id: 1,
        userId: 5,
        productId: 20,
        kind: ProductQuestionKind.QUESTION,
        status: ProductQuestionStatus.NOT_CONFIRMED,
        body: 'Where?',
        createdAt: new Date(),
        answers: [],
      }),
    );
    getSellerByUserId.execute.mockResolvedValue({ id: 999 });

    await expect(
      useCase.execute(
        new AnswerProductQuestionCommand(1, 99, [Role.WHOLESALE_SELLER], 'No'),
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

import AskProductQuestionCommand from '../commands/ask-product-question.command';
import ProductQuestion from '../../model/product-question.model';
import AskProductQuestionUseCase from './ask-product-question.usecase';

describe('AskProductQuestionUseCase', () => {
  const questions = {
    save: jest.fn((q: ProductQuestion) =>
      ProductQuestion.restore({ ...q.toSnapshot(), id: 9 }),
    ),
  };
  const getProductById = {
    execute: jest.fn(() => ({ getId: () => 4 })),
  };
  const useCase = new AskProductQuestionUseCase(
    questions as never,
    getProductById as never,
  );

  it('asks a question for a visible product', async () => {
    const result = await useCase.execute(
      new AskProductQuestionCommand(1, 4, 'Where is it produced?'),
    );
    expect(result.getId()).toBe(9);
    expect(result.getBody()).toBe('Where is it produced?');
  });
});

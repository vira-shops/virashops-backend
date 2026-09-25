export default class AnswerProductQuestionCommand {
  constructor(
    readonly questionId: number,
    readonly actorUserId: number,
    readonly actorRoles: string[],
    readonly body: string,
  ) {}
}

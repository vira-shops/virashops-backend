export default class ConfirmProductQuestionCommand {
  constructor(
    readonly questionId: number,
    readonly actorUserId: number,
    readonly actorRoles: string[],
  ) {}
}

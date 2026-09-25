export default class ListNotificationsQuery {
  constructor(
    readonly userId: number,
    readonly page = 1,
    readonly limit = 20,
  ) {}
}

export default class SearchCategoriesQuery {
  constructor(
    readonly query: string,
    readonly lang: string,
    readonly limit: number = 10,
  ) {}
}

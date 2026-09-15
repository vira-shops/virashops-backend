export default class GetFileDownloadUrlQuery {
  constructor(
    public readonly key: string,
    public readonly expiresInSeconds = 300,
  ) {}
}

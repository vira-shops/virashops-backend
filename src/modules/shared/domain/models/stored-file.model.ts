export default class StoredFile {
  constructor(
    public readonly key: string,
    public readonly url: string,
    public readonly bucket?: string,
    public readonly presignedUrl?: string,
  ) {}
}

export default class UploadFileCommand {
  constructor(
    public readonly buffer: Buffer,
    public readonly originalName: string,
    public readonly mimeType: string,
    public readonly size: number,
    public readonly folder = 'uploads',
  ) {}
}

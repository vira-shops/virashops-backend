export type SetProductImageInput = {
  keyOrUrl: string;
  altFa?: string | null;
  altEn?: string | null;
  isPrimary?: boolean;
  sortOrder?: number;
};

export default class SetProductImagesCommand {
  constructor(
    public readonly productId: number,
    public readonly actorUserId: number,
    public readonly actorRoles: string[],
    public readonly images: SetProductImageInput[],
  ) {}
}

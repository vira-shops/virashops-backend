import InvalidCategoryFieldError from '../errors/invalid-category-field.error';
import CategoryStatus from './enums/category-status.enum';

export const CATEGORY_MAX_DEPTH = 3;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type CategoryProps = {
  id: number | null;
  parentId: number | null;
  slug: string;
  nameFa: string;
  nameEn: string;
  status: CategoryStatus;
  sortOrder: number;
  iconKey: string | null;
  imageKey: string | null;
  depth: number;
};

export default class Category {
  private constructor(private props: CategoryProps) {}

  static create(
    input: Omit<CategoryProps, 'id' | 'status'> & { status?: CategoryStatus },
  ): Category {
    return new Category(
      Category.validated({
        ...input,
        id: null,
        status: input.status ?? CategoryStatus.ACTIVE,
      }),
    );
  }

  static restore(props: CategoryProps): Category {
    return new Category(Category.validated(props));
  }

  getId(): number {
    if (this.props.id === null) {
      throw new Error('Category has not been persisted');
    }
    return this.props.id;
  }

  hasId(): boolean {
    return this.props.id !== null;
  }

  getParentId(): number | null {
    return this.props.parentId;
  }

  getSlug(): string {
    return this.props.slug;
  }

  getNameFa(): string {
    return this.props.nameFa;
  }

  getNameEn(): string {
    return this.props.nameEn;
  }

  getName(lang: string): string {
    return lang.toLowerCase().startsWith('fa')
      ? this.props.nameFa
      : this.props.nameEn;
  }

  getPathLabel(lang: string): string {
    return this.getName(lang);
  }

  getStatus(): CategoryStatus {
    return this.props.status;
  }

  getSortOrder(): number {
    return this.props.sortOrder;
  }

  getIconKey(): string | null {
    return this.props.iconKey;
  }

  getImageKey(): string | null {
    return this.props.imageKey;
  }

  getDepth(): number {
    return this.props.depth;
  }

  isRoot(): boolean {
    return this.props.parentId === null && this.props.depth === 1;
  }

  isLeaf(): boolean {
    return this.props.depth === CATEGORY_MAX_DEPTH;
  }

  isActive(): boolean {
    return this.props.status === CategoryStatus.ACTIVE;
  }

  canHaveChildren(): boolean {
    return this.props.depth < CATEGORY_MAX_DEPTH;
  }

  private static validated(props: CategoryProps): CategoryProps {
    const slug = props.slug.trim().toLowerCase();
    const nameFa = props.nameFa.trim();
    const nameEn = props.nameEn.trim();
    const iconKey = props.iconKey?.trim() || null;
    const imageKey = props.imageKey?.trim() || null;

    if (!SLUG_PATTERN.test(slug)) {
      throw new InvalidCategoryFieldError('Slug must be URL-safe kebab-case');
    }
    if (!nameFa || !nameEn) {
      throw new InvalidCategoryFieldError('Category names are required');
    }
    if (props.depth < 1 || props.depth > CATEGORY_MAX_DEPTH) {
      throw new InvalidCategoryFieldError(
        `Category depth must be between 1 and ${CATEGORY_MAX_DEPTH}`,
      );
    }
    if (props.depth === 1 && props.parentId !== null) {
      throw new InvalidCategoryFieldError(
        'Root categories cannot have a parent',
      );
    }
    if (props.depth > 1 && props.parentId === null) {
      throw new InvalidCategoryFieldError(
        'Child categories must have a parent',
      );
    }
    if (props.sortOrder < 0) {
      throw new InvalidCategoryFieldError('Sort order cannot be negative');
    }

    return {
      ...props,
      slug,
      nameFa,
      nameEn,
      iconKey,
      imageKey,
    };
  }
}

import Category from '../../model/category.model';
import CategoryStatus from '../../model/enums/category-status.enum';
import CategoryRepositoryPort from '../../ports/category.repository.port';

export function seedCategories(): Category[] {
  const restore = (
    id: number,
    parentId: number | null,
    slug: string,
    nameFa: string,
    nameEn: string,
    depth: number,
    sortOrder: number,
    iconKey: string | null = null,
  ) =>
    Category.restore({
      id,
      parentId,
      slug,
      nameFa,
      nameEn,
      status: CategoryStatus.ACTIVE,
      sortOrder,
      iconKey,
      imageKey: iconKey,
      depth,
    });

  return [
    restore(1, null, 'food', 'مواد غذایی', 'Food', 1, 1, 'food'),
    restore(2, 1, 'staples', 'کالای اساسی', 'Staples', 2, 1, 'staples'),
    restore(3, 1, 'protein', 'پروتئین', 'Protein', 2, 2, 'protein'),
    restore(10, 2, 'bread', 'نان', 'Bread', 3, 1),
    restore(15, 3, 'chicken', 'مرغ', 'Chicken', 3, 1),
  ];
}

export default class InMemoryCategoryRepository implements CategoryRepositoryPort {
  constructor(private readonly items: Category[] = seedCategories()) {}

  findActiveTree(): Promise<Category[]> {
    return Promise.resolve(
      this.items.filter((category) => category.isActive()),
    );
  }

  findById(id: number): Promise<Category | null> {
    return Promise.resolve(
      this.items.find((category) => category.getId() === id) ?? null,
    );
  }

  findBySlug(slug: string): Promise<Category | null> {
    return Promise.resolve(
      this.items.find((category) => category.getSlug() === slug) ?? null,
    );
  }

  searchByName(query: string, limit: number): Promise<Category[]> {
    const needle = query.toLowerCase();
    return Promise.resolve(
      this.items
        .filter((category) => category.isActive())
        .filter(
          (category) =>
            category.getNameFa().includes(query) ||
            category.getNameEn().toLowerCase().includes(needle) ||
            category.getSlug().includes(needle),
        )
        .slice(0, limit),
    );
  }
}

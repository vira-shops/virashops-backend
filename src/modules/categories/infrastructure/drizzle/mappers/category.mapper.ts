import Category from '../../../domain/model/category.model';
import CategoryStatus from '../../../domain/model/enums/category-status.enum';
import type { CategoryRow } from '../schema/categories';

export default class CategoryMapper {
  static toDomain(row: CategoryRow): Category {
    return Category.restore({
      id: row.id,
      parentId: row.parentId,
      slug: row.slug,
      nameFa: row.nameFa,
      nameEn: row.nameEn,
      status: row.status as CategoryStatus,
      sortOrder: row.sortOrder,
      iconKey: row.iconKey,
      imageKey: row.imageKey,
      depth: row.depth,
    });
  }
}

import InvalidCategoryFieldError from '../errors/invalid-category-field.error';
import Category, { CATEGORY_MAX_DEPTH } from './category.model';
import CategoryStatus from './enums/category-status.enum';

describe('Category', () => {
  const root = {
    parentId: null as number | null,
    slug: 'food',
    nameFa: 'مواد غذایی',
    nameEn: 'Food',
    sortOrder: 1,
    iconKey: 'food',
    imageKey: 'food',
    depth: 1,
  };

  it('creates an active root', () => {
    const category = Category.create(root);
    expect(category.isRoot()).toBe(true);
    expect(category.isActive()).toBe(true);
    expect(category.getDepth()).toBe(1);
    expect(category.getName('fa')).toBe('مواد غذایی');
    expect(category.getName('en')).toBe('Food');
  });

  it('rejects depth above the mega-menu limit', () => {
    expect(() =>
      Category.create({
        ...root,
        parentId: 1,
        slug: 'too-deep',
        depth: CATEGORY_MAX_DEPTH + 1,
      }),
    ).toThrow(InvalidCategoryFieldError);
  });

  it('rejects a child without a parent', () => {
    expect(() =>
      Category.create({ ...root, slug: 'staples', depth: 2, parentId: null }),
    ).toThrow(InvalidCategoryFieldError);
  });

  it('rejects an invalid slug', () => {
    expect(() => Category.create({ ...root, slug: 'Food Category' })).toThrow(
      InvalidCategoryFieldError,
    );
  });

  it('treats max-depth nodes as leaves', () => {
    const leaf = Category.restore({
      id: 9,
      parentId: 2,
      slug: 'bread',
      nameFa: 'نان',
      nameEn: 'Bread',
      status: CategoryStatus.ACTIVE,
      sortOrder: 1,
      iconKey: null,
      imageKey: null,
      depth: 3,
    });
    expect(leaf.isLeaf()).toBe(true);
    expect(leaf.canHaveChildren()).toBe(false);
  });
});

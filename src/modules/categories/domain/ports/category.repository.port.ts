import Category from '../model/category.model';

export default interface CategoryRepositoryPort {
  findActiveTree(): Promise<Category[]>;
  findById(id: number): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  searchByName(query: string, limit: number): Promise<Category[]>;
}

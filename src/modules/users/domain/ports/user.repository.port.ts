import User from '../model/user.model';

export default interface UserRepositoryPort {
  findById(id: number): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import User from '../../../domain/model/user.model';
import UserRepositoryPort from '../../../domain/ports/user.repository.port';
import UserEntity from '../entities/user.entity';
import UserRoleEntity from '../entities/user-role.entity';
import UserMapper from '../mappers/user.mapper';

@Injectable()
export default class TypeOrmUserRepositoryAdapter implements UserRepositoryPort {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async findById(id: number): Promise<User | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const entity = await this.repo.findOne({ where: { phone } });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async save(user: User): Promise<User> {
    if (user.hasId()) {
      const existing = await this.repo.findOne({ where: { id: user.getId() } });
      if (existing) {
        existing.phone = user.getPhone();
        existing.full_name = user.getFullName();
        existing.status = user.getStatus();
        existing.phone_verified_at = user.getPhoneVerifiedAt();
        existing.roles = user.getRoles().map((role) => {
          const current = existing.roles?.find((row) => row.role === role);
          if (current) {
            return current;
          }
          const row = new UserRoleEntity();
          row.role = role;
          row.user_id = existing.id;
          return row;
        });
        const saved = await this.repo.save(existing);
        return UserMapper.toDomain(saved);
      }
    }

    const saved = await this.repo.save(UserMapper.toEntity(user));
    return UserMapper.toDomain(saved);
  }
}

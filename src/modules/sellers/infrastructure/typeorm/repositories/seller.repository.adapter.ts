import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Seller from '../../../domain/model/seller.model';
import SellerRepositoryPort from '../../../domain/ports/seller.repository.port';
import SellerEntity from '../entities/seller.entity';
import SellerMapper from '../mappers/seller.mapper';

@Injectable()
export default class TypeOrmSellerRepositoryAdapter implements SellerRepositoryPort {
  constructor(
    @InjectRepository(SellerEntity)
    private readonly repo: Repository<SellerEntity>,
  ) {}

  async findById(id: number): Promise<Seller | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? SellerMapper.toDomain(entity) : null;
  }

  async findByUserId(userId: number): Promise<Seller | null> {
    const entity = await this.repo.findOne({ where: { user_id: userId } });
    return entity ? SellerMapper.toDomain(entity) : null;
  }

  async save(seller: Seller): Promise<Seller> {
    const saved = await this.repo.save(SellerMapper.toEntity(seller));
    return SellerMapper.toDomain(saved);
  }
}

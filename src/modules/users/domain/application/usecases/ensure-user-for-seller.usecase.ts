import { Inject, Injectable } from '@nestjs/common';
import EnsureUserForSellerCommand from '../commands/ensure-user-for-seller.command';
import Phone from '../../model/phone';
import User from '../../model/user.model';
import type UserRepositoryPort from '../../ports/user.repository.port';
import { USER_REPOSITORY } from '../../../shared/tokens/port.token';

@Injectable()
export default class EnsureUserForSellerUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
  ) {}

  async execute(command: EnsureUserForSellerCommand): Promise<User> {
    const phone = Phone.parse(command.phone).toString();
    const existing = await this.users.findByPhone(phone);

    if (!existing) {
      return this.users.save(
        User.createForSeller(phone, command.fullName, command.sellerRole),
      );
    }

    existing.rename(command.fullName);
    existing.addSellerRole(command.sellerRole);
    return this.users.save(existing);
  }
}

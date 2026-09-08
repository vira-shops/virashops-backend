import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Phone from '../domain/model/phone';
import User from '../domain/model/user.model';
import type UserRepositoryPort from '../domain/ports/user.repository.port';
import { USER_REPOSITORY } from '../shared/tokens/port.token';

@Injectable()
export default class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
  ) {}

  async onModuleInit(): Promise<void> {
    const rawPhone = this.config.get<string>('ADMIN_PHONE');
    if (!rawPhone) {
      return;
    }

    try {
      const phone = Phone.parse(rawPhone).toString();
      const existing = await this.users.findByPhone(phone);
      if (existing) {
        return;
      }

      const name = this.config.get<string>('ADMIN_NAME') ?? 'Admin';
      await this.users.save(User.createAdmin(phone, name));
      this.logger.log(`Seeded admin account for ${phone}`);
    } catch (error) {
      this.logger.error('Failed to seed admin account', error);
    }
  }
}

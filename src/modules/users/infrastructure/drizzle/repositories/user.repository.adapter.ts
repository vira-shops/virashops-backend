import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../../../../database/drizzle.token';
import User from '../../../domain/model/user.model';
import UserRepositoryPort from '../../../domain/ports/user.repository.port';
import UserMapper from '../mappers/user.mapper';
import { users, userRoles } from '../schema/users';

@Injectable()
export default class DrizzleUserRepositoryAdapter implements UserRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findById(id: number): Promise<User | null> {
    const row = await this.db.query.users.findFirst({
      where: and(eq(users.id, id), isNull(users.deletedAt)),
      with: { roles: true },
    });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const row = await this.db.query.users.findFirst({
      where: and(eq(users.phone, phone), isNull(users.deletedAt)),
      with: { roles: true },
    });
    return row ? UserMapper.toDomain(row) : null;
  }

  async save(user: User): Promise<User> {
    return this.db.transaction(async (tx) => {
      if (user.hasId()) {
        const userId = user.getId();
        await tx
          .update(users)
          .set({
            phone: user.getPhone(),
            firstName: user.getFirstName(),
            lastName: user.getLastName(),
            status: user.getStatus(),
            phoneVerifiedAt: user.getPhoneVerifiedAt(),
            activityType: user.getActivityType(),
            guildType: user.getGuildType(),
          })
          .where(eq(users.id, userId));

        await tx.delete(userRoles).where(eq(userRoles.userId, userId));
        await this.insertRoles(tx, userId, user.getRoles());

        const saved = await tx.query.users.findFirst({
          where: eq(users.id, userId),
          with: { roles: true },
        });
        if (!saved) {
          throw new Error(`User ${userId} was not found after save`);
        }
        return UserMapper.toDomain(saved);
      }

      const [inserted] = await tx
        .insert(users)
        .values({
          phone: user.getPhone(),
          firstName: user.getFirstName(),
          lastName: user.getLastName(),
          status: user.getStatus(),
          phoneVerifiedAt: user.getPhoneVerifiedAt(),
          activityType: user.getActivityType(),
          guildType: user.getGuildType(),
        })
        .returning();

      if (!inserted) {
        throw new Error('User insert did not return a row');
      }

      await this.insertRoles(tx, inserted.id, user.getRoles());

      const saved = await tx.query.users.findFirst({
        where: eq(users.id, inserted.id),
        with: { roles: true },
      });
      if (!saved) {
        throw new Error(`User ${inserted.id} was not found after insert`);
      }
      return UserMapper.toDomain(saved);
    });
  }

  private async insertRoles(
    tx: Parameters<Parameters<DrizzleDB['transaction']>[0]>[0],
    userId: number,
    roles: string[],
  ): Promise<void> {
    if (roles.length === 0) {
      return;
    }
    await tx.insert(userRoles).values(
      roles.map((role) => ({
        userId,
        role,
      })),
    );
  }
}

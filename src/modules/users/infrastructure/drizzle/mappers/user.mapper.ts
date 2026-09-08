import AccountStatus from '../../../domain/model/enums/account-status.enum';
import Role from '../../../domain/model/enums/role.enum';
import User from '../../../domain/model/user.model';
import type { UserWithRoles } from '../schema/users';

export default class UserMapper {
  static toDomain(row: UserWithRoles): User {
    return User.restore({
      id: row.id,
      phone: row.phone,
      firstName: row.firstName,
      lastName: row.lastName,
      status: row.status as AccountStatus,
      phoneVerifiedAt: row.phoneVerifiedAt,
      roles: (row.roles ?? []).map((item) => item.role as Role),
      activityType: row.activityType,
      guildType: row.guildType,
    });
  }
}

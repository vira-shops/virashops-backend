import AccountStatus from '../../../domain/model/enums/account-status.enum';
import Role from '../../../domain/model/enums/role.enum';
import User from '../../../domain/model/user.model';
import UserEntity from '../entities/user.entity';
import UserRoleEntity from '../entities/user-role.entity';

export default class UserMapper {
  static toDomain(entity: UserEntity): User {
    return User.restore({
      id: entity.id,
      phone: entity.phone,
      fullName: entity.full_name,
      status: entity.status,
      phoneVerifiedAt: entity.phone_verified_at,
      roles: (entity.roles ?? []).map((item) => item.role as Role),
    });
  }

  static toEntity(model: User): UserEntity {
    const entity = new UserEntity();
    if (model.hasId()) {
      entity.id = model.getId();
    }
    entity.phone = model.getPhone();
    entity.full_name = model.getFullName();
    entity.status = model.getStatus() as AccountStatus;
    entity.phone_verified_at = model.getPhoneVerifiedAt();
    entity.roles = model.getRoles().map((role) => {
      const row = new UserRoleEntity();
      if (model.hasId()) {
        row.user_id = model.getId();
      }
      row.role = role;
      return row;
    });
    return entity;
  }
}

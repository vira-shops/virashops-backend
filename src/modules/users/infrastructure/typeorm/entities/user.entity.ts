import { Column, Entity, OneToMany } from 'typeorm';
import CoreEntity from '../../../../../common/database/core.entity';
import AccountStatus from '../../../domain/model/enums/account-status.enum';
import UserRoleEntity from './user-role.entity';

@Entity('users')
export default class UserEntity extends CoreEntity {
  @Column({ type: 'varchar', length: 11, unique: true })
  phone: string;

  @Column({ name: 'full_name', type: 'varchar', length: 120 })
  full_name: string;

  @Column({ type: 'varchar', length: 20, default: AccountStatus.ACTIVE })
  status: AccountStatus;

  @Column({ name: 'phone_verified_at', type: 'timestamptz', nullable: true })
  phone_verified_at: Date | null;

  @OneToMany(() => UserRoleEntity, (role) => role.user, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
  })
  roles: UserRoleEntity[];
}

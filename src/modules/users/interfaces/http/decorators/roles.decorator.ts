import { SetMetadata } from '@nestjs/common';
import Role from '../../../domain/model/enums/role.enum';

export const ROLES_KEY = 'roles';

const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export default Roles;

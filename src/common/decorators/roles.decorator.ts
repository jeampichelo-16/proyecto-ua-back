// src/common/decorators/only-roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Role } from '../enum/role.enum';

export const ONLY_ROLES_KEY = 'only_roles';
export const OnlyRoles = (...roles: Role[]) => SetMetadata(ONLY_ROLES_KEY, roles);
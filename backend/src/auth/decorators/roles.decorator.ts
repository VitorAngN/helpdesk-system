import { SetMetadata } from '@nestjs/common';
import { NivelAcesso } from '../../../generated/prisma';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: NivelAcesso[]) => SetMetadata(ROLES_KEY, roles);

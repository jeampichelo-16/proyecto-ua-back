// src/common/types/authenticated-user.ts
import { Role } from "src/common/enum/role.enum";

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}


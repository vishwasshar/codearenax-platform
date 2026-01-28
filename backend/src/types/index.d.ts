import { Types } from 'mongoose';
import { UserRoles } from 'src/common/enums';
import { AccessRole } from 'src/common/enums/access-role.enum';
import { User } from 'src/schemas/user.schema';

export {};

declare global {
  namespace Express {
    interface Request {
      roomRole?: AwccessRole;
    }
    interface User {
      _id?: string;
      name?: string;
      email?: string;
      role?: UserRoles;
    }
  }
}

import { AccessRole } from 'src/common/enums/access-role.enum';
import { User } from 'src/schemas/user.schema';

declare global {
  namespace Express {
    interface Request {
      roomRole?: AccessRole;
      user?: User;
    }
  }
}

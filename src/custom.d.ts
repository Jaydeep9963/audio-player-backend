import { IUserDoc } from './modules/admin/admin.interfaces';

declare module 'express-serve-static-core' {
  export interface Request {
    user: IUserDoc;
  }
}

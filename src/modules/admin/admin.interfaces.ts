import mongoose from 'mongoose';

export interface IUser {
  id: mongoose.Types.ObjectId;
  email: string;
  password: string;
}

export interface IUserDoc extends IUser, Document {
  isPasswordMatch(password: string): Promise<boolean>;
}

/* eslint-disable prettier/prettier */
import mongoose, { Schema, Document } from 'mongoose';

export interface IPrivacyPolicy extends Document {
  content: string;
  lastUpdated: Date;
}

const PrivacyPolicySchema: Schema = new Schema({
  content: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

export default mongoose.model<IPrivacyPolicy>('PrivacyPolicy', PrivacyPolicySchema);

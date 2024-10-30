/* eslint-disable prettier/prettier */
import mongoose, { Schema, Document } from 'mongoose';

export interface ITermAndCondition extends Document {
  content: string;
  lastUpdated: Date;
}

const TermAndConditionSchema: Schema = new Schema({
  content: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

export default mongoose.model<ITermAndCondition>('TermAndCondition', TermAndConditionSchema);

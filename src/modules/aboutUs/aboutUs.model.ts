/* eslint-disable prettier/prettier */
import mongoose, { Document, Schema } from 'mongoose';

export interface IAboutUs extends Document {
  content: string;
  lastUpdated: Date;
}

const AboutUsSchema: Schema = new Schema({
  content: {
    type: String,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IAboutUs>('AboutUs', AboutUsSchema);
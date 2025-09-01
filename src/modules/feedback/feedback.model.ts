/* eslint-disable prettier/prettier */
import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedback extends Document {
  name: string;
  rating: number;
  comment: string;
  createdAt: Date;
  type: string; // 'rating' or 'feedback' or 'both'
}

const FeedbackSchema: Schema = new Schema({
  name: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  comment: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['rating', 'feedback', 'both'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IFeedback>('Feedback', FeedbackSchema);
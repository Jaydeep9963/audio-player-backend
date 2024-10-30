/* eslint-disable prettier/prettier */
import mongoose, { Document, Schema } from 'mongoose';

export interface ISubcategory extends Document {
  subcategory_name: string;
  image: File;
  description: string;
  category: Schema.Types.ObjectId;
  audios: Array<string>;
}

const SubcategorySchema: Schema = new Schema({
  subcategory_name: { type: String, required: true },
  image: {
    file: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
  },
  description: {
    type: String,
    required: true,
  },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  audios: [{ type: String, ref: 'Audio' }],
});

export default mongoose.model<ISubcategory>('Subcategory', SubcategorySchema);
  
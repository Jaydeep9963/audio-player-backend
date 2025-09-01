/* eslint-disable prettier/prettier */
import mongoose, { Document, Schema } from 'mongoose';

// Define a custom image type
interface IImage {
  file: string | null; // store the file URL / path
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface ICategory extends Document {
  category_name: string;
  image: IImage; // use your custom type instead of browser File
  description: string;
  subcategories: string[];
}

const CategorySchema: Schema = new Schema({
  category_name: { type: String, required: true, unique: true },
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
  subcategories: [{ type: String, ref: 'Subcategory' }],
});

export default mongoose.model<ICategory>('Category', CategorySchema);

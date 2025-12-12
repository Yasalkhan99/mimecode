import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  logoUrl?: string;
  backgroundColor: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    logoUrl: String,
    backgroundColor: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

CategorySchema.index({ name: 1 });

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);


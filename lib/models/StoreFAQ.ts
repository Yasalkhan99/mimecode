import mongoose, { Schema, Document } from 'mongoose';

export interface IStoreFAQ extends Document {
  storeId: string;
  question: string;
  answer: string;
  order?: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const StoreFAQSchema = new Schema<IStoreFAQ>(
  {
    storeId: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

StoreFAQSchema.index({ storeId: 1, isActive: 1 });
StoreFAQSchema.index({ order: 1 });

export default mongoose.models.StoreFAQ || mongoose.model<IStoreFAQ>('StoreFAQ', StoreFAQSchema);


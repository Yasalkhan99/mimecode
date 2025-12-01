import mongoose, { Schema, Document } from 'mongoose';

export interface IFAQ extends Document {
  question: string;
  answer: string;
  order?: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const FAQSchema = new Schema<IFAQ>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

FAQSchema.index({ isActive: 1, order: 1 });

export default mongoose.models.FAQ || mongoose.model<IFAQ>('FAQ', FAQSchema);


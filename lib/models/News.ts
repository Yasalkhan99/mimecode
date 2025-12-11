import mongoose, { Schema, Document } from 'mongoose';

export interface INews extends Document {
  title: string;
  description: string;
  content?: string;
  imageUrl: string;
  articleUrl?: string;
  date?: string;
  layoutPosition?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const NewsSchema = new Schema<INews>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    content: String,
    imageUrl: { type: String, required: true },
    articleUrl: String,
    date: String,
    layoutPosition: { type: Number, default: null },
  },
  {
    timestamps: true,
  }
);

NewsSchema.index({ layoutPosition: 1 });
NewsSchema.index({ createdAt: -1 });

export default mongoose.models.News || mongoose.model<INews>('News', NewsSchema);


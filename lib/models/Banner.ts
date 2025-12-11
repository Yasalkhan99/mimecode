import mongoose, { Schema, Document } from 'mongoose';

export interface IBanner extends Document {
  title: string;
  imageUrl: string;
  layoutPosition?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    layoutPosition: { type: Number, default: null },
  },
  {
    timestamps: true,
  }
);

BannerSchema.index({ layoutPosition: 1 });

export default mongoose.models.Banner || mongoose.model<IBanner>('Banner', BannerSchema);


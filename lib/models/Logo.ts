import mongoose, { Schema, Document } from 'mongoose';

export interface ILogo extends Document {
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  layoutPosition?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const LogoSchema = new Schema<ILogo>(
  {
    name: { type: String, required: true },
    logoUrl: { type: String, required: true },
    websiteUrl: String,
    layoutPosition: { type: Number, default: null },
  },
  {
    timestamps: true,
  }
);

LogoSchema.index({ layoutPosition: 1 });

export default mongoose.models.Logo || mongoose.model<ILogo>('Logo', LogoSchema);


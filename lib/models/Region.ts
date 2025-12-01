import mongoose, { Schema, Document } from 'mongoose';

export interface IRegion extends Document {
  name: string;
  networkId: string;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const RegionSchema = new Schema<IRegion>(
  {
    name: { type: String, required: true },
    networkId: { type: String, required: true, unique: true },
    description: String,
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

RegionSchema.index({ networkId: 1 });
RegionSchema.index({ isActive: 1 });

export default mongoose.models.Region || mongoose.model<IRegion>('Region', RegionSchema);


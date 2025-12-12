import mongoose, { Schema, Document } from 'mongoose';

export interface IStore extends Document {
  name: string;
  subStoreName?: string;
  slug?: string;
  description: string;
  logoUrl?: string;
  voucherText?: string;
  networkId?: string;
  isTrending?: boolean;
  layoutPosition?: number | null;
  categoryId?: string | null;
  websiteUrl?: string;
  aboutText?: string;
  features?: string[];
  shippingInfo?: string;
  returnPolicy?: string;
  contactInfo?: string;
  trustScore?: number;
  establishedYear?: number;
  headquarters?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const StoreSchema = new Schema<IStore>(
  {
    name: { type: String, required: true },
    subStoreName: String,
    slug: { type: String, unique: true, sparse: true },
    description: { type: String, required: true },
    logoUrl: String,
    voucherText: String,
    networkId: String,
    isTrending: { type: Boolean, default: false },
    layoutPosition: { type: Number, default: null },
    categoryId: { type: String, default: null },
    websiteUrl: String,
    aboutText: String,
    features: [String],
    shippingInfo: String,
    returnPolicy: String,
    contactInfo: String,
    trustScore: Number,
    establishedYear: Number,
    headquarters: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
StoreSchema.index({ slug: 1 });
StoreSchema.index({ categoryId: 1 });
StoreSchema.index({ isTrending: 1, layoutPosition: 1 });
StoreSchema.index({ networkId: 1 });

export default mongoose.models.Store || mongoose.model<IStore>('Store', StoreSchema);


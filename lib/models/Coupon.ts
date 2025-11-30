import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  storeName?: string;
  storeIds?: string[];
  discount: number;
  discountType: 'percentage' | 'fixed';
  description: string;
  isActive: boolean;
  maxUses: number;
  currentUses: number;
  expiryDate?: Date | null;
  logoUrl?: string;
  url?: string;
  couponType?: 'code' | 'deal';
  isPopular?: boolean;
  layoutPosition?: number | null;
  isLatest?: boolean;
  latestLayoutPosition?: number | null;
  categoryId?: string | null;
  buttonText?: string;
  dealScope?: 'sitewide' | 'online-only';
  createdAt?: Date;
  updatedAt?: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true },
    storeName: String,
    storeIds: [String],
    discount: { type: Number, required: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    description: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    maxUses: { type: Number, default: 1000 },
    currentUses: { type: Number, default: 0 },
    expiryDate: Date,
    logoUrl: String,
    url: String,
    couponType: { type: String, enum: ['code', 'deal'], default: 'code' },
    isPopular: { type: Boolean, default: false },
    layoutPosition: { type: Number, default: null },
    isLatest: { type: Boolean, default: false },
    latestLayoutPosition: { type: Number, default: null },
    categoryId: { type: String, default: null },
    buttonText: String,
    dealScope: { type: String, enum: ['sitewide', 'online-only'] },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
CouponSchema.index({ storeIds: 1 });
CouponSchema.index({ categoryId: 1 });
CouponSchema.index({ isActive: 1 });
CouponSchema.index({ isPopular: 1, layoutPosition: 1 });
CouponSchema.index({ isLatest: 1, latestLayoutPosition: 1 });

export default mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);


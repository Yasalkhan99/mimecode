import mongoose, { Schema, Document } from 'mongoose';

export interface IPrivacyPolicy extends Document {
  title: string;
  content: string;
  contactEmail: string;
  contactWebsite: string;
  lastUpdated?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const PrivacyPolicySchema = new Schema<IPrivacyPolicy>(
  {
    title: { type: String, required: true, default: 'Privacy Policy' },
    content: { type: String, required: true },
    contactEmail: { type: String, required: true, default: 'privacy@mimecode.com' },
    contactWebsite: { type: String, required: true, default: 'www.mimecode.com' },
    lastUpdated: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.PrivacyPolicy || mongoose.model<IPrivacyPolicy>('PrivacyPolicy', PrivacyPolicySchema);


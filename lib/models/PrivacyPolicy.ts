import mongoose, { Schema, Document } from 'mongoose';

export interface IPrivacyPolicy extends Document {
  title: string;
  content: string;
  contactEmail: string;
  contactWebsite: string;
  languageCode?: string; // ISO 639-1 language code (e.g., 'en', 'es', 'fr')
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
    languageCode: { type: String, default: 'en' }, // ISO 639-1 language code
    lastUpdated: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.PrivacyPolicy || mongoose.model<IPrivacyPolicy>('PrivacyPolicy', PrivacyPolicySchema);


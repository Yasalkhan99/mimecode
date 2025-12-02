import mongoose, { Schema, Document } from 'mongoose';

export interface ITermsAndConditions extends Document {
  title: string;
  content: string;
  contactEmail: string;
  contactWebsite: string;
  lastUpdated?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const TermsAndConditionsSchema = new Schema<ITermsAndConditions>(
  {
    title: { type: String, required: true, default: 'Terms and Conditions' },
    content: { type: String, required: true },
    contactEmail: { type: String, required: true, default: 'legal@mimecode.com' },
    contactWebsite: { type: String, required: true, default: 'www.mimecode.com' },
    lastUpdated: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.TermsAndConditions || mongoose.model<ITermsAndConditions>('TermsAndConditions', TermsAndConditionsSchema);


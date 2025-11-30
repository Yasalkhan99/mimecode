import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailSettings extends Document {
  email1: string;
  email2?: string;
  email3?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const EmailSettingsSchema = new Schema<IEmailSettings>(
  {
    email1: { type: String, required: true, default: 'admin@mimecode.com' },
    email2: String,
    email3: String,
  },
  {
    timestamps: true,
  }
);

// Single document model - use findOneAndUpdate with upsert
export default mongoose.models.EmailSettings || mongoose.model<IEmailSettings>('EmailSettings', EmailSettingsSchema);


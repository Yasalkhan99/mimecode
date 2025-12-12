import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  bannerUrl?: string;
  startDate: Date;
  endDate: Date;
  moreDetails?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    bannerUrl: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    moreDetails: String,
  },
  {
    timestamps: true,
  }
);

EventSchema.index({ startDate: -1 });
EventSchema.index({ endDate: -1 });

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);


import { Schema, model, Document } from 'mongoose';

export interface IScheduleItem {
  time: string;
  topic: string;
}

export interface IEvent extends Document {
  title: string;
  description: string;
  category: string;
  date: Date;
  venue: string;
  ticketPrice: number;
  maxSeats: number;
  filledSeats: number;
  speaker?: string;
  schedule: IScheduleItem[];
  createdAt: Date;
  updatedAt: Date;
}

const scheduleSchema = new Schema<IScheduleItem>({
  time: { type: String, required: true },
  topic: { type: String, required: true }
}, { _id: false });

const eventSchema = new Schema<IEvent>({
  title: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  date: { type: Date, required: true },
  venue: { type: String, required: true },
  ticketPrice: { type: Number, default: 0 },
  maxSeats: { type: Number, required: true },
  filledSeats: { type: Number, default: 0 },
  speaker: { type: String },
  schedule: [scheduleSchema]
}, {
  timestamps: true
});

export default model<IEvent>('Event', eventSchema);

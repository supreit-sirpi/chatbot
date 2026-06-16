import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  city: string;
  age?: number;
  eventInterests: string[];
  organization?: string;
  registeredEvents: Schema.Types.ObjectId[];
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String, required: true, unique: true, index: true },
  city: { type: String, required: true },
  age: { type: Number },
  eventInterests: [{ type: String }],
  organization: { type: String },
  registeredEvents: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
  isAdmin: { type: Boolean, default: false }
}, {
  timestamps: true
});

export default model<IUser>('User', userSchema);

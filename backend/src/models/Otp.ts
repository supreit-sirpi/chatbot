import { Schema, model, Document } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  code: string;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>({
  email: { type: String, required: true, index: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 } // TTL index: expires after 300 seconds (5 minutes)
});

export default model<IOtp>('Otp', otpSchema);

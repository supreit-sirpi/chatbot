import { Schema, model, Document } from 'mongoose';

export interface IMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export interface IConversation extends Document {
  userId?: Schema.Types.ObjectId;
  sessionId: string;
  messages: IMessage[];
  draftProfile?: {
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    age?: number;
    eventInterests?: string[];
    organization?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  sender: { type: String, enum: ['user', 'bot'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const conversationSchema = new Schema<IConversation>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: String, required: true, unique: true, index: true },
  messages: [messageSchema],
  draftProfile: {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    city: { type: String },
    age: { type: Number },
    eventInterests: [{ type: String }],
    organization: { type: String }
  }
}, {
  timestamps: true
});

export default model<IConversation>('Conversation', conversationSchema);

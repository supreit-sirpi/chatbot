import { GoogleGenAI, GenerationConfig } from '@google/generative-ai';
import { IEvent } from '../models/Event';
import { IUser } from '../models/User';
import { IMessage } from '../models/Conversation';

// Interface for the structured response we expect from our AI
export interface AIResponse {
  intent: 'chat' | 'register_user' | 'register_event' | 'show_profile' | 'show_registered_events' | 'update_profile' | 'delete_account' | 'recommendations' | 'faq';
  reply: string;
  extractedParams?: {
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    age?: number;
    eventInterests?: string[];
    organization?: string;
    eventName?: string;
    fieldName?: 'email' | 'phone';
    fieldValue?: string;
  };
  registrationState?: {
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    age?: number;
    eventInterests?: string[];
    organization?: string;
  };
}

let genAI: any = null;

const getGenAIClient = () => {
  if (genAI) return genAI;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  // Use official @google/generative-ai package
  // Note: Depending on SDK version, we initialize it using new GoogleGenAI({ apiKey }) or standard initialization
  // Let's import GoogleGenAI and instantiate
  try {
    genAI = new GoogleGenAI({ apiKey });
    return genAI;
  } catch (error) {
    console.error('Failed to initialize GoogleGenAI client:', error);
    return null;
  }
};

// Fallback rule-based chatbot for zero-configuration testing
const handleMockAiResponse = (
  message: string,
  history: IMessage[],
  currentUser: IUser | null,
  draftProfile: any,
  events: IEvent[]
): AIResponse => {
  const msg = message.toLowerCase().trim();

  // 1. If user is in the middle of registration
  if (draftProfile && !currentUser) {
    const draft = { ...draftProfile };
    
    // Parse fields based on what's missing
    if (!draft.name) {
      draft.name = message;
      return {
        intent: 'register_user',
        reply: `Thanks ${draft.name}! What is your email address?`,
        registrationState: draft
      };
    } else if (!draft.email) {
      // Basic email extraction
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      const match = message.match(emailRegex);
      if (match) {
        draft.email = match[0];
        return {
          intent: 'register_user',
          reply: `Got it. What is your phone number?`,
          registrationState: draft
        };
      } else {
        return {
          intent: 'register_user',
          reply: `That doesn't look like a valid email. Please provide a valid email address.`,
          registrationState: draft
        };
      }
    } else if (!draft.phone) {
      // Basic phone extraction
      const phoneDigits = message.replace(/\D/g, '');
      if (phoneDigits.length >= 8) {
        draft.phone = message;
        return {
          intent: 'register_user',
          reply: `Which city are you from?`,
          registrationState: draft
        };
      } else {
        return {
          intent: 'register_user',
          reply: `Please provide a valid phone number.`,
          registrationState: draft
        };
      }
    } else if (!draft.city) {
      draft.city = message;
      return {
        intent: 'register_user',
        reply: `What are your event interests? (e.g. Technology, Design, Business, Music - you can list multiple separated by commas)`,
        registrationState: draft
      };
    } else if (!draft.eventInterests || draft.eventInterests.length === 0) {
      draft.eventInterests = message.split(',').map(s => s.trim()).filter(Boolean);
      return {
        intent: 'register_user',
        reply: `What is your organization or company name? (Optional, reply 'none' or 'skip' to skip)`,
        registrationState: draft
      };
    } else if (draft.organization === undefined) {
      draft.organization = msg === 'none' || msg === 'skip' ? '' : message;
      return {
        intent: 'register_user',
        reply: `Great! I have all your registration details now. Ready to register?`,
        registrationState: draft
      };
    }
  }

  // 2. Start Registration
  if (msg.includes('register') && !currentUser && !draftProfile && !msg.includes('event') && !msg.includes('for')) {
    return {
      intent: 'register_user',
      reply: "Welcome! Let's create your profile. May I know your full name?",
      registrationState: { name: '', email: '', phone: '', city: '' }
    };
  }

  // 3. Register for Event
  if (msg.includes('register for') || msg.includes('book event') || (msg.includes('register') && events.some(e => msg.includes(e.title.toLowerCase())))) {
    // Find which event
    const foundEvent = events.find(e => msg.includes(e.title.toLowerCase()) || msg.includes(e.category.toLowerCase()));
    const eventName = foundEvent ? foundEvent.title : message.replace(/register for|book/gi, '').trim();
    
    if (!currentUser) {
      return {
        intent: 'register_event',
        reply: `I see you want to register for "${eventName}". To do that, please log in first by requesting an OTP or start a conversational registration by typing "register".`,
        extractedParams: { eventName }
      };
    }
    
    return {
      intent: 'register_event',
      reply: `Registering you for "${eventName}"...`,
      extractedParams: { eventName }
    };
  }

  // 4. Show Profile
  if (msg.includes('profile') || msg.includes('about me') || msg.includes('my info')) {
    if (!currentUser) {
      return {
        intent: 'show_profile',
        reply: "You need to log in to view your profile. Please type your registered email or phone to receive an OTP."
      };
    }
    return {
      intent: 'show_profile',
      reply: `Here is your profile information:\nName: ${currentUser.name}\nEmail: ${currentUser.email}\nPhone: ${currentUser.phone}\nCity: ${currentUser.city}\nInterests: ${currentUser.eventInterests.join(', ')}`
    };
  }

  // 5. Show Registered Events
  if (msg.includes('my events') || msg.includes('registered events') || msg.includes('my bookings')) {
    if (!currentUser) {
      return {
        intent: 'show_registered_events',
        reply: "Please log in first to view your registered events."
      };
    }
    return {
      intent: 'show_registered_events',
      reply: "Retrieving your registered events..."
    };
  }

  // 6. Update Profile (email / phone)
  if (msg.includes('update my') || msg.includes('change my')) {
    if (!currentUser) {
      return {
        intent: 'update_profile',
        reply: "You must be logged in to update your contact details."
      };
    }
    const isEmail = msg.includes('email');
    const isPhone = msg.includes('phone') || msg.includes('number');
    
    if (isEmail) {
      // Extract email if present
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      const match = message.match(emailRegex);
      if (match) {
        return {
          intent: 'update_profile',
          reply: `Updating your email to ${match[0]}...`,
          extractedParams: { fieldName: 'email', fieldValue: match[0] }
        };
      }
      return {
        intent: 'chat',
        reply: "Please provide the new email address you want to use. E.g., 'Update my email to arun@example.com'."
      };
    }

    if (isPhone) {
      const phoneDigits = message.replace(/\D/g, '');
      if (phoneDigits.length >= 8) {
        return {
          intent: 'update_profile',
          reply: `Updating your phone number to ${phoneDigits}...`,
          extractedParams: { fieldName: 'phone', fieldValue: phoneDigits }
        };
      }
      return {
        intent: 'chat',
        reply: "Please provide the new phone number you want to use."
      };
    }
  }

  // 7. Delete Account
  if (msg.includes('delete my account') || msg.includes('remove my profile') || msg.includes('unregister me entirely')) {
    if (!currentUser) {
      return {
        intent: 'delete_account',
        reply: "You need to log in before you can delete your account."
      };
    }
    return {
      intent: 'delete_account',
      reply: "Are you sure you want to delete your account? This action is permanent. If yes, please type: 'Confirm account deletion'."
    };
  }

  if (msg === 'confirm account deletion' && currentUser) {
    return {
      intent: 'delete_account',
      reply: "Deleting your account now..."
    };
  }

  // 8. Recommendations
  if (msg.includes('recommend') || msg.includes('suggest') || msg.includes('what should i attend')) {
    return {
      intent: 'recommendations',
      reply: "Let me check our event schedule and recommend some sessions for you."
    };
  }

  // 9. FAQ Support
  if (msg.includes('price') || msg.includes('ticket') || msg.includes('cost') || msg.includes('how much')) {
    return {
      intent: 'faq',
      reply: "Most of our workshops are free or range between $10 and $50. You can view all pricing details next to each event in our catalog!"
    };
  }
  if (msg.includes('venue') || msg.includes('where') || msg.includes('location')) {
    return {
      intent: 'faq',
      reply: "Events are held at various locations, including the Main Convention Hall (Hall A), Innovation Lab (Room 302), or online via Zoom. Specific venues are listed under each event!"
    };
  }
  if (msg.includes('cancel') || msg.includes('refund')) {
    return {
      intent: 'faq',
      reply: "You can cancel event registrations anytime through me by asking 'Show my registered events' and selecting cancellation, or by emailing support@eventportal.com. Cancellations are free up to 24 hours before the event."
    };
  }
  if (msg.includes('contact') || msg.includes('support') || msg.includes('help line')) {
    return {
      intent: 'faq',
      reply: "You can contact our support team at support@eventportal.com or call our hotline at +1 (800) 555-0199 from 9 AM to 6 PM EST."
    };
  }

  // 10. Default / Help
  if (msg.includes('help') || msg === 'hello' || msg === 'hi') {
    const greeting = currentUser ? `Hello, ${currentUser.name}!` : "Hello there!";
    return {
      intent: 'chat',
      reply: `${greeting} I am your virtual event assistant. Here is what I can do:\n1. 📅 Register you for events\n2. 🔍 Show and update your profile\n3. 💡 Suggest personalized event recommendations\n4. ℹ️ Answer FAQs about schedules, ticket prices, venues, and cancellations.\n\nHow can I help you today?`
    };
  }

  return {
    intent: 'chat',
    reply: "I'm not completely sure about that. Could you please specify if you want to view events, register for an event, check your profile, or ask a question about schedules?"
  };
};

export const getAIResponse = async (
  message: string,
  history: IMessage[],
  currentUser: IUser | null,
  draftProfile: any,
  events: IEvent[]
): Promise<AIResponse> => {
  const client = getGenAIClient();

  if (!client) {
    console.log('Using rule-based local chatbot fallback (no GEMINI_API_KEY).');
    return handleMockAiResponse(message, history, currentUser, draftProfile, events);
  }

  try {
    // We will use gemini-1.5-flash which is widely available and fast
    // We will format the prompt and generation options to ensure it returns JSON
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Seed events details
    const eventsInfo = events.map(e => ({
      id: e._id,
      title: e.title,
      description: e.description,
      category: e.category,
      date: e.date,
      venue: e.venue,
      ticketPrice: e.ticketPrice,
      maxSeats: e.maxSeats,
      filledSeats: e.filledSeats,
      speaker: e.speaker
    }));

    // Seed history
    const historyText = history
      .slice(-10) // last 10 messages
      .map(h => `${h.sender === 'user' ? 'User' : 'Assistant'}: ${h.text}`)
      .join('\n');

    const systemPrompt = `You are a professional AI Virtual Assistant for an Event Management Portal.
You assist users with:
1. Registration: Collecting details (Name, Email, Phone, City, Optional Age, Optional Event Interests, Optional Organization).
2. Booking/Registering for events.
3. Personal recommendations.
4. Answering FAQs (ticket price, venue details, schedules, contact info, cancellations).
5. Showing/updating user profiles.

Here are the AVAILABLE EVENTS:
${JSON.stringify(eventsInfo, null, 2)}

FAQ Info:
- Ticket prices: Most events are free unless priced (e.g., AI Summit is $49).
- Venue details: Main Conference Hall (Hall A), Virtual Zoom, Innovation Lab.
- Contact: support@eventportal.com, +1 (800) 555-0199.
- Cancellation: Free cancellation up to 24 hours prior to event start.

Current User Status:
${currentUser ? `Logged in: ${JSON.stringify(currentUser)}` : 'Not logged in (Guest)'}

Temporary/Draft Profile (if registering a new user):
${draftProfile ? JSON.stringify(draftProfile) : 'None'}

Your response MUST be in structured JSON format following this TypeScript signature:
interface AIResponse {
  intent: 'chat' | 'register_user' | 'register_event' | 'show_profile' | 'show_registered_events' | 'update_profile' | 'delete_account' | 'recommendations' | 'faq';
  reply: string; // The natural language message to the user
  extractedParams?: { // Parameters extracted from the user's input
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    age?: number;
    eventInterests?: string[];
    organization?: string;
    eventName?: string;
    fieldName?: 'email' | 'phone';
    fieldValue?: string;
  };
  registrationState?: { // Current state of conversational registration
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    age?: number;
    eventInterests?: string[];
    organization?: string;
  };
}

Rules:
1. If the user wants to register their account (or is in the middle of it), set intent to 'register_user'.
2. If they are registering, examine the user message to extract missing details, update the registrationState, and ask for the next missing field in the 'reply'.
3. If they ask to register/book a specific event, set intent to 'register_event' and set extractedParams.eventName.
4. If they want to update email or phone, set intent to 'update_profile', fieldName, and fieldValue.
5. If they want to delete their account, set intent to 'delete_account'.
6. Keep replies professional, polite, and brief. Return ONLY the JSON object.`;

    const prompt = `System Instructions:
${systemPrompt}

Conversation History:
${historyText}

User Message: ${message}

Output JSON:`;

    const generationConfig: GenerationConfig = {
      responseMimeType: 'application/json'
    };

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig
    });

    const responseText = result.response.text();
    const parsed: AIResponse = JSON.parse(responseText.trim());
    return parsed;
  } catch (error) {
    console.error('Error in Gemini AI Service. Falling back to rule-based parser.', error);
    return handleMockAiResponse(message, history, currentUser, draftProfile, events);
  }
};

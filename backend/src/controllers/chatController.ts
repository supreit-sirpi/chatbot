import { Response } from 'express';
import jwt from 'jsonwebtoken';
import Conversation from '../models/Conversation';
import User from '../models/User';
import Event from '../models/Event';
import { getAIResponse } from '../services/aiService';
import { AuthRequest } from '../middleware/authMiddleware';

const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_chatbot_key_2026', {
    expiresIn: '30d'
  });
};

export const handleChatMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      res.status(400).json({ message: 'Message and sessionId are required.' });
      return;
    }

    // 1. Fetch or create conversation history
    let conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      conversation = new Conversation({ sessionId, messages: [] });
    }

    // 2. Load current user if JWT was authenticated by middleware (optional for chatbot endpoint)
    let currentUser = req.user || null;

    // Check if session has a userId linked to it, just in case JWT wasn't passed but session is established
    if (!currentUser && conversation.userId) {
      const linkedUser = await User.findById(conversation.userId);
      if (linkedUser) {
        currentUser = linkedUser;
      }
    }

    // 3. Fetch all active events to pass as context
    const events = await Event.find({});

    // 4. Call AI service
    const aiResult = await getAIResponse(
      message,
      conversation.messages,
      currentUser,
      conversation.draftProfile,
      events
    );

    let reply = aiResult.reply;
    let updatedUser = currentUser;
    let token: string | undefined;
    let actionTriggered = aiResult.intent;

    // 5. Handle Intent Actions
    if (aiResult.intent === 'register_user' && !currentUser) {
      // Conversational Registration flow
      const draft = { ...conversation.draftProfile, ...aiResult.registrationState };
      
      // If AI also extracted details from the user's current response, merge them
      if (aiResult.extractedParams) {
        const params = aiResult.extractedParams;
        if (params.name) draft.name = params.name;
        if (params.email) draft.email = params.email;
        if (params.phone) draft.phone = params.phone;
        if (params.city) draft.city = params.city;
        if (params.age) draft.age = params.age;
        if (params.organization) draft.organization = params.organization;
        if (params.eventInterests) {
          draft.eventInterests = Array.from(new Set([...(draft.eventInterests || []), ...params.eventInterests]));
        }
      }

      // Check if registration is complete (Name, Email, Phone, City are required)
      if (draft.name && draft.email && draft.phone && draft.city) {
        try {
          // Double-check if email/phone already exists
          const existingUser = await User.findOne({
            $or: [{ email: draft.email }, { phone: draft.phone }]
          });

          if (existingUser) {
            reply = `An account with email "${draft.email}" or phone "${draft.phone}" already exists. You can log in using your email/phone to receive an OTP, or provide different details.`;
            conversation.draftProfile = undefined;
          } else {
            // Create user
            const newUser = await User.create({
              name: draft.name,
              email: draft.email,
              phone: draft.phone,
              city: draft.city,
              age: draft.age,
              eventInterests: draft.eventInterests || [],
              organization: draft.organization || '',
              registeredEvents: [],
              isAdmin: false // Default false
            });

            updatedUser = newUser;
            token = generateToken(newUser._id as string);
            conversation.userId = newUser._id as any;
            conversation.draftProfile = undefined;

            reply = `🎉 Awesome, ${newUser.name}! Your profile has been created successfully and you are now logged in.\n\nHere are your registered details:\n- Email: ${newUser.email}\n- Phone: ${newUser.phone}\n- City: ${newUser.city}\n\nYou can now register for any of our upcoming events! Try asking "Show me upcoming events".`;
          }
        } catch (dbError: any) {
          console.error('Database error during user registration:', dbError);
          reply = 'I encountered an issue saving your profile. Please check if your email or phone number is already registered.';
        }
      } else {
        // Save updated draft profile
        conversation.draftProfile = draft;
      }

    } else if (aiResult.intent === 'register_event') {
      const eventName = aiResult.extractedParams?.eventName;

      if (!currentUser) {
        reply = `You need to log in to register for events. Please type your registered email/phone to receive a verification OTP or say "register" to sign up!`;
      } else if (eventName) {
        // Find event (fuzzy search)
        const event = await Event.findOne({
          title: { $regex: new RegExp(eventName, 'i') }
        });

        if (event) {
          // Check if user already registered
          const isAlreadyRegistered = currentUser.registeredEvents.some(
            (id: any) => id.toString() === event._id.toString()
          );

          if (isAlreadyRegistered) {
            reply = `You are already registered for "${event.title}". It takes place on ${new Date(event.date).toLocaleDateString()} at ${event.venue}.`;
          } else if (event.filledSeats >= event.maxSeats) {
            reply = `I'm sorry, "${event.title}" is fully booked! There are no remaining seats.`;
          } else {
            // Register
            event.filledSeats += 1;
            await event.save();

            currentUser.registeredEvents.push(event._id as any);
            await currentUser.save();
            
            // Re-populate events for response
            updatedUser = await User.findById(currentUser._id).populate('registeredEvents') as IUser;

            reply = `✅ Success! You have been registered for **${event.title}**.\n\n📅 Date: ${new Date(event.date).toLocaleDateString()}\n📍 Venue: ${event.venue}\n🎟️ Price: ${event.ticketPrice === 0 ? 'Free' : `$${event.ticketPrice}`}\n\nWe have saved this to your registration history!`;
          }
        } else {
          reply = `I couldn't find an event named "${eventName}". Here are our upcoming events:\n` +
            events.map(e => `- **${e.title}** (${e.category})`).join('\n') + 
            `\n\nWould you like me to register you for one of these?`;
        }
      } else {
        reply = `Which event would you like to register for? Here are the options:\n` +
          events.map(e => `- **${e.title}**`).join('\n');
      }

    } else if (aiResult.intent === 'show_profile') {
      if (!currentUser) {
        reply = `You are not logged in. To view your profile, please authenticate by typing your registered email/phone to request an OTP code, or type "register" to create a new profile.`;
      } else {
        reply = `📋 **Your Profile Information:**\n\n- **Name:** ${currentUser.name}\n- **Email:** ${currentUser.email}\n- **Phone:** ${currentUser.phone}\n- **City:** ${currentUser.city}\n${currentUser.age ? `- **Age:** ${currentUser.age}\n` : ''}${currentUser.organization ? `- **Organization:** ${currentUser.organization}\n` : ''}- **Interests:** ${currentUser.eventInterests.join(', ') || 'None specified'}\n- **Registered Events:** ${currentUser.registeredEvents.length} event(s)`;
      }

    } else if (aiResult.intent === 'show_registered_events') {
      if (!currentUser) {
        reply = `Please log in to view your registrations.`;
      } else {
        const populatedUser = await User.findById(currentUser._id).populate('registeredEvents');
        const userEvents = populatedUser?.registeredEvents as any[] || [];

        if (userEvents.length === 0) {
          reply = `You haven't registered for any events yet. Check out our upcoming calendar or ask me to recommend events!`;
        } else {
          reply = `🎟️ **Your Registered Events:**\n\n` +
            userEvents.map((e, idx) => `${idx + 1}. **${e.title}**\n   📅 Date: ${new Date(e.date).toLocaleDateString()} | 📍 Venue: ${e.venue}`).join('\n\n');
        }
      }

    } else if (aiResult.intent === 'update_profile') {
      if (!currentUser) {
        reply = `You must log in before updating your details.`;
      } else {
        const fieldName = aiResult.extractedParams?.fieldName;
        const fieldValue = aiResult.extractedParams?.fieldValue;

        if (fieldName && fieldValue) {
          try {
            if (fieldName === 'email') {
              // Basic email validate
              if (!fieldValue.includes('@')) {
                reply = 'Please provide a valid email address.';
              } else {
                currentUser.email = fieldValue;
                await currentUser.save();
                updatedUser = currentUser;
                reply = `🔄 I've updated your **email** to: \`${fieldValue}\`.`;
              }
            } else if (fieldName === 'phone') {
              currentUser.phone = fieldValue;
              await currentUser.save();
              updatedUser = currentUser;
              reply = `🔄 I've updated your **phone number** to: \`${fieldValue}\`.`;
            }
          } catch (updateError: any) {
            reply = 'Sorry, I couldn\'t update that. The email or phone number may already be in use by another account.';
          }
        } else {
          reply = `What details would you like to update? You can say "Update my email to user@domain.com" or "Update my phone to 9876543210".`;
        }
      }

    } else if (aiResult.intent === 'delete_account') {
      if (!currentUser) {
        reply = `You must be logged in to delete your account.`;
      } else {
        // To make it safe, we check if the user explicitly confirmed
        if (message.toLowerCase().includes('confirm')) {
          // Decrement filled seats for user's registered events
          for (const eventId of currentUser.registeredEvents) {
            await Event.findByIdAndUpdate(eventId, { $inc: { filledSeats: -1 } });
          }

          await User.findByIdAndDelete(currentUser._id);
          
          // Reset session context
          conversation.userId = undefined;
          conversation.draftProfile = undefined;
          updatedUser = null;
          token = undefined;
          
          reply = `⚠️ Your account has been permanently deleted. All your event registrations have been cancelled and your personal data has been removed from our systems. Let me know if you want to register a new account!`;
        } else {
          reply = `⚠️ **Warning:** Deleting your account is permanent. It will cancel all your registered bookings and remove your profile. If you are sure, please reply: "Confirm account deletion".`;
        }
      }

    } else if (aiResult.intent === 'recommendations') {
      // Provide dynamic recommendations based on interests
      const userInterests = currentUser?.eventInterests || [];
      
      let matchedEvents: Event[] = [];
      if (userInterests.length > 0) {
        // Match events in same categories/interests
        matchedEvents = await Event.find({
          $or: [
            { category: { $in: userInterests.map(i => new RegExp(i, 'i')) } },
            { title: { $in: userInterests.map(i => new RegExp(i, 'i')) } },
            { description: { $in: userInterests.map(i => new RegExp(i, 'i')) } }
          ]
        });
      }

      // If no interests or no matches, recommend upcoming popular events
      if (matchedEvents.length === 0) {
        matchedEvents = await Event.find({}).sort({ date: 1 }).limit(3);
      }

      if (matchedEvents.length === 0) {
        reply = `We don't have any events listed right now. Check back soon!`;
      } else {
        const recType = currentUser ? `based on your interest in *${userInterests.join(', ')}*` : 'from our current schedule';
        reply = `💡 **Personalized Event Recommendations** ${recType}:\n\n` +
          matchedEvents.map(e => `🌟 **${e.title}** (${e.category})\n   📝 ${e.description.slice(0, 100)}...\n   📅 ${new Date(e.date).toLocaleDateString()} | 🎟️ ${e.ticketPrice === 0 ? 'Free' : `$${e.ticketPrice}`}`).join('\n\n') +
          `\n\nWould you like me to register you for any of these? Just say "Register me for [Event Name]".`;
      }
    }

    // 6. Save chat messages to history (limit history to last 50 messages to keep db lean)
    conversation.messages.push({ sender: 'user', text: message, timestamp: new Date() });
    conversation.messages.push({ sender: 'bot', text: reply, timestamp: new Date() });

    if (conversation.messages.length > 50) {
      conversation.messages = conversation.messages.slice(-50);
    }

    await conversation.save();

    // 7. Send Response
    res.status(200).json({
      reply,
      token,
      user: updatedUser ? {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        city: updatedUser.city,
        eventInterests: updatedUser.eventInterests,
        registeredEvents: updatedUser.registeredEvents,
        isAdmin: updatedUser.isAdmin
      } : null,
      draftProfile: conversation.draftProfile,
      intent: actionTriggered,
      history: conversation.messages
    });

  } catch (error) {
    console.error('Error in handleChatMessage:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Fetch chat logs for session
export const getChatHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const conversation = await Conversation.findOne({ sessionId });
    res.json(conversation ? conversation.messages : []);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { sendOTP, verifyOTP } from '../services/otpService';

const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_chatbot_key_2026', {
    expiresIn: '30d'
  });
};

export const requestOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contact } = req.body; // Can be email or phone

    if (!contact) {
      res.status(400).json({ message: 'Please provide email or phone number.' });
      return;
    }

    // Determine if email or phone
    const isEmail = contact.includes('@');
    const query = isEmail ? { email: contact } : { phone: contact };

    const user = await User.findOne(query);
    if (!user) {
      res.status(404).json({
        message: 'Account not found. Please register first with our chatbot.',
        userExists: false
      });
      return;
    }

    // Send OTP to email (or mock phone OTP)
    const email = user.email;
    const testOtp = await sendOTP(email);

    res.status(200).json({
      message: `OTP sent successfully to ${email}.`,
      userExists: true,
      // For development, return the OTP in response so frontend can pre-fill or test easily if console is hidden
      testOtp: process.env.NODE_ENV === 'development' || !process.env.GEMINI_API_KEY ? testOtp : undefined
    });
  } catch (error) {
    console.error('Error requesting OTP:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const verifyOtpCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contact, code } = req.body;

    if (!contact || !code) {
      res.status(400).json({ message: 'Please provide contact and code.' });
      return;
    }

    const isEmail = contact.includes('@');
    const query = isEmail ? { email: contact } : { phone: contact };

    const user = await User.findOne(query);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const isValid = await verifyOTP(user.email, code);
    if (!isValid) {
      res.status(400).json({ message: 'Invalid or expired OTP.' });
      return;
    }

    // Generate JWT token
    const token = generateToken(user._id as string);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        eventInterests: user.eventInterests,
        registeredEvents: user.registeredEvents,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Simple profile retrieval for logged-in users
export const getUserProfile = async (req: any, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id).populate('registeredEvents');
    if (user) {
      res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        eventInterests: user.eventInterests,
        registeredEvents: user.registeredEvents,
        isAdmin: user.isAdmin
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

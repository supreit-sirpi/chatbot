import { Request, Response } from 'express';
import Event from '../models/Event';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await Event.find({}).sort({ date: 1 });
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
};

export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }
    res.status(200).json(event);
  } catch (error) {
    console.error('Error fetching event detail:', error);
    res.status(500).json({ message: 'Error fetching event detail' });
  }
};

export const registerForEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const eventId = req.params.id;
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    const isAlreadyRegistered = user.registeredEvents.some(
      (id: any) => id.toString() === event._id.toString()
    );

    if (isAlreadyRegistered) {
      res.status(400).json({ message: 'You are already registered for this event.' });
      return;
    }

    if (event.filledSeats >= event.maxSeats) {
      res.status(400).json({ message: 'This event is fully booked.' });
      return;
    }

    // Update event seats
    event.filledSeats += 1;
    await event.save();

    // Update user registration
    user.registeredEvents.push(event._id as any);
    await user.save();

    const populatedUser = await User.findById(user._id).populate('registeredEvents');

    res.status(200).json({
      message: 'Registration successful!',
      user: populatedUser
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

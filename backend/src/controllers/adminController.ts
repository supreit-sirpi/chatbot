import { Request, Response } from 'express';
import User from '../models/User';
import Event from '../models/Event';
import Conversation from '../models/Conversation';

export const getAdminUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string || '';
    const interest = req.query.interest as string || '';

    let filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    if (interest) {
      filter.eventInterests = { $regex: interest, $options: 'i' };
    }

    const users = await User.find(filter).populate('registeredEvents').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

export const deleteUserByAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Decrement filled seats for user's registered events
    for (const eventId of user.registeredEvents) {
      await Event.findByIdAndUpdate(eventId, { $inc: { filledSeats: -1 } });
    }

    await User.findByIdAndDelete(id);
    await Conversation.deleteOne({ userId: id as any });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};

export const getAdminAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const totalConversations = await Conversation.countDocuments();
    
    // Total registration transactions
    const events = await Event.find({});
    const totalRegistrations = events.reduce((sum, e) => sum + e.filledSeats, 0);

    // Calculate Completion Rate: % of sessions that ended in user registrations
    const completionRate = totalConversations > 0 
      ? Math.round((totalUsers / totalConversations) * 100) 
      : 0;

    // Event bookings breakdown
    const eventStats = events.map(e => ({
      title: e.title,
      category: e.category,
      filled: e.filledSeats,
      capacity: e.maxSeats,
      percentage: e.maxSeats > 0 ? Math.round((e.filledSeats / e.maxSeats) * 100) : 0
    }));

    // Category distribution
    const categoryStats: { [key: string]: number } = {};
    events.forEach(e => {
      categoryStats[e.category] = (categoryStats[e.category] || 0) + e.filledSeats;
    });

    const categoryDistribution = Object.keys(categoryStats).map(name => ({
      name,
      value: categoryStats[name]
    }));

    res.status(200).json({
      metrics: {
        totalUsers,
        totalConversations,
        totalRegistrations,
        completionRate
      },
      eventStats,
      categoryDistribution
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
};

export const exportUsersCsv = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({}).populate('registeredEvents');

    let csvContent = 'ID,Name,Email,Phone,City,Age,Organization,Interests,Registered Events Count,Registered Events,Joined Date\n';

    users.forEach(u => {
      const escapedName = `"${u.name.replace(/"/g, '""')}"`;
      const escapedCity = `"${u.city.replace(/"/g, '""')}"`;
      const escapedOrg = `"${(u.organization || '').replace(/"/g, '""')}"`;
      const escapedInterests = `"${u.eventInterests.join(', ').replace(/"/g, '""')}"`;
      
      const eventTitles = (u.registeredEvents as any[]).map(e => e.title).join('; ');
      const escapedEvents = `"${eventTitles.replace(/"/g, '""')}"`;

      csvContent += `${u._id},${escapedName},${u.email},${u.phone},${escapedCity},${u.age || ''},${escapedOrg},${escapedInterests},${u.registeredEvents.length},${escapedEvents},${u.createdAt.toISOString()}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=registered_users.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ message: 'Error exporting CSV' });
  }
};

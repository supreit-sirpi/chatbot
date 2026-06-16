import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import chatRoutes from './routes/chatRoutes';
import eventRoutes from './routes/eventRoutes';
import adminRoutes from './routes/adminRoutes';
import Event from './models/Event';
import User from './models/User';

// Load Env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);

// Base Route
app.get('/', (req, res) => {
  res.send('Event Management AI Chatbot API is running...');
});

// Seed Initial Data
const seedData = async () => {
  try {
    // 1. Seed Admin User if not exists
    const adminEmail = 'admin@eventportal.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        name: 'System Admin',
        email: adminEmail,
        phone: '1234567890',
        city: 'Metropolis',
        age: 35,
        eventInterests: ['Technology', 'Design', 'Business'],
        organization: 'EventPortal Inc.',
        registeredEvents: [],
        isAdmin: true
      });
      console.log(`[SEED] Created default admin user: ${adminEmail}`);
    }

    // 2. Seed Events if empty
    const eventCount = await Event.countDocuments();
    if (eventCount === 0) {
      const demoEvents = [
        {
          title: 'Global Tech Summit 2026',
          description: 'Explore the next wave of computing, cloud innovations, and generative AI applications. Features keynote talks from industry pioneers and interactive exhibits.',
          category: 'Technology',
          date: new Date('2026-09-15T09:00:00Z'),
          venue: 'Silicon Hall A (Convention Center)',
          ticketPrice: 49,
          maxSeats: 150,
          filledSeats: 12,
          speaker: 'Dr. Evelyn Martinez, AI Architect',
          schedule: [
            { time: '09:00 AM', topic: 'Keynote: Next Decade in Computing' },
            { time: '11:00 AM', topic: 'Generative AI: Hype vs Reality' },
            { time: '02:00 PM', topic: 'Cloud Architectures for Enterprise Scale' }
          ]
        },
        {
          title: 'UX/UI Design Thinking Workshop',
          description: 'A hands-on workshop focused on user-centered research methods, journey mapping, and rapid prototyping. Best suited for designers, developers, and product managers.',
          category: 'Design',
          date: new Date('2026-10-05T10:00:00Z'),
          venue: 'Creative Studio Room 302',
          ticketPrice: 0, // Free
          maxSeats: 50,
          filledSeats: 8,
          speaker: 'Marcus Vance, Principal UX Designer',
          schedule: [
            { time: '10:00 AM', topic: 'Introduction to Design Thinking Framework' },
            { time: '11:30 AM', topic: 'Empathy Mapping & User Personas' },
            { time: '02:00 PM', topic: 'Prototyping Exercises & Feedback Sessions' }
          ]
        },
        {
          title: 'Startup Pitch & AI Mixer',
          description: 'Connect with angel investors, VC firms, and fellow tech founders. Pitch your early-stage startup or learn how to incorporate AI into your SaaS solutions.',
          category: 'Technology',
          date: new Date('2026-11-20T17:00:00Z'),
          venue: 'Innovation Hub Lounge',
          ticketPrice: 29,
          maxSeats: 100,
          filledSeats: 45,
          speaker: 'Sarah Jenkins, Venture Capital Partner',
          schedule: [
            { time: '05:00 PM', topic: 'Panel Discussion: Raising Pre-seed Capital in 2026' },
            { time: '06:30 PM', topic: 'Startup Pitches (5-minute slots)' },
            { time: '08:00 PM', topic: 'Networking & Drinks Mixer' }
          ]
        },
        {
          title: 'Executive Leadership Networking',
          description: 'An exclusive networking evening for senior directors, VPs, and C-level executives. Discuss industry trends, partnerships, and board-level management strategies.',
          category: 'Networking',
          date: new Date('2026-08-10T18:00:00Z'),
          venue: 'Skyline Lounge (40th Floor)',
          ticketPrice: 0,
          maxSeats: 75,
          filledSeats: 15,
          speaker: 'David Sterling, Corporate Consultant',
          schedule: [
            { time: '06:00 PM', topic: 'Welcome Address & Industry Briefing' },
            { time: '07:00 PM', topic: 'Structured Round-Table Discussions' }
          ]
        },
        {
          title: 'Product Strategy & Roadmap Seminar',
          description: 'Learn how to construct resilient product roadmaps, prioritize feature backlogs using metrics, and align cross-functional product development teams.',
          category: 'Business',
          date: new Date('2026-07-25T13:00:00Z'),
          venue: 'Seminar Suite 12',
          ticketPrice: 15,
          maxSeats: 60,
          filledSeats: 30,
          speaker: 'Nisha Gupta, Director of Product',
          schedule: [
            { time: '01:00 PM', topic: 'Strategic Vision Alignment' },
            { time: '02:30 PM', topic: 'Metrics-driven Prioritization Frameworks' }
          ]
        }
      ];

      await Event.insertMany(demoEvents);
      console.log(`[SEED] Created ${demoEvents.length} upcoming events.`);
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

// Start Server
const startServer = async () => {
  await connectDB();
  await seedData();

  app.listen(PORT, () => {
    console.log(`[SERVER] Running on http://localhost:${PORT}`);
  });
};

startServer();

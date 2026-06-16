const API_BASE_URL = 'http://localhost:5000/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  age?: number;
  eventInterests: string[];
  organization?: string;
  registeredEvents: any[]; // Populated event objects or IDs
  isAdmin: boolean;
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export interface EventItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  venue: string;
  ticketPrice: number;
  maxSeats: number;
  filledSeats: number;
  speaker?: string;
  schedule: { time: string; topic: string }[];
}

export interface ChatResponse {
  reply: string;
  token?: string;
  user: UserProfile | null;
  draftProfile?: any;
  intent: string;
  history: ChatMessage[];
}

export interface AnalyticsData {
  metrics: {
    totalUsers: number;
    totalConversations: number;
    totalRegistrations: number;
    completionRate: number;
  };
  eventStats: {
    title: string;
    category: string;
    filled: number;
    capacity: number;
    percentage: number;
  }[];
  categoryDistribution: {
    name: string;
    value: number;
  }[];
}

// Helpers
const getHeaders = (token?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Chat
  sendMessage: async (message: string, sessionId: string, token?: string): Promise<ChatResponse> => {
    const res = await fetch(`${API_BASE_URL}/chat/message`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ message, sessionId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to send message');
    }
    return res.json();
  },

  getChatHistory: async (sessionId: string): Promise<ChatMessage[]> => {
    const res = await fetch(`${API_BASE_URL}/chat/history/${sessionId}`);
    if (!res.ok) throw new Error('Failed to load chat history');
    return res.json();
  },

  // Auth & OTP
  requestOtp: async (contact: string): Promise<{ message: string; userExists: boolean; testOtp?: string }> => {
    const res = await fetch(`${API_BASE_URL}/auth/otp/send`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ contact }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to send OTP');
    }
    return res.json();
  },

  verifyOtp: async (contact: string, code: string): Promise<{ token: string; user: UserProfile }> => {
    const res = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ contact, code }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Invalid OTP');
    }
    return res.json();
  },

  getProfile: async (token: string): Promise<UserProfile> => {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Session expired. Please log in again.');
    return res.json();
  },

  // Events
  getEvents: async (): Promise<EventItem[]> => {
    const res = await fetch(`${API_BASE_URL}/events`);
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  registerForEvent: async (eventId: string, token: string): Promise<{ message: string; user: UserProfile }> => {
    const res = await fetch(`${API_BASE_URL}/events/${eventId}/register`, {
      method: 'POST',
      headers: getHeaders(token),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to register');
    }
    return res.json();
  },

  // Admin Dashboard
  getAdminUsers: async (token: string, search = '', interest = ''): Promise<UserProfile[]> => {
    const res = await fetch(`${API_BASE_URL}/admin/users?search=${search}&interest=${interest}`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Not authorized');
    return res.json();
  },

  deleteUser: async (userId: string, token: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to delete user');
  },

  getAdminAnalytics: async (token: string): Promise<AnalyticsData> => {
    const res = await fetch(`${API_BASE_URL}/admin/analytics`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  downloadUsersCsv: async (token: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/admin/export`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to export data');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registered_users_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
};

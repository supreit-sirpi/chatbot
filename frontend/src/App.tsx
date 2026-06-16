import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { api } from './utils/api';
import type { EventItem } from './utils/api';
import { ChatWidget } from './components/ChatWidget';
import { LoginModal } from './components/LoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Calendar, MapPin, DollarSign, User, LogIn, LogOut, Moon, Sun, Monitor, AlertCircle, RefreshCw } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { user, token, logout, refreshProfile } = useAuth();
  const [view, setView] = useState<'portal' | 'admin'>('portal');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Fetch events list
  const loadEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch events catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [user]); // Refresh when user changes (auth updates)

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleRegisterEvent = async (eventId: string) => {
    if (!token) {
      setIsLoginOpen(true);
      return;
    }

    try {
      setError('');
      setSuccess('');
      const res = await api.registerForEvent(eventId, token);
      setSuccess(res.message);
      await refreshProfile(); // Sync profile registrations
      await loadEvents(); // Sync filled seats
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const isUserRegistered = (eventId: string) => {
    if (!user) return false;
    return user.registeredEvents.some(
      (ev: any) => (ev._id || ev).toString() === eventId
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 pb-20">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('portal')}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-lg">
                E
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">
                EventHub AI
              </span>
            </div>

            {/* Menu options */}
            <div className="flex items-center gap-4">
              {/* Dark mode switcher */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Admin toggle */}
              {user?.isAdmin && (
                <button
                  onClick={() => setView(view === 'portal' ? 'admin' : 'portal')}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-900"
                >
                  <Monitor size={14} />
                  <span>{view === 'portal' ? 'Admin Panel' : 'Event Portal'}</span>
                </button>
              )}

              {/* Auth actions */}
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden text-right sm:block">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{user.name}</p>
                    <p className="text-[10px] text-slate-450">{user.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 dark:border-red-950/30 dark:hover:bg-red-950/20"
                  >
                    <LogOut size={14} />
                    <span className="hidden sm:inline">Log Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-750"
                >
                  <LogIn size={14} />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {view === 'admin' ? (
          <AdminDashboard onBackToPortal={() => setView('portal')} />
        ) : (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-sky-500/10 via-indigo-500/5 to-transparent p-8 sm:p-16 dark:from-sky-950/20 dark:via-indigo-950/10">
              <div className="relative z-10 max-w-2xl">
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
                  <Calendar size={12} className="animate-pulse" />
                  Upcoming Event Season 2026
                </span>
                <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
                  Register for Next-Gen Workshops in Seconds
                </h1>
                <p className="mt-4 text-sm text-slate-600 leading-relaxed dark:text-slate-400">
                  Welcome to EventHub! Browse our upcoming tech summits, design thinking seminars, and mixers. 
                  You can register instantly by using our <strong className="text-sky-500">AI Chatbot Widget</strong> at the bottom right.
                  Just type <code className="bg-slate-200/50 px-1 py-0.5 rounded dark:bg-slate-800">"Register me for Tech Summit"</code> and let the assistant do the rest!
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    onClick={() => {
                      // Trigger AI widget opening indirectly by emitting event or using querySelector
                      const btn = document.querySelector('button[class*="shadow-sky-500"]');
                      if (btn) (btn as HTMLButtonElement).click();
                    }}
                    className="rounded-xl bg-sky-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-600 hover:shadow-sky-600/30 dark:bg-sky-600 dark:hover:bg-sky-700"
                  >
                    Chat with Assistant
                  </button>
                  {!user && (
                    <button
                      onClick={() => setIsLoginOpen(true)}
                      className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-850"
                    >
                      Authenticate Now
                    </button>
                  )}
                </div>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10 select-none hidden lg:block text-[240px]">
                📅
              </div>
            </div>

            {/* Notifications */}
            {success && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                <Calendar size={16} />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-500 dark:bg-red-950/20 dark:text-red-400">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Event Catalog Grid */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Active Event Catalog</h2>
                <p className="text-xs text-slate-500 mt-1">Check seat details and schedule sessions</p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="animate-spin text-slate-400" size={32} />
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {events.map((event) => {
                    const registered = isUserRegistered(event._id);
                    const isFull = event.filledSeats >= event.maxSeats;
                    
                    return (
                      <div
                        key={event._id}
                        className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition dark:border-slate-850 dark:bg-slate-900"
                      >
                        {/* Event details */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 uppercase tracking-wider">
                              {event.category}
                            </span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {event.ticketPrice === 0 ? 'Free' : `$${event.ticketPrice}`}
                            </span>
                          </div>

                          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                            {event.title}
                          </h3>
                          
                          <p className="mt-2 text-xs text-slate-500 line-clamp-3 leading-relaxed dark:text-slate-400">
                            {event.description}
                          </p>

                          {/* Speaker / Details */}
                          {event.speaker && (
                            <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-650 dark:text-slate-400">
                              <User size={14} className="text-sky-500" />
                              <span>Speaker: <strong className="font-semibold">{event.speaker}</strong></span>
                            </div>
                          )}

                          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-650 dark:text-slate-400">
                            <Calendar size={14} className="text-sky-500" />
                            <span>{new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-650 dark:text-slate-400">
                            <MapPin size={14} className="text-sky-500" />
                            <span className="truncate">{event.venue}</span>
                          </div>
                        </div>

                        {/* Seat details & CTA */}
                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between text-xs mb-3 text-slate-500">
                            <span>Available Capacity:</span>
                            <span className="font-bold">{event.maxSeats - event.filledSeats} seats left</span>
                          </div>
                          
                          <button
                            onClick={() => handleRegisterEvent(event._id)}
                            disabled={registered || isFull}
                            className={`w-full rounded-xl py-3 text-xs font-bold transition ${
                              registered
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                                : isFull
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800'
                                : 'bg-slate-900 hover:bg-slate-850 text-white dark:bg-sky-600 dark:hover:bg-sky-650'
                            }`}
                          >
                            {registered ? '✓ Registered' : isFull ? 'Sold Out' : 'Register for Event'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Chat Widget */}
      <ChatWidget />

      {/* Authentication Modal */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

// Root provider wrapper
export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import type { UserProfile, AnalyticsData } from '../utils/api';
import { Users, CalendarCheck, BarChart3, Download, Search, Trash2, ArrowLeft, ShieldAlert, Sparkles, Filter, Database } from 'lucide-react';

interface AdminDashboardProps {
  onBackToPortal: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToPortal }) => {
  const { user, token } = useAuth();
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [interestFilter, setInterestFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const isAdmin = user?.isAdmin;

  const loadDashboardData = async () => {
    if (!token || !isAdmin) return;
    setLoading(true);
    setError('');
    try {
      const usersData = await api.getAdminUsers(token, searchQuery, interestFilter);
      const analyticsData = await api.getAdminAnalytics(token);
      setUsersList(usersData);
      setAnalytics(analyticsData);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve dashboard files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && isAdmin) {
      loadDashboardData();
    }
  }, [token, isAdmin, searchQuery, interestFilter]);

  const handleDeleteUser = async (userId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to permanently delete this user? All their registered event seats will be released.')) return;
    try {
      await api.deleteUser(userId, token);
      setActionMessage('User deleted successfully.');
      setTimeout(() => setActionMessage(''), 3000);
      loadDashboardData(); // Refresh grid and metrics
    } catch (err: any) {
      setError(err.message || 'Error occurred while trying to delete user.');
    }
  };

  const handleExportCsv = async () => {
    if (!token) return;
    try {
      await api.downloadUsersCsv(token);
    } catch (err: any) {
      setError(err.message || 'CSV export failed.');
    }
  };

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-950/20 dark:text-amber-400">
          <ShieldAlert size={36} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Access Restricted</h2>
        <p className="max-w-md text-slate-500 dark:text-slate-400 mb-6 text-sm">
          This portal is reserved for portal administrators. Please log in using the administrator email address (<code className="bg-slate-100 px-1 py-0.5 dark:bg-slate-900">admin@eventportal.com</code>) to view chatbot analytics and registrations.
        </p>
        <button
          onClick={onBackToPortal}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-700"
        >
          <ArrowLeft size={16} />
          <span>Back to Event Portal</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToPortal}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-850"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Admin Console</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Chatbot usage metrics and event roster logs</p>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-3 font-semibold text-white transition hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700"
        >
          <Download size={16} />
          <span>Export Database (CSV)</span>
        </button>
      </div>

      {actionMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
          <Sparkles size={16} />
          <span>{actionMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-650 dark:bg-red-950/20 dark:text-red-400">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-950/20 dark:text-blue-400">
                <Users size={18} />
              </div>
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{analytics.metrics.totalUsers}</h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 mt-2">Unique profiles saved</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Bookings</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-500 dark:bg-sky-950/20 dark:text-sky-400">
                <CalendarCheck size={18} />
              </div>
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{analytics.metrics.totalRegistrations}</h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 mt-2">Active registrations</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completion Rate</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-500 dark:bg-purple-950/20 dark:text-purple-400">
                <BarChart3 size={18} />
              </div>
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{analytics.metrics.completionRate}%</h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 mt-2">Conversations completed</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chat Sessions</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-400">
                <Database size={18} />
              </div>
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{analytics.metrics.totalConversations}</h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 mt-2">Total conversational logs</p>
          </div>
        </div>
      )}

      {/* Roster & Chart Breakdown */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: User Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">User Directory</h3>
            
            {/* Search + Filters */}
            <div className="flex flex-col gap-4 sm:flex-row mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450" size={16} />
                <input
                  type="text"
                  placeholder="Search by name, email, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs outline-none focus:border-sky-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950 dark:focus:border-sky-500"
                />
              </div>

              <div className="relative min-w-[150px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <select
                  value={interestFilter}
                  onChange={(e) => setInterestFilter(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-8 text-xs outline-none focus:border-sky-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950 dark:focus:border-sky-500"
                >
                  <option value="">All Interests</option>
                  <option value="Technology">Technology</option>
                  <option value="Design">Design</option>
                  <option value="Business">Business</option>
                  <option value="Networking">Networking</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800">
                    <th className="pb-3 font-semibold">User Info</th>
                    <th className="pb-3 font-semibold">Location</th>
                    <th className="pb-3 font-semibold">Interests</th>
                    <th className="pb-3 font-semibold text-center">Bookings</th>
                    <th className="pb-3 font-semibold text-right">Joined</th>
                    <th className="pb-3 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">Loading records...</td>
                    </tr>
                  ) : usersList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">No registered users matched the query.</td>
                    </tr>
                  ) : (
                    usersList.map((usr) => (
                      <tr key={usr.id} className="text-slate-700 dark:text-slate-350">
                        <td className="py-4 pr-3">
                          <div className="font-semibold text-slate-900 dark:text-white">{usr.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{usr.email} • {usr.phone}</div>
                          {usr.organization && <div className="text-[10px] text-sky-500 font-medium">{usr.organization}</div>}
                        </td>
                        <td className="py-4 pr-3">{usr.city}</td>
                        <td className="py-4 pr-3">
                          <div className="flex flex-wrap gap-1">
                            {usr.eventInterests.map((interest, idx) => (
                              <span key={idx} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                {interest}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 text-center font-bold text-slate-900 dark:text-white pr-2">
                          <span className="inline-block rounded bg-sky-50 px-2 py-1 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400">
                            {usr.registeredEvents.length}
                          </span>
                        </td>
                        <td className="py-4 text-right text-slate-400">
                          {new Date(usr.id ? parseInt(usr.id.substring(0, 8), 16) * 1000 : Date.now()).toLocaleDateString()}
                        </td>
                        <td className="py-4 text-center">
                          {usr.isAdmin ? (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">System</span>
                          ) : (
                            <button
                              onClick={() => handleDeleteUser(usr.id)}
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Event Bookings Charts */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Event Seat Fill-Rates</h3>
            {loading ? (
              <div className="text-center py-6 text-slate-450 text-xs">Loading analytics...</div>
            ) : !analytics ? (
              <div className="text-center py-6 text-slate-450 text-xs">No data available</div>
            ) : (
              <div className="space-y-5">
                {analytics.eventStats.map((event, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-300 truncate max-w-[200px]" title={event.title}>
                        {event.title}
                      </span>
                      <span className="text-slate-450 font-semibold">{event.filled} / {event.capacity} seats</span>
                    </div>
                    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-150 dark:bg-slate-800">
                      <div
                        style={{ width: `${event.percentage}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          event.percentage > 85 
                            ? 'bg-red-500' 
                            : event.percentage > 50 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{event.category}</span>
                      <span className="font-bold">{event.percentage}% Filled</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Interest Distribution</h3>
            {loading ? (
              <div className="text-center py-6 text-slate-450 text-xs">Loading categories...</div>
            ) : !analytics || analytics.categoryDistribution.length === 0 ? (
              <div className="text-center py-6 text-slate-450 text-xs">No data available</div>
            ) : (
              <div className="space-y-4">
                {analytics.categoryDistribution.map((item, idx) => {
                  const colors = ['bg-sky-500', 'bg-purple-500', 'bg-amber-500', 'bg-emerald-500', 'bg-pink-500'];
                  const colorClass = colors[idx % colors.length];
                  
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <span className={`h-3 w-3 shrink-0 rounded-full ${colorClass}`} />
                      <span className="text-xs text-slate-700 dark:text-slate-350 flex-1">{item.name}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{item.value} bookings</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

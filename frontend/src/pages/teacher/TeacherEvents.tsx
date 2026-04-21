import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { eventAPI } from '../../services/api';
import Spinner from '../../components/Spinner';

const TeacherEvents: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const theme = {
    primary: '#002B5B',
    secondary: '#2D54A8',
    background: '#F0F2F5',
    white: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280'
  };

  const fetchEvents = async () => {
    try {
      const r = await eventAPI.getAll();
      setEvents(r.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const typeColors: Record<string, string> = {
    Academic: 'bg-blue-50 text-blue-700',
    Sports: 'bg-green-50 text-green-700',
    Cultural: 'bg-purple-50 text-purple-700',
    Holiday: 'bg-red-50 text-red-700',
    Meeting: 'bg-yellow-50 text-yellow-700',
    Other: 'bg-gray-50 text-gray-700'
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: theme.primary }}></div>
      <p className="text-sm font-bold text-gray-500 animate-pulse">Loading events...</p>
    </div>
  );

  return (
    <div className="p-3 md:p-4 space-y-4 min-h-screen" style={{ backgroundColor: theme.background }}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-lg font-black tracking-tight" style={{ color: theme.primary }}>School Events</h1>
          <p className="text-[10px] font-medium text-gray-500">Upcoming school events and calendar updates</p>
        </div>
        <button onClick={fetchEvents} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 font-bold border border-gray-200 transition-all active:scale-95 hover:bg-gray-100 text-[11px]">
          Refresh Events
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {events.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-4 text-gray-300">
              <FaCalendarAlt size={24} />
            </div>
            <h3 className="text-sm font-black text-gray-900 mb-1">No Events Scheduled</h3>
            <p className="text-[10px] font-medium text-gray-500 max-w-xs mx-auto">
              There are no new events at the moment.
            </p>
          </div>
        ) : (
          events.map((ev) => (
            <div key={ev._id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 p-4 flex flex-col relative overflow-hidden group">
              <div className="flex-grow">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className={`text-[8px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider ${typeColors[ev.event_type] || 'bg-gray-100 text-gray-700'}`}>
                    {ev.event_type}
                  </span>
                </div>

                <h3 className="text-sm font-black text-gray-900 mb-2 group-hover:text-primary-600 transition-colors leading-tight line-clamp-2">
                  {ev.title}
                </h3>

                {ev.description && (
                  <p className="text-[11px] font-medium text-gray-500 leading-relaxed line-clamp-3">
                    {ev.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                <div className="flex items-center gap-2 text-gray-500">
                  <FaCalendarAlt size={10} className="text-primary-500" />
                  <span className="text-[10px] font-bold">{new Date(ev.event_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                {ev.location && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <FaMapMarkerAlt size={10} className="text-red-500" />
                    <span className="text-[10px] font-bold truncate">{ev.location}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeacherEvents;

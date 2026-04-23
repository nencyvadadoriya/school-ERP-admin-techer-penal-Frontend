import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, RefreshCcw, Clock, Info } from 'lucide-react';
import Skeleton, { ListSkeleton } from '../../components/Skeleton';
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
    <div className="bg-[#F0F2F5] min-h-screen">
      <ListSkeleton />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-24 md:pb-8">
      {/* Header Gradient (Mobile Only) */}
      <div className="md:hidden bg-[#002B5B] text-white px-5 pt-8 pb-16 rounded-b-[32px] relative overflow-hidden">
        <div className="relative z-10 text-left">
          <h1 className="text-xl font-black tracking-tight">School Events</h1>
          <p className="text-[10px] text-white/70 font-medium uppercase tracking-widest mt-0.5">Calendar & Updates</p>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="px-4 md:px-8 -mt-10 md:mt-8 space-y-4 relative z-20">
        {/* Desktop Only Actions Card */}
        <div className="hidden md:flex bg-white rounded-2xl shadow-sm border border-gray-100 p-6 items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">School Events</h1>
            <p className="text-sm font-medium text-gray-500">Upcoming school events and calendar updates</p>
          </div>
        
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {events.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-gray-300">
                <Calendar size={24} />
              </div>
              <h3 className="text-sm font-black text-gray-900 mb-1">No Events Found</h3>
              <p className="text-[10px] font-medium text-gray-400">New events will appear here.</p>
            </div>
          ) : (
            events.map((ev) => (
              <div key={ev._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-col group hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[7px] px-1.5 py-0.5 rounded-lg font-black uppercase tracking-wider border ${typeColors[ev.event_type] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                    {ev.event_type}
                  </span>
                </div>

                <h3 className="text-[10px] font-black text-gray-900 mb-1 leading-tight group-hover:text-[#002B5B] transition-colors line-clamp-2">
                  {ev.title}
                </h3>

                {ev.description && (
                  <p className="text-[9px] font-medium text-gray-500 line-clamp-2 leading-relaxed mb-3">
                    {ev.description}
                  </p>
                )}

                <div className="mt-auto pt-2.5 border-t border-gray-50 space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Calendar size={8} className="text-[#002B5B]" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">{new Date(ev.event_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  {ev.location && (
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <MapPin size={8} className="text-rose-500" />
                      <span className="text-[8px] font-bold truncate uppercase tracking-tighter">{ev.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherEvents;

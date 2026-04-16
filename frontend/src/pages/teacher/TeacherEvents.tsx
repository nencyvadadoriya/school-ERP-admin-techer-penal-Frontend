import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { eventAPI } from '../../services/api';
import Spinner from '../../components/Spinner';

const TeacherEvents: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
    Academic: 'bg-blue-100 text-blue-700',
    Sports: 'bg-green-100 text-green-700',
    Cultural: 'bg-purple-100 text-purple-700',
    Holiday: 'bg-red-100 text-red-700',
    Meeting: 'bg-yellow-100 text-yellow-700',
    Other: 'bg-gray-100 text-gray-700'
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <p className="text-sm text-gray-500">School events calendar (Added by Admin)</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl p-10 text-center text-gray-400">
            No events scheduled
          </div>
        ) : (
          events.map((ev) => (
            <div key={ev._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{ev.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[ev.event_type] || 'bg-gray-100 text-gray-700'}`}>
                      {ev.event_type}
                    </span>
                  </div>
                  {ev.description && <p className="text-sm text-gray-600 mt-1">{ev.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <FaCalendarAlt />
                      {new Date(ev.event_date).toLocaleDateString()}
                    </span>
                    {ev.location && (
                      <span className="flex items-center gap-1">
                        <FaMapMarkerAlt />
                        {ev.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeacherEvents;

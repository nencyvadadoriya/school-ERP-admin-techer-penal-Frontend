import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaInfoCircle, FaPlus, FaTrash, FaTimes } from 'react-icons/fa';
import Spinner from '../components/Spinner';
import { eventAPI } from '../services/api';

const HolidayCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<any[]>([]);
  const [customEvents, setCustomEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [eventTitle, setEventTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : {};
  const isAdmin = user.role?.toLowerCase() === 'admin';

  useEffect(() => {
  }, [user.role, isAdmin]);

  // Calendarific API Key (Ideally this should be in an env variable)
  const API_KEY = import.meta.env.VITE_CALENDARIFIC_API_KEY || 'YOUR_CALENDARIFIC_API_KEY';
  const COUNTRY = 'IN'; // Default to India
  const YEAR = currentDate.getFullYear();

  const fetchHolidays = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch public holidays if API key is present
      let publicHolidays: any[] = [];
      if (API_KEY && API_KEY !== 'YOUR_CALENDARIFIC_API_KEY' && API_KEY !== 'YOUR_CALENDARIFIC_API_KEY_HERE') {
        try {
          const response = await fetch(`https://calendarific.com/api/v2/holidays?&api_key=${API_KEY}&country=${COUNTRY}&year=${YEAR}`);
          const data = await response.json();
          if (data.response && data.response.holidays) {
            publicHolidays = data.response.holidays;
          }
        } catch (err) {
          console.error('Error fetching public holidays:', err);
        }
      }

      // 2. Fetch custom events from our backend
      const customResponse = await eventAPI.getAll();
      const customData = customResponse.data.data || [];

      setHolidays(publicHolidays);
      setCustomEvents(customData);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Error connecting to services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [YEAR]);

  const handleDateClick = (dateStr: string) => {
    if (!isAdmin) return;
    setSelectedDate(dateStr);
    setEventTitle('');
    setShowModal(true);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !selectedDate) return;

    setSubmitting(true);
    try {
      await eventAPI.create({
        title: eventTitle,
        event_date: selectedDate,
        event_type: 'Holiday',
        description: 'School Holiday'
      });
      setShowModal(false);
      fetchHolidays();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;
    try {
      await eventAPI.delete(id);
      fetchHolidays();
    } catch (err) {
      alert('Failed to delete event');
    }
  };

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];

    // Empty slots for previous month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-100 bg-gray-50"></div>);
    }

      // Days of the current month
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayHolidays = holidays.filter(h => h.date.iso === dateStr);
      const dayCustomEvents = customEvents.filter(e => e.event_date.split('T')[0] === dateStr);
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      days.push(
        <div
          key={day}
          onClick={() => {
            console.log('Div clicked for date:', dateStr);
            handleDateClick(dateStr);
          }}
          className={`h-24 border border-gray-100 p-2 transition-colors relative group ${isAdmin ? 'cursor-pointer hover:bg-primary-50 active:bg-primary-100' : ''} ${isToday ? 'bg-primary-50' : 'bg-white'}`}
          style={{ pointerEvents: 'auto', zIndex: 10, position: 'relative' }}
        >
          <div className="flex justify-between items-start pointer-events-none">
            <span className={`text-sm font-semibold ${isToday ? 'text-primary-600' : 'text-gray-700'}`}>
              {day}
            </span>
            {(dayHolidays.length > 0 || dayCustomEvents.length > 0) && (
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
            )}
          </div>
          <div className="mt-1 space-y-1 overflow-y-auto max-h-16 pointer-events-none">
            {dayHolidays.map((h, idx) => (
              <div
                key={`pub-${idx}`}
                className="text-[10px] leading-tight p-1 bg-red-50 text-red-700 rounded border border-red-100 truncate"
                title={h.name}
              >
                {h.name}
              </div>
            ))}
            {dayCustomEvents.map((e, idx) => (
              <div
                key={`custom-${idx}`}
                className="text-[10px] leading-tight p-1 bg-blue-50 text-blue-700 rounded border border-blue-100 flex justify-between items-center"
                title={e.title}
              >
                <span className="truncate">{e.title}</span>
                {isAdmin && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteEvent(e._id);
                    }}
                    className="ml-1 text-red-400 hover:text-red-600 pointer-events-auto"
                  >
                    <FaTrash size={8} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {isAdmin && (
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <FaPlus className="text-primary-400" size={10} />
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Holiday Calendar</h1>
          <p className="text-sm text-gray-500">View upcoming holidays and school breaks</p>
        </div>
        <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600">
            <FaChevronLeft size={14} />
          </button>
          <span className="px-4 py-1 text-sm font-bold text-gray-700 min-w-[140px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600">
            <FaChevronRight size={14} />
          </button>
        </div>
      </div>

      {(!import.meta.env.VITE_CALENDARIFIC_API_KEY || import.meta.env.VITE_CALENDARIFIC_API_KEY === 'YOUR_CALENDARIFIC_API_KEY') && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex flex-col gap-2 text-sm shadow-sm">
          <div className="flex items-center gap-3">
            <FaInfoCircle className="flex-shrink-0 text-blue-500" />
            <span className="font-bold">Action Required: Enable Holiday Calendar</span>
          </div>
          <div className="ml-7 space-y-2">
            <p>To see real-time holidays, please follow these steps:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Get a free API key from <a href="https://calendarific.com/signup" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-blue-600">Calendarific</a>.</li>
              <li>Open your <code>.env</code> file in the <code>frontend</code> directory.</li>
              <li>Add: <code>VITE_CALENDARIFIC_API_KEY=your_key_here</code></li>
              <li>Restart your development server.</li>
            </ol>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
          <FaInfoCircle className="flex-shrink-0" />
          <span>{error}. Showing local calendar. (Please check API key configuration)</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {renderCalendar()}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <FaCalendarAlt className="text-primary-500" />
          Holidays & Events in {monthNames[currentDate.getMonth()]}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Public Holidays */}
          {holidays
            .filter(h => {
              const d = new Date(h.date.iso);
              return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
            })
            .map((h, idx) => (
              <div key={`list-pub-${idx}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="bg-white w-10 h-10 rounded flex flex-col items-center justify-center shadow-sm border border-gray-100 text-red-500">
                  <span className="text-[10px] font-bold uppercase">{monthNames[new Date(h.date.iso).getMonth()].slice(0, 3)}</span>
                  <span className="text-sm font-bold leading-none">{new Date(h.date.iso).getDate()}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{h.name}</p>
                  <p className="text-[11px] text-gray-500">{h.type?.[0] || 'Public Holiday'}</p>
                </div>
              </div>
            ))}

          {/* Custom Events */}
          {customEvents
            .filter(e => {
              const d = new Date(e.event_date);
              return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
            })
            .map((e, idx) => (
              <div key={`list-custom-${idx}`} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="bg-white w-10 h-10 rounded flex flex-col items-center justify-center shadow-sm border border-gray-100 text-blue-500">
                  <span className="text-[10px] font-bold uppercase">{monthNames[new Date(e.event_date).getMonth()].slice(0, 3)}</span>
                  <span className="text-sm font-bold leading-none">{new Date(e.event_date).getDate()}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{e.title}</p>
                  <p className="text-[11px] text-gray-500">School Holiday</p>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDeleteEvent(e._id)} className="text-red-400 hover:text-red-600 p-1">
                    <FaTrash size={12} />
                  </button>
                )}
              </div>
            ))}

          {holidays.filter(h => {
            const d = new Date(h.date.iso);
            return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
          }).length === 0 && customEvents.filter(e => {
            const d = new Date(e.event_date);
            return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
          }).length === 0 && (
              <p className="text-sm text-gray-400 italic col-span-full py-2">No holidays scheduled for this month.</p>
            )}
        </div>
      </div>

      {/* Admin Modal for Adding Holiday */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">Add Holiday for {selectedDate}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddEvent} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Title</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Annual Day, Special Break"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? 'Adding...' : 'Add Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidayCalendar;

import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaInfoCircle, FaPlus, FaTrash, FaTimes } from 'react-icons/fa';
import Spinner from '../components/Spinner';
import { eventAPI } from '../services/api';

const themeConfig = {
  primary: '#002B5B',
  secondary: '#2D54A8',
  accent: '#1F2937',
  success: '#10B981',
  warning: '#1F2937',
  danger: '#EF4444',
  info: '#3b82f6',
  background: '#F0F2F5',
  white: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
};

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
    <div className="min-h-screen" style={{ backgroundColor: themeConfig.background }}>
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Holiday Calendar</h1>
            <p className="text-sm text-gray-500 font-medium">View upcoming holidays and school breaks</p>
          </div>
          <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 p-1.5">
            <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600">
              <FaChevronLeft size={14} />
            </button>
            <span className="px-6 py-1 text-sm font-black text-gray-800 min-w-[160px] text-center uppercase tracking-widest">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600">
              <FaChevronRight size={14} />
            </button>
          </div>
        </div>

        {(!import.meta.env.VITE_CALENDARIFIC_API_KEY || import.meta.env.VITE_CALENDARIFIC_API_KEY === 'YOUR_CALENDARIFIC_API_KEY') && (
          <div className="bg-blue-50/50 border border-blue-100 text-blue-800 px-6 py-4 rounded-2xl flex flex-col gap-3 text-sm shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <FaInfoCircle size={14} />
              </div>
              <span className="font-black uppercase tracking-wider">Action Required: Enable Holiday Calendar</span>
            </div>
            <div className="ml-11 space-y-2 text-blue-700/80 font-medium">
              <p>To see real-time holidays, please follow these steps:</p>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Get a free API key from <a href="https://calendarific.com/signup" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-blue-900">Calendarific</a>.</li>
                <li>Add <code>VITE_CALENDARIFIC_API_KEY=your_key</code> to your <code>.env</code>.</li>
              </ol>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-7 bg-gray-50/50 border-b border-gray-100">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {day}
                  </div>
                ))}
              </div>

              {loading ? (
                <div className="h-[500px] flex items-center justify-center">
                  <Spinner />
                </div>
              ) : (
                <div className="grid grid-cols-7">
                  {renderCalendar()}
                </div>
              )}
            </div>
          </div>

          {/* List Section */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                Events: {monthNames[currentDate.getMonth()]}
              </h2>
              
              <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                {/* Public Holidays */}
                {holidays
                  .filter(h => {
                    const d = new Date(h.date.iso);
                    return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                  })
                  .map((h, idx) => (
                    <div key={`list-pub-${idx}`} className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:shadow-md transition-all group">
                      <div className="bg-white w-12 h-12 rounded-xl flex flex-col items-center justify-center shadow-sm border border-gray-100 group-hover:border-primary-200 transition-colors">
                        <span className="text-[9px] font-black uppercase text-gray-400">{monthNames[new Date(h.date.iso).getMonth()].slice(0, 3)}</span>
                        <span className="text-lg font-black text-gray-900 leading-none">{new Date(h.date.iso).getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-800 truncate">{h.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{h.type?.[0] || 'Public Holiday'}</p>
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
                    <div key={`list-custom-${idx}`} className="flex items-center gap-4 p-4 bg-primary-50/30 rounded-xl border border-primary-100/50 hover:shadow-md transition-all group">
                      <div className="bg-white w-12 h-12 rounded-xl flex flex-col items-center justify-center shadow-sm border border-gray-100 group-hover:border-primary-200 transition-colors">
                        <span className="text-[9px] font-black uppercase text-primary-400">{monthNames[new Date(e.event_date).getMonth()].slice(0, 3)}</span>
                        <span className="text-lg font-black text-primary-600 leading-none">{new Date(e.event_date).getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-800 truncate">{e.title}</p>
                        <p className="text-[10px] text-primary-400 font-bold uppercase tracking-wider">School Holiday</p>
                      </div>
                      {isAdmin && (
                        <button onClick={() => handleDeleteEvent(e._id)} className="w-8 h-8 rounded-lg bg-white text-red-400 hover:text-red-600 hover:shadow-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
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
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3 border border-gray-100">
                      <FaCalendarAlt className="text-gray-200" size={20} />
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No holidays this month</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-50 bg-gray-50/30">
              <div>
                <h3 className="text-lg font-black text-gray-900">Add Holiday</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{formatDateLabel(selectedDate)}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddEvent} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Holiday Title *</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Annual Sports Meet"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-50/50 transition-all font-bold placeholder:text-gray-300"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3.5 rounded-2xl text-xs font-black text-gray-500 uppercase tracking-widest border border-gray-200 hover:bg-gray-50 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3.5 rounded-2xl text-xs font-black text-white uppercase tracking-widest bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const formatDateLabel = (dStr: string) => {
  if (!dStr) return '';
  const d = new Date(dStr);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default HolidayCalendar;

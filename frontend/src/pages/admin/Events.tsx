import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Skeleton, { ListSkeleton } from '../../components/Skeleton';
import { eventAPI } from '../../services/api';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import { CalendarDays, Tag, MapPin } from 'lucide-react';

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

const EMPTY = { title: '', description: '', event_date: '', end_date: '', location: '', event_type: 'Academic', organized_by: 'School' };

const typeConfig: Record<string, { color: string; bg: string }> = {
  Academic: { color: '#2D54A8', bg: '#EEF2FF' },
  Sports: { color: '#10B981', bg: '#ECFDF5' },
  Cultural: { color: '#7C3AED', bg: '#F5F3FF' },
  Holiday: { color: '#EF4444', bg: '#FEF2F2' },
  Meeting: { color: '#6B7280', bg: '#F3F4F6' },
  Other: { color: '#6B7280', bg: '#F9FAFB' },
};

const Events: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modal, setModal] = useState<boolean>(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [activeType, setActiveType] = useState('All');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetch = async () => { try { const r = await eventAPI.getAll(); setEvents(r.data.data || []); } catch {} finally { setLoading(false); } };
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (editing) { await eventAPI.update(editing._id, form); toast.success('Updated'); }
      else { await eventAPI.create(form); toast.success('Event created'); }
      setModal(false); fetch();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  if (loading) return (
    <div className="bg-[#F0F2F5] min-h-screen">
      <ListSkeleton />
    </div>
  );

  const types = ['All', 'Academic', 'Sports', 'Cultural', 'Holiday', 'Meeting', 'Other'];
  const filtered = activeType === 'All' ? events : events.filter(e => e.event_type === activeType);

  const inputCls = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";

  return (
    <div className="min-h-screen" style={{ backgroundColor: themeConfig.background }}>
      <div className={isMobile ? 'p-0' : 'p-6'}>

        {!isMobile && (
          <div className="mb-6 flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 border border-gray-100">
                <CalendarDays size={24} className="text-gray-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">Events</h1>
                <p className="text-sm text-gray-500 font-medium">School events calendar and schedule</p>
              </div>
            </div>
            <button onClick={() => { setEditing(null); setForm(EMPTY); setModal(true); }} className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-black shadow-lg shadow-primary-100 active:scale-95 hover:brightness-110 transition-all" style={{ background: themeConfig.primary }}>
              <FaPlus size={12} /> Add Event
            </button>
          </div>
        )}

        {isMobile && (
          <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100 mb-4">
            <div className="p-4 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${themeConfig.primary}` }}>
              <div>
                <h2 className="text-lg font-extrabold text-white">Events</h2>
                <p className="text-[10px] text-white/70 font-medium tracking-wider uppercase">School Schedule</p>
              </div>
            </div>
          </div>
        )}

        {/* Search & Add Section for Mobile */}
        {isMobile && (
          <div className="px-4 mb-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-primary-400 transition-all shadow-sm" 
                  placeholder="Search events..." 
                />
              </div>
              <button 
                onClick={() => { setEditing(null); setForm(EMPTY); setModal(true); }} 
                className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-white active:scale-90 transition-transform shadow-md" 
                style={{ background: themeConfig.primary }}
              >
                <FaPlus size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Type filter pills */}
        {!isMobile && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: 'none' }}>
            {types.map(t => {
              const cfg = t === 'All' ? { color: themeConfig.primary, bg: `${themeConfig.primary}15` } : typeConfig[t];
              const isActive = activeType === t;
              return (
                <button key={t} onClick={() => setActiveType(t)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={isActive ? { backgroundColor: cfg?.color || themeConfig.primary, color: '#fff' } : { backgroundColor: '#fff', color: '#6B7280' }}>
                  {t}
                </button>
              );
            })}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${themeConfig.primary}10` }}>
              <CalendarDays size={24} style={{ color: themeConfig.primary }} />
            </div>
            <p className="font-bold text-gray-600">No events scheduled</p>
            <p className="text-sm text-gray-400">Add your first event above</p>
          </div>
        ) : (
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1 px-4 pb-6' : 'grid-cols-1 md:grid-cols-2'}`}>
            {filtered.map(ev => {
              const cfg = typeConfig[ev.event_type] || typeConfig.Other;
              return (
                <div key={ev._id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-transparent hover:border-gray-100 transition-all">
                  <div className="flex">
                    <div className="w-1 flex-shrink-0" style={{ backgroundColor: cfg.color }}></div>
                    <div className="flex-1 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold text-gray-800`}>{ev.title}</h3>
                            <span className={`${isMobile ? 'text-[7px]' : 'text-[9px]'} font-black px-1.5 py-0.5 rounded-lg uppercase tracking-wide`} style={{ color: cfg.color, backgroundColor: cfg.bg }}>{ev.event_type}</span>
                          </div>
                          {ev.description && <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-500 leading-relaxed mb-2 line-clamp-2`}>{ev.description}</p>}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1 text-[9px] text-gray-400">
                              <FaCalendarAlt size={8} style={{ color: themeConfig.secondary }} />
                              {new Date(ev.event_date).toLocaleDateString()}
                              {ev.end_date && ev.end_date !== ev.event_date && ` – ${new Date(ev.end_date).toLocaleDateString()}`}
                            </span>
                            {ev.location && (
                              <span className="flex items-center gap-1 text-[9px] text-gray-400">
                                <FaMapMarkerAlt size={8} className="text-red-400" />{ev.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => { setEditing(ev); setForm({ ...ev, event_date: ev.event_date?.split('T')[0], end_date: ev.end_date?.split('T')[0] }); setModal(true); }} className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors`}><FaEdit size={isMobile ? 10 : 12} /></button>
                          <button onClick={async () => { if (window.confirm('Delete?')) { await eventAPI.delete(ev._id); toast.success('Deleted'); fetch(); } }} className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors`}><FaTrash size={isMobile ? 10 : 12} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Event' : 'Add Event'}>
        <form onSubmit={handleSubmit} className="space-y-4 p-2 pb-24">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
            <input className={inputCls} required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Event title..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <textarea className={inputCls + " resize-none"} rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Start Date *</label>
              <input type="date" className={inputCls} required value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
              <input type="date" className={inputCls} value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-50">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Location</label>
              <input className={inputCls} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Venue..." /></div>
            <div className="relative">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
              <select className={inputCls + " appearance-none cursor-pointer relative z-10"} value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}>
                {['Academic', 'Sports', 'Cultural', 'Holiday', 'Meeting', 'Other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-6 border-t border-gray-100 mt-4">
            <button type="submit" className="flex-1 py-3 rounded-xl text-white text-sm font-black active:scale-95 transition-all shadow-md shadow-primary-100" style={{ background: themeConfig.primary }}>{editing ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setModal(false)} className="flex-1 py-3 rounded-xl text-sm font-black text-gray-500 border border-gray-200 hover:bg-gray-50 uppercase tracking-widest transition-all">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Events;

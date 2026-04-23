import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { School, BookOpen, Clock, Layers, Users, CheckCircle } from 'lucide-react';
import StatCard from '../../components/StatCard';

const theme = { primary: '#002B5B', secondary: '#2D54A8', accent: '#FFC107', background: '#F0F2F5' };
const EMPTY = { standard: '', division: 'A', medium: 'English', stream: '', shift: 'Morning' };

const Classes: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modal, setModal] = useState<boolean>(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState<string>('');
  const [expandedStandard, setExpandedStandard] = useState<any | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const r = await api.get('/class');
      setClasses([...(r.data?.data || [])].sort((a, b) => Number(a.standard) - Number(b.standard)));
    } catch (e: any) {
      toast.error('Failed to fetch classes'); setClasses([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchClasses(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ ...c }); setModal(true); };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const std = Number(form.standard);
    if (std >= 11) {
      const valid = ["Science-Maths", "Science-Bio", "Commerce", "Higher Secondary"];
      if (!valid.includes(form.stream)) { toast.error("Select valid stream for Std 11-12"); return; }
    }
    try {
      setLoading(true);
      if (editing) { await api.patch(`/class/${editing._id}`, form); toast.success('Class updated'); }
      else { await api.post('/class', form); toast.success('Class created'); }
      setModal(false); await fetchClasses();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this class?')) return;
    try { setLoading(true); await api.delete(`/class/${id}`); toast.success('Deleted'); await fetchClasses(); }
    catch { toast.error('Error deleting'); } finally { setLoading(false); }
  };

  const filtered = classes.filter(c =>
    c.standard?.toString().toLowerCase().includes(search.toLowerCase()) ||
    c.division?.toLowerCase().includes(search.toLowerCase()) ||
    c.medium?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped: Record<string, any[]> = {};
  filtered.forEach(c => { if (!grouped[c.standard]) grouped[c.standard] = []; grouped[c.standard].push(c); });
  const standards = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));

  const mediumColor = (m: string) => m === 'English' ? { color: '#2D54A8', bg: '#EEF2FF' } : { color: '#7C3AED', bg: '#F5F3FF' };
  const shiftColor = (s: string) => s === 'Morning' ? { color: '#F59E0B', bg: '#FFFBEB' } : { color: '#6366F1', bg: '#EEF2FF' };

  const inputCls = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background }}>
      <div className={isMobile ? 'p-0' : 'p-6'}>

        {!isMobile && (
          <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              
              <div>
                <h1 className="text-xl font-bold" style={{ color: theme.primary }}>Classrooms</h1>
                <p className="text-xs text-gray-500">Manage sections and details</p>
              </div>
            </div>
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-xs font-bold shadow-md active:scale-95 hover:brightness-110 transition-all" style={{ background: theme.primary }}>
              <FaPlus size={10} /> Add Class
            </button>
          </div>
        )}

        {isMobile && (
          <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100 mb-4">
            <div className="p-4 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${theme.primary}` }}>
              <div>
                <h2 className="text-lg font-extrabold text-white">Classrooms</h2>
                <p className="text-[10px] text-white/70 font-medium tracking-wider">{classes.length} Total Classes</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 ${isMobile ? 'mb-4 px-4 mt-2' : 'mb-6'}`}>
          <StatCard
            title="Total Classes"
            value={classes.length}
            icon={Users}
            iconColor="#002B5B"
            iconBg="rgba(0, 43, 91, 0.18)"
            subtitle="Sections"
          />
          <StatCard
            title="Active Standards"
            value={standards.length}
            icon={Layers}
            iconColor="#002B5B"
            iconBg="rgba(0, 43, 91, 0.18)"
            subtitle="Grades"
          />
          <StatCard
            title="English Medium"
            value={classes.filter(c => c.medium === 'English').length}
            icon={BookOpen}
            iconColor="#002B5B"
            iconBg="rgba(0, 43, 91, 0.18)"
            subtitle="Classes"
          />
          <StatCard
            title="Gujarati Medium"
            value={classes.filter(c => c.medium === 'Gujarati').length}
            icon={BookOpen}
            iconColor="#002B5B"
            iconBg="rgba(0, 43, 91, 0.18)"
            subtitle="Classes"
          />
        </div>

        {/* Search & Add */}
        <div className={`flex items-center gap-2 mb-6 ${isMobile ? 'px-4' : ''}`}>
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
            <input 
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm" 
              placeholder="Search classes..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          {isMobile ? (
            <button 
              onClick={openAdd} 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg"
              style={{ background: theme.primary }}
            >
              <FaPlus size={16} />
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
              <CheckCircle size={14} className="text-emerald-500" />
              <span>{filtered.length} Results</span>
            </div>
          )}
        </div>

        {/* Grouped list */}
        <div className={`space-y-2.5 px-4 ${isMobile ? 'pb-6' : ''}`}>
          {standards.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${theme.primary}10` }}>
                <School size={24} style={{ color: theme.primary }} />
              </div>
              <p className="font-bold text-gray-600">No classes found</p>
              <p className="text-sm text-gray-400">Add your first class above</p>
            </div>
          ) : standards.map(std => {
            const isExp = expandedStandard === std;
            const stdClasses = grouped[std];
            return (
              <div key={std} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                <button onClick={() => setExpandedStandard(isExp ? null : std)} className={`w-full flex items-center justify-between ${isMobile ? 'px-4 py-3' : 'px-5 py-4'} hover:bg-gray-50/50 transition-colors`}>
                  <div className="flex items-center gap-4">
                    <div className={`${isMobile ? 'w-10 h-10 text-base' : 'w-12 h-12 text-lg'} rounded-2xl flex items-center justify-center font-black text-white shadow-inner`} style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>
                      {std}
                    </div>
                    <div className="text-left">
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold text-gray-800`}>Standard {std}</p>
                      <p className={`${isMobile ? 'text-[10px]' : 'text-[11px]'} text-gray-500 font-medium flex items-center gap-1`}>
                        <Layers size={10} /> {stdClasses.length} {stdClasses.length === 1 ? 'Section' : 'Sections'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {!isMobile && (
                      <div className="flex gap-1.5 mr-4">
                        {stdClasses.slice(0, 5).map((c: any, i: number) => (
                          <span key={i} className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold border border-blue-100" style={{ backgroundColor: `${theme.primary}05`, color: theme.primary }}>{c.division}</span>
                        ))}
                        {stdClasses.length > 5 && <span className="text-[10px] text-gray-400 self-center ml-1">+{stdClasses.length - 5} more</span>}
                      </div>
                    )}
                    <div className={`p-1.5 rounded-full transition-transform ${isExp ? 'rotate-180 bg-blue-50' : 'bg-gray-50'}`}>
                      <FaChevronDown size={10} style={{ color: isExp ? theme.primary : '#9CA3AF' }} />
                    </div>
                  </div>
                </button>

                {isExp && (
                  <div className={`border-t border-gray-50 ${isMobile ? 'p-3' : 'p-4'} bg-gray-50/30 grid gap-3`} style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {stdClasses.map((cls: any) => {
                      const mc = mediumColor(cls.medium);
                      const sc = shiftColor(cls.shift);
                      return (
                        <div key={cls._id} className={`group bg-white rounded-xl border border-gray-200 ${isMobile ? 'p-3' : 'p-4'} hover:border-blue-300 hover:shadow-sm transition-all relative overflow-hidden`}>
                          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-[40px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                          <div className={`flex items-center justify-between ${isMobile ? 'mb-3' : 'mb-4'} relative z-10`}>
                            <div className="flex items-center gap-2">
                              <span className={`${isMobile ? 'text-base' : 'text-lg'} font-black`} style={{ color: theme.primary }}>Div {cls.division}</span>
                              {cls.stream && (
                                <span className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 tracking-tighter`}>
                                  {cls.stream}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => openEdit(cls)} className="p-1.5 rounded-lg bg-gray-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"><FaEdit size={10} /></button>
                              <button onClick={() => handleDelete(cls._id)} className="p-1.5 rounded-lg bg-gray-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"><FaTrash size={10} /></button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 relative z-10">
                            <div className="p-1.5 rounded-lg bg-gray-50/80 border border-gray-100">
                              <p className="text-[8px] font-bold text-gray-400 mb-0.5 flex items-center gap-1"><BookOpen size={8} /> Medium</p>
                              <p className="text-[10px] font-bold" style={{ color: mc.color }}>{cls.medium}</p>
                            </div>
                            <div className="p-1.5 rounded-lg bg-gray-50/80 border border-gray-100">
                              <p className="text-[8px] font-bold text-gray-400 mb-0.5 flex items-center gap-1"><Clock size={8} /> Shift</p>
                              <p className="text-[10px] font-bold" style={{ color: sc.color }}>{cls.shift}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Class' : 'Add Class'}>
        <form onSubmit={handleSubmit} className={`${isMobile ? 'space-y-5' : 'space-y-3'}`}>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mb-4`}>
            <div>
              <label className={`block ${isMobile ? 'text-xs' : 'text-xs'} font-semibold text-gray-600 mb-1.5`}>Standard *</label>
              <select className={inputCls} required value={form.standard} onChange={e => setForm({ ...form, standard: e.target.value })}>
                <option value="">Select</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(s => <option key={s} value={s}>Class {s}</option>)}
              </select>
            </div>
            <div>
              <label className={`block ${isMobile ? 'text-xs' : 'text-xs'} font-semibold text-gray-600 mb-1.5`}>Division</label>
              <select className={inputCls} value={form.division} onChange={e => setForm({ ...form, division: e.target.value })}>
                {['A', 'B', 'C', 'D'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className={`${isMobile ? 'col-span-1' : 'col-span-2'}`}>
              <label className={`block ${isMobile ? 'text-xs' : 'text-xs'} font-semibold text-gray-600 mb-1.5`}>Stream</label>
              <select className={inputCls} value={form.stream} onChange={e => setForm({ ...form, stream: e.target.value })}>
                <option value="">None</option>
                {['Science-Maths', 'Science-Bio', 'Commerce', 'Foundation', 'Primary', 'Upper Primary', 'Secondary', 'Higher Secondary'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={`block ${isMobile ? 'text-xs' : 'text-xs'} font-semibold text-gray-600 mb-1.5`}>Medium</label>
              <select className={inputCls} value={form.medium} onChange={e => setForm({ ...form, medium: e.target.value })}>
                <option>English</option><option>Gujarati</option>
              </select>
            </div>
            <div>
              <label className={`block ${isMobile ? 'text-xs' : 'text-xs'} font-semibold text-gray-600 mb-1.5`}>Shift</label>
              <select className={inputCls} value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value })}>
                <option>Morning</option><option>Afternoon</option>
              </select>
            </div>
          </div>
          <div className={`flex gap-3 ${isMobile ? 'pt-4 pb-8' : 'pt-2'}`}>
            <button type="submit" className={`flex-1 ${isMobile ? 'py-3.5 text-sm' : 'py-2.5 text-sm'} rounded-xl text-white font-bold active:scale-95 transition-all shadow-md`} style={{ background: theme.primary }} disabled={loading}>{loading ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setModal(false)} className={`flex-1 ${isMobile ? 'py-3.5 text-sm' : 'py-2.5 text-sm'} rounded-xl font-bold text-gray-500 border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all`} >Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Classes;

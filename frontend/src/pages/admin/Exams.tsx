import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { examAPI, classAPI, subjectAPI } from '../../services/api';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import { ClipboardList, BookOpen, Calendar, Clock, Layout, CheckCircle, Circle, Trash2, Edit3 } from 'lucide-react';
import StatCard from '../../components/StatCard';

const themeConfig = {
  primary: '#002B5B',
  secondary: '#2D54A8',
  accent: '#FFC107',
  success: '#10B981',
  warning: '#f59e0b',
  danger: '#EF4444',
  info: '#3b82f6',
  background: '#F0F2F5',
  white: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
};

const EMPTY = { exam_name: '', medium: '', class_code: '', subject_code: '', exam_date: '', start_time: '', end_time: '', total_marks: 100, passing_marks: 35, exam_type: 'Unit Test', description: '' };

const typeConfig: Record<string, { color: string; bg: string }> = {
  'Unit Test': { color: '#2D54A8', bg: '#EEF2FF' },
  'Mid Term': { color: '#F59E0B', bg: '#FFFBEB' },
  'Final': { color: '#EF4444', bg: '#FEF2F2' },
  'Practical': { color: '#10B981', bg: '#ECFDF5' },
  'Assignment': { color: '#7C3AED', bg: '#F5F3FF' },
};

const Exams: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [metaLoading, setMetaLoading] = useState<boolean>(true);
  const [modal, setModal] = useState<boolean>(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState<string>('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetchData = async () => { try { const r = await examAPI.getAll(); setExams(r.data.data || []); } catch {} finally { setLoading(false); } };
  const fetchMeta = async () => {
    try { const [cR, sR] = await Promise.all([classAPI.getAll(), subjectAPI.getAll()]); setClasses(cR.data.data || []); setSubjects(sR.data.data || []); }
    catch { toast.error('Failed to load classes'); } finally { setMetaLoading(false); }
  };
  useEffect(() => { fetchData(); fetchMeta(); }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (editing) { await examAPI.update(editing._id, form); toast.success('Updated'); }
      else { await examAPI.create(form); toast.success('Exam created'); }
      setModal(false); fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const filtered = exams.filter(e => e.exam_name?.toLowerCase().includes(search.toLowerCase()) || e.class_code?.toLowerCase().includes(search.toLowerCase()));
  const classOptions = form.medium ? classes.filter(c => c.medium === form.medium) : [];
  const selectedClass = classes.find(c => c.class_code === form.class_code);
  const subjectOptions = selectedClass?.subjects?.length ? subjects.filter(s => selectedClass.subjects.includes(s.subject_code)) : subjects;

  if (loading) return <Spinner />;

  const inputCls = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all";

  return (
    <div className="min-h-screen" style={{ backgroundColor: themeConfig.background }}>
      <div className={isMobile ? 'p-0' : 'p-6'}>

        {/* Desktop Header */}
        {!isMobile && (
          <div className="mb-6 flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              
              <div>
                <h1 className="text-2xl font-black text-gray-900">Exams</h1>
                <p className="text-sm text-gray-500 font-medium">Manage exam schedule and results</p>
              </div>
            </div>
            <button onClick={() => { setEditing(null); setForm(EMPTY); setModal(true); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-md active:scale-95 hover:brightness-110 transition-all" style={{ background: themeConfig.primary }}>
              <FaPlus size={12} /> Add Exam
            </button>
          </div>
        )}

        {/* Mobile Header */}
        {isMobile && (
          <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100 mb-4">
            <div className="p-4 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${themeConfig.primary}, ${themeConfig.secondary})` }}>
              <div>
                <h2 className="text-lg font-extrabold text-white">Exams</h2>
                <p className="text-[10px] text-white/70 font-medium tracking-wider">Academic Assessment</p>
              </div>
              <button onClick={() => { setEditing(null); setForm(EMPTY); setModal(true); }} className="w-10 h-10 rounded-xl bg-[#FFC107] flex items-center justify-center text-[#002B5B] active:scale-90 transition-transform shadow-lg">
                <FaPlus size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${isMobile ? 'mb-4 px-4' : 'mb-6'}`}>
          {Object.entries(typeConfig).slice(0, 4).map(([type, cfg]) => (
            <StatCard
              key={type}
              title={type}
              value={exams.filter(e => e.exam_type === type).length}
              icon={ClipboardList}
              iconColor={themeConfig.primary}
              iconBg="rgba(0, 43, 91, 0.08)"
              subtitle="Scheduled"
            />
          ))}
        </div>

        {/* Search Bar */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 mb-5 ${isMobile ? 'mx-4 p-3' : 'p-3'}`}>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
            <input className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary-400 transition-all" placeholder="Search by exam name or class..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Content Section */}
        <div className={isMobile ? 'px-4 pb-10' : ''}>
          {isMobile ? (
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm">
                  <ClipboardList size={32} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No exams found</p>
                </div>
              ) : filtered.map(ex => {
                const cfg = typeConfig[ex.exam_type] || { color: '#6B7280', bg: '#F9FAFB' };
                return (
                  <div key={ex._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex">
                      <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: cfg.color }}></div>
                      <div className="flex-1 p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-sm font-black text-gray-900 truncate">{ex.exam_name}</p>
                            <div className="flex flex-wrap gap-2 mt-1.5">
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider border" style={{ color: cfg.color, backgroundColor: `${cfg.color}10`, borderColor: `${cfg.color}20` }}>{ex.exam_type}</span>
                              <span className="text-[9px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-100 uppercase tracking-tighter">{ex.class_code}</span>
                            </div>
                            <div className="flex gap-4 mt-3">
                              <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400"><Calendar size={12} className="text-gray-300" />{new Date(ex.exam_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400"><CheckCircle size={12} className="text-emerald-400" />{ex.total_marks} Marks</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button onClick={() => { setEditing(ex); setForm({ ...ex, exam_date: ex.exam_date?.split('T')[0] }); setModal(true); }} className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white transition-all flex items-center justify-center shadow-sm"><Edit3 size={14} /></button>
                            <button onClick={async () => { if (window.confirm('Delete this exam?')) { await examAPI.delete(ex._id); toast.success('Deleted'); fetchData(); } }} className="w-8 h-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {filtered.length === 0 ? (
                <div className="text-center py-20">
                  <ClipboardList size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No exams found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        {['Exam Details', 'Medium', 'Class', 'Subject', 'Date', 'Type', 'Marks', 'Actions'].map(h => (
                          <th key={h} className="px-5 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                      {filtered.map(ex => {
                        const cfg = typeConfig[ex.exam_type] || { color: '#6B7280', bg: '#F9FAFB' };
                        return (
                          <tr key={ex._id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-5 py-3.5 min-w-[200px]">
                              <p className="text-sm font-black text-gray-800">{ex.exam_name}</p>
                              {ex.description && <p className="text-[10px] text-gray-400 font-medium truncate max-w-[180px] mt-0.5">{ex.description}</p>}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${ex.medium === 'English' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                                {ex.medium || '—'}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <p className="text-xs font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-100 inline-block">{ex.class_code}</p>
                            </td>
                            <td className="px-5 py-3.5 text-xs font-bold text-gray-600">{ex.subject_code}</td>
                            <td className="px-5 py-3.5">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-700">{new Date(ex.exam_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                {ex.start_time && <span className="text-[9px] font-bold text-gray-400 mt-0.5">{ex.start_time} - {ex.end_time}</span>}
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border shadow-sm" style={{ color: cfg.color, backgroundColor: `${cfg.color}10`, borderColor: `${cfg.color}20` }}>{ex.exam_type}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-gray-800">{ex.total_marks} Marks</span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">Passing: {ex.passing_marks}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex gap-2">
                                <button onClick={() => { setEditing(ex); setForm({ ...ex, exam_date: ex.exam_date?.split('T')[0] }); setModal(true); }} className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white transition-all flex items-center justify-center shadow-sm"><Edit3 size={14} /></button>
                                <button onClick={async () => { if (window.confirm('Delete this exam?')) { await examAPI.delete(ex._id); toast.success('Deleted'); fetchData(); } }} className="w-9 h-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Exam' : 'Add New Exam'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4 p-2">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Exam Title *</label>
            <input className={inputCls} required value={form.exam_name} onChange={e => setForm({ ...form, exam_name: e.target.value })} placeholder="e.g. Unit Test 1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Medium *</label>
              <select className={inputCls} required value={form.medium} onChange={e => setForm({ ...form, medium: e.target.value, class_code: '', subject_code: '' })} disabled={metaLoading}>
                <option value="">Select medium</option>
                <option value="Gujarati">Gujarati</option>
                <option value="English">English</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Class *</label>
              <select className={inputCls} required value={form.class_code} onChange={e => setForm({ ...form, class_code: e.target.value, subject_code: '' })} disabled={metaLoading || !form.medium}>
                <option value="">Select class</option>
                {classOptions.map(c => <option key={c._id} value={c.class_code}>{c.class_code}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Subject *</label>
              <select className={inputCls} required value={form.subject_code} onChange={e => setForm({ ...form, subject_code: e.target.value })} disabled={metaLoading || !form.class_code}>
                <option value="">Select subject</option>
                {subjectOptions.map(s => <option key={s._id} value={s.subject_code}>{s.subject_name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Date *</label>
              <input type="date" className={inputCls} required value={form.exam_date} onChange={e => setForm({ ...form, exam_date: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Type</label>
              <select className={inputCls} value={form.exam_type} onChange={e => setForm({ ...form, exam_type: e.target.value })}>
                {Object.keys(typeConfig).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Marks</label>
                <input type="number" className={inputCls} value={form.total_marks} onChange={e => setForm({ ...form, total_marks: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Passing</label>
                <input type="number" className={inputCls} value={form.passing_marks} onChange={e => setForm({ ...form, passing_marks: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Start Time</label>
              <input type="time" className={inputCls} value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">End Time</label>
              <input type="time" className={inputCls} value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Additional Info</label>
            <textarea className={inputCls + " resize-none"} rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Details about syllabus, venue, etc..." />
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button type="submit" className="flex-1 py-3 rounded-xl text-white text-sm font-black active:scale-95 transition-all shadow-md" style={{ background: themeConfig.primary }}>{editing ? 'Update Exam' : 'Schedule Exam'}</button>
            <button type="button" onClick={() => setModal(false)} className="flex-1 py-3 rounded-xl text-sm font-black text-gray-500 border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all uppercase tracking-widest">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Exams;

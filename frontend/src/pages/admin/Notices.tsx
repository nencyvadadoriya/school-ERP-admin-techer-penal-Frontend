import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { noticeAPI } from '../../services/api';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import { Bell, Megaphone, Users, BookOpen, Clock, XCircle } from 'lucide-react';

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

const EMPTY = { title: '', content: '', target_audience: 'All', priority: 'Medium', published_by: 'Admin' };

const priorityConfig: Record<string, { color: string; bg: string }> = {
  Low: { color: '#10B981', bg: '#ECFDF5' },
  Medium: { color: '#6B7280', bg: '#F3F4F6' },
  High: { color: '#EF4444', bg: '#FEF2F2' },
  Urgent: { color: '#7C3AED', bg: '#F5F3FF' },
};

const audienceIcon: Record<string, any> = { All: Bell, Students: BookOpen, Teachers: Users };

const Notices: React.FC = () => {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modal, setModal] = useState<boolean>(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetch = async () => { try { const r = await noticeAPI.getAll(); setNotices(r.data.data || []); } catch {} finally { setLoading(false); } };
  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (n: any) => { setEditing(n); setForm({ ...n }); setModal(true); };
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (editing) { await noticeAPI.update(editing._id, form); toast.success('Updated'); }
      else { await noticeAPI.create(form); toast.success('Notice published'); }
      setModal(false); fetch();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete notice?')) return;
    try { await noticeAPI.delete(id); toast.success('Deleted'); fetch(); } catch { toast.error('Error'); }
  };

  if (loading) return <Spinner />;

  const inputCls = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";

  return (
    <div className="min-h-screen" style={{ backgroundColor: themeConfig.background }}>
      <div className={isMobile ? 'p-0' : 'p-6'}>

        {!isMobile && (
          <div className="mb-6 flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 border border-gray-100">
                <Bell size={24} className="text-gray-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">Notices</h1>
                <p className="text-sm text-gray-500 font-medium">Manage school notices and announcements</p>
              </div>
            </div>
            <button onClick={openAdd} className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-black shadow-lg shadow-primary-100 active:scale-95 hover:brightness-110 transition-all" style={{ background: themeConfig.primary }}>
              <FaPlus size={12} /> New Notice
            </button>
          </div>
        )}

        {isMobile && (
          <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100 mb-4">
            <div className="p-4 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${themeConfig.primary}, ${themeConfig.secondary})` }}>
              <div>
                <h2 className="text-lg font-extrabold text-white">Notices</h2>
                <p className="text-[10px] text-white/70 font-medium tracking-wider uppercase">Communication Hub</p>
              </div>
              <button onClick={openAdd} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm active:scale-90 transition-transform">
                <FaPlus size={16} />
              </button>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${isMobile ? 'mb-4 px-4' : 'mb-6'}`}>
          {[
            { label: 'Total', value: notices.length, color: themeConfig.primary, bg: 'bg-gray-100', icon: Bell },
            { label: 'Urgent', value: notices.filter(n => n.priority === 'Urgent').length, color: '#7C3AED', bg: 'bg-purple-50', icon: Clock },
            { label: 'High', value: notices.filter(n => n.priority === 'High').length, color: '#EF4444', bg: 'bg-red-50', icon: XCircle },
            { label: 'For All', value: notices.filter(n => n.target_audience === 'All').length, color: '#10B981', bg: 'bg-emerald-50', icon: Users },
          ].map((s, i) => {
            const Icon = s.icon || Bell;
            return (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <Icon size={14} style={{ color: s.color }} />
                  </div>
                  <span className="text-xs font-black" style={{ color: s.color }}>{s.value}</span>
                </div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{s.label}</p>
              </div>
            )
          })}
        </div>

        <div className={`grid grid-cols-1 gap-3 ${isMobile ? 'pb-6' : ''}`}>
          {notices.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${themeConfig.primary}10` }}>
                <Megaphone size={24} style={{ color: themeConfig.primary }} />
              </div>
              <p className="font-bold text-gray-600">No notices yet</p>
              <p className="text-sm text-gray-400">Create your first notice above</p>
            </div>
          ) : notices.map(n => {
            const pc = priorityConfig[n.priority] || { color: '#6B7280', bg: '#F9FAFB' };
            const AIcon = audienceIcon[n.target_audience] || Bell;
            return (
              <div key={n._id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-transparent hover:border-gray-100 transition-all">
                <div className="flex items-start p-4 gap-3">
                  <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: pc.color }}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-gray-800">{n.title}</h3>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wide" style={{ color: pc.color, backgroundColor: pc.bg }}>{n.priority}</span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500 flex items-center gap-1">
                            <AIcon size={8} />{n.target_audience}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{n.content}</p>
                        <p className="text-[10px] text-gray-300 mt-1.5">{new Date(n.createdAt).toLocaleDateString()} · {n.published_by}</p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => openEdit(n)} className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"><FaEdit size={12} /></button>
                        <button onClick={() => handleDelete(n._id)} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"><FaTrash size={12} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Notice' : 'Create Notice'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
            <input className={inputCls} required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Notice title..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Content *</label>
            <textarea className={inputCls + " resize-none"} rows={4} required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Notice content..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Target Audience</label>
              <select className={inputCls} value={form.target_audience} onChange={e => setForm({ ...form, target_audience: e.target.value })}>
                {['All', 'Students', 'Teachers', 'Parents'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
              <select className={inputCls} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="submit" className="flex-1 py-3 rounded-xl text-white text-sm font-black active:scale-95 transition-all shadow-md shadow-primary-100" style={{ background: themeConfig.primary }}>{editing ? 'Update' : 'Publish'}</button>
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-3 rounded-xl text-sm font-black text-gray-500 border border-gray-200 hover:bg-gray-50 uppercase tracking-widest transition-all">Cancel</button>
              </div>
        </form>
      </Modal>
    </div>
  );
};

export default Notices;

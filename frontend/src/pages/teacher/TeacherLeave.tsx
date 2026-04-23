import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, FileText, Clock, RefreshCcw, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import Skeleton, { ListSkeleton, TableSkeleton, CardSkeleton } from '../../components/Skeleton';
import { leaveAPI } from '../../services/api';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';

const EMPTY = { leave_type: 'Casual', from_date: '', to_date: '', reason: '' };

const TeacherLeave: React.FC = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modal, setModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  const theme = {
    primary: '#002B5B',
    secondary: '#2D54A8',
    background: '#F0F2F5',
    white: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280'
  };

  const fetch = async () => {
    try { const r = await leaveAPI.getTeacherLeaves({ teacher_code: user?.teacher_code }); setLeaves(r.data.data || []); }
    catch (e) { } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (editingId) {
        await leaveAPI.updateTeacherLeave(editingId, form);
        toast.success('Leave updated');
      } else {
        await leaveAPI.applyTeacher({ ...form, teacher_id: user?.id || user?._id, teacher_code: user?.teacher_code, teacher_name: `${user?.first_name} ${user?.last_name}` });
        toast.success('Leave applied');
      }
      setModal(false); setEditingId(null); fetch();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleEdit = (l: any) => {
    if (l.status !== 'Pending') return toast.error('Only pending leaves can be edited');
    setForm({
      leave_type: l.leave_type,
      from_date: new Date(l.from_date).toISOString().split('T')[0],
      to_date: new Date(l.to_date).toISOString().split('T')[0],
      reason: l.reason
    });
    setEditingId(l._id);
    setModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this leave application?')) return;
    try {
      await leaveAPI.deleteTeacherLeave(id);
      toast.success('Leave deleted');
      fetch();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  if (loading) return (
    <div className="bg-[#F0F2F5] min-h-screen">
      {/* Mobile-friendly adaptive skeleton */}
      <div className="md:hidden">
        <CardSkeleton />
      </div>
      <div className="hidden md:block">
        <TableSkeleton />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-24 md:pb-8">
      {/* Header Gradient (Mobile Only) */}
      <div className="md:hidden bg-[#002B5B] text-white px-5 pt-10 pb-16 rounded-b-[32px] relative overflow-hidden">
        <div className="relative z-10 text-left">
          <h1 className="text-2xl font-black tracking-tight">My Leaves</h1>
          <p className="text-[10px] text-white/70 font-medium uppercase tracking-widest mt-0.5">Leave Management</p>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="px-4 md:px-8 -mt-10 md:mt-8 space-y-4 relative z-20">
        {/* Desktop Only Actions Card */}
        <div className="hidden md:flex bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">My Leave Applications</h1>
            <p className="text-sm font-medium text-gray-500">Apply for and track your leave requests</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => { setForm(EMPTY); setModal(true); }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold shadow-lg shadow-blue-900/10 transition-all active:scale-95 hover:brightness-110 text-xs"
              style={{ backgroundColor: theme.primary }}
            >
              <Plus size={18} />
              <span>Apply Leave</span>
            </button>
          </div>
        </div>

        {/* Mobile Apply Button Card - Integrated Style */}
        <div className="md:hidden flex justify-center mt-2 mb-4">
          <button
            onClick={() => { setForm(EMPTY); setModal(true); }}
            className="w-full max-w-[200px] flex items-center justify-center gap-2 py-3 bg-white text-[#002B5B] shadow-xl rounded-2xl text-[11px] font-black uppercase tracking-wider hover:bg-gray-50 transition-all active:scale-95 border border-gray-100"
          >
            <Plus size={16} />
            <span>Apply Leave</span>
          </button>
        </div>

        {/* Leaves Content */}
        <div>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Leave Category</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Remarks</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <FileText size={24} className="text-gray-300" />
                      </div>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No applications found</p>
                    </td>
                  </tr>
                ) : (
                  leaves.map(l => (
                    <tr key={l._id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-gray-900">{l.leave_type}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900 uppercase flex items-center gap-1.5">
                            <Calendar size={10} className="text-gray-400" />
                            {new Date(l.from_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter ml-4">
                            to {new Date(l.to_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[200px]">
                        <p className="text-xs font-medium text-gray-600 line-clamp-2 leading-relaxed italic border-l-2 border-gray-100 pl-3">{l.reason}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge status={l.status} />
                      </td>
                      <td className="px-6 py-4">
                        {l.status === 'Rejected' ? (
                          <p className="text-[10px] text-rose-500 font-bold italic line-clamp-1" title={l.rejection_reason}>{l.rejection_reason || 'No reason provided'}</p>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {l.status === 'Pending' ? (
                            <>
                              <button onClick={() => handleEdit(l)} className="p-2 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all"><Edit size={14} /></button>
                              <button onClick={() => handleDelete(l._id)} className="p-2 text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition-all"><Trash2 size={14} /></button>
                            </>
                          ) : (
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg">Finalized</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {leaves.length === 0 ? (
              <div className="py-20 text-center">
                <FileText size={24} className="text-gray-200 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No applications found</p>
              </div>
            ) : (
              leaves.map(l => (
                <div key={l._id} className="p-4 my-3 rounded-2xl shadow-sm border border-gray-100 space-y-4 bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#002B5B]/5 flex items-center justify-center text-[#002B5B] font-black text-xs uppercase">
                        {l.leave_type.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900 leading-tight">{l.leave_type} Leave</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[8px] font-bold text-gray-400 uppercase flex items-center gap-1 tracking-widest">
                            <Clock size={8} />
                            {new Date(l.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="scale-75 origin-top-right">
                      <Badge status={l.status} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <Calendar size={10} className="text-gray-400" /> Duration
                      </p>
                      <p className="text-xs font-black text-gray-900 leading-tight">
                        {new Date(l.from_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - {new Date(l.to_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                    <div className="p-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Reason</p>
                      <p className="text-xs font-medium text-gray-600 leading-relaxed">{l.reason}</p>
                    </div>
                  </div>

                  {l.status === 'Pending' ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(l)}
                        className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(l._id)}
                        className="flex-1 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95"
                      >
                        Delete
                      </button>
                    </div>
                  ) : l.status === 'Rejected' && l.rejection_reason && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3">
                      <Info size={14} className="text-rose-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Management Remarks</p>
                        <p className="text-xs text-rose-600 font-bold italic leading-relaxed">{l.rejection_reason}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => { setModal(false); setEditingId(null); }} title={editingId ? "Edit Leave Request" : "Request New Leave"}>
        <form onSubmit={handleSubmit} className="space-y-4 p-1">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Leave Category</label>
            <select
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none cursor-pointer"
              value={form.leave_type}
              onChange={e => setForm({ ...form, leave_type: e.target.value })}
            >
              {['Sick', 'Personal', 'Family', 'Emergency', 'Casual', 'Other'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">From Date</label>
              <input type="date" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none" required value={form.from_date} onChange={e => setForm({ ...form, from_date: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">To Date</label>
              <input type="date" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none" required value={form.to_date} onChange={e => setForm({ ...form, to_date: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reason</label>
            <textarea
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none resize-none"
              rows={3}
              required
              value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })}
              placeholder="Detailed reason..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-black text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all active:scale-95">Cancel</button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-xs font-black text-white shadow-md transition-all active:scale-95 hover:brightness-110"
              style={{ backgroundColor: theme.primary }}
            >
              {editingId ? 'Update' : 'Submit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherLeave;

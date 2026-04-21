import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { leaveAPI } from '../../services/api';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';

const EMPTY = { leave_type:'Casual', from_date:'', to_date:'', reason:'' };

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
    try { const r = await leaveAPI.getTeacherLeaves({ teacher_code: user?.teacher_code }); setLeaves(r.data.data||[]); }
    catch(e){} finally { setLoading(false); }
  };
  useEffect(()=>{fetch();},[]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (editingId) {
        await leaveAPI.updateTeacherLeave(editingId, form);
        toast.success('Leave updated');
      } else {
        await leaveAPI.applyTeacher({ ...form, teacher_id: user?.id||user?._id, teacher_code: user?.teacher_code, teacher_name: `${user?.first_name} ${user?.last_name}` });
        toast.success('Leave applied');
      }
      setModal(false); setEditingId(null); fetch();
    } catch(err: any) { toast.error(err.response?.data?.message||'Error'); }
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
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: theme.primary }}></div>
      <p className="text-sm font-bold text-gray-500 animate-pulse">Loading leave applications...</p>
    </div>
  );

  return (
    <div className="p-3 md:p-4 space-y-4 min-h-screen" style={{ backgroundColor: theme.background }}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-lg font-black tracking-tight" style={{ color: theme.primary }}>My Leave Applications</h1>
          <p className="text-[10px] font-medium text-gray-500">Apply for and track your leave requests</p>
        </div>
        <button 
          onClick={()=>{setForm(EMPTY);setModal(true);}} 
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white font-bold shadow-md transition-all active:scale-95 hover:brightness-110 text-xs"
          style={{ backgroundColor: theme.primary }}
        >
          <FaPlus size={12} />
          <span>Apply New Leave</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-5 py-3">Leave Category</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Reason for Leave</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3">Remarks</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[11px]">
              {leaves.length===0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <p className="text-xs font-bold uppercase tracking-widest">No leaves found</p>
                  </td>
                </tr>
              ) : leaves.map(l=>(
                <tr key={l._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-5 py-2.5 font-black text-gray-900 leading-tight">{l.leave_type}</td>
                  <td className="px-5 py-2.5">
                    <div className="flex flex-col">
                      <span className="font-black text-gray-900 uppercase">
                        {new Date(l.from_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                        to {new Date(l.to_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-2.5 max-w-xs">
                    <p className="font-medium text-gray-600 line-clamp-2 leading-relaxed italic border-l-2 border-gray-100 pl-2">{l.reason}</p>
                  </td>
                  <td className="px-5 py-2.5 text-center">
                    <Badge status={l.status} />
                  </td>
                  <td className="px-5 py-2.5">
                    {l.status === 'Rejected' ? (
                      <span className="text-[9px] text-red-500 font-bold italic max-w-[120px] truncate block" title={l.rejection_reason}>
                        {l.rejection_reason || 'No reason'}
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="flex justify-end gap-1.5">
                      {l.status === 'Pending' ? (
                        <>
                          <button onClick={() => handleEdit(l)} className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all shadow-sm"><FaEdit size={12} /></button>
                          <button onClick={() => handleDelete(l._id)} className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all shadow-sm"><FaTrash size={12} /></button>
                        </>
                      ) : (
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Finalized</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal} onClose={()=>{setModal(false);setEditingId(null);}} title={editingId ? "Edit Leave Request" : "Request New Leave"}>
        <form onSubmit={handleSubmit} className="space-y-4 p-1">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Leave Category</label>
            <select 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none cursor-pointer"
              value={form.leave_type} 
              onChange={e=>setForm({...form,leave_type:e.target.value})}
            >
              {['Sick','Personal','Family','Emergency','Casual','Other'].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">From Date</label>
              <input type="date" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none" required value={form.from_date} onChange={e=>setForm({...form,from_date:e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">To Date</label>
              <input type="date" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none" required value={form.to_date} onChange={e=>setForm({...form,to_date:e.target.value})} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reason</label>
            <textarea 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none resize-none" 
              rows={3} 
              required 
              value={form.reason} 
              onChange={e=>setForm({...form,reason:e.target.value})} 
              placeholder="Detailed reason..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={()=>setModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-black text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all active:scale-95">Cancel</button>
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

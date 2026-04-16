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
    } catch(err) { toast.error(err.response?.data?.message||'Error'); }
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
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div><h1 className="text-base md:text-lg font-bold text-gray-900">Leave Application</h1><p className="text-xs text-gray-500">Apply for leave</p></div>
        <button onClick={()=>{setForm(EMPTY);setModal(true);}} className="btn-primary flex items-center gap-2"><FaPlus />Apply Leave</button>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50"><tr className="text-left text-gray-500">
            <th className="px-3 py-2 font-medium">Type</th><th className="px-3 py-2 font-medium">From</th>
            <th className="px-3 py-2 font-medium">To</th><th className="px-3 py-2 font-medium">Reason</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Remarks</th>
            <th className="px-3 py-2 font-medium text-right">Actions</th>
          </tr></thead>
          <tbody>{leaves.length===0
            ? <tr><td colSpan={7} className="text-center py-8 text-gray-400">No leaves applied</td></tr>
            : leaves.map(l=>(
            <tr key={l._id} className="border-t border-gray-50 hover:bg-gray-50">
              <td className="px-3 py-2">{l.leave_type}</td>
              <td className="px-3 py-2">{new Date(l.from_date).toLocaleDateString()}</td>
              <td className="px-3 py-2">{new Date(l.to_date).toLocaleDateString()}</td>
              <td className="px-3 py-2 max-w-xs truncate">{l.reason}</td>
              <td className="px-3 py-2"><Badge status={l.status} /></td>
              <td className="px-3 py-2 text-red-500 italic">{l.status === 'Rejected' ? (l.rejection_reason || 'No reason provided') : '-'}</td>
              <td className="px-3 py-2 text-right">
                {l.status === 'Pending' && (
                  <div className="flex justify-end gap-1">
                    <button onClick={() => handleEdit(l)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit"><FaEdit /></button>
                    <button onClick={() => handleDelete(l._id)} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete"><FaTrash /></button>
                  </div>
                )}
              </td>
            </tr>))
          }</tbody>
        </table>
      </div>
      <Modal isOpen={modal} onClose={()=>{setModal(false);setEditingId(null);}} title={editingId ? "Edit Leave Application" : "Apply for Leave"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
            <select className="input-field" value={form.leave_type} onChange={e=>setForm({...form,leave_type:e.target.value})}>
              {['Sick','Personal','Family','Emergency','Casual','Other'].map(t=><option key={t}>{t}</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">From Date *</label>
              <input type="date" className="input-field" required value={form.from_date} onChange={e=>setForm({...form,from_date:e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">To Date *</label>
              <input type="date" className="input-field" required value={form.to_date} onChange={e=>setForm({...form,to_date:e.target.value})} /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
            <textarea className="input-field" rows={3} required value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Submit</button>
            <button type="button" onClick={()=>setModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherLeave;

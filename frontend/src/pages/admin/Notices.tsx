import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { noticeAPI } from '../../services/api';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';

const EMPTY = { title:'', content:'', target_audience:'All', priority:'Medium', published_by:'Admin' };

const Notices: React.FC = () => {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modal, setModal] = useState<boolean>(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(EMPTY);

  const fetch = async () => {
    try { const r = await noticeAPI.getAll(); setNotices(r.data.data || []); }
    catch(e){} finally { setLoading(false); }
  };
  useEffect(()=>{fetch();},[]);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (n) => { setEditing(n); setForm({...n}); setModal(true); };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (editing) { await noticeAPI.update(editing._id, form); toast.success('Updated'); }
      else { await noticeAPI.create(form); toast.success('Notice created'); }
      setModal(false); fetch();
    } catch(err) { toast.error(err.response?.data?.message||'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete notice?')) return;
    try { await noticeAPI.delete(id); toast.success('Deleted'); fetch(); }
    catch(e) { toast.error('Error'); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Notices</h1><p className="text-sm text-gray-500">Manage school notices</p></div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><FaPlus />New Notice</button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {notices.length === 0 ? <div className="bg-white rounded-xl p-10 text-center text-gray-400">No notices yet</div>
        : notices.map(n=>(
          <div key={n._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{n.title}</h3>
                  <Badge status={n.priority} />
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{n.target_audience}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{n.content}</p>
                <p className="text-xs text-gray-400 mt-2">Published: {new Date(n.createdAt).toLocaleDateString()} by {n.published_by}</p>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={()=>openEdit(n)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><FaEdit /></button>
                <button onClick={()=>handleDelete(n._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><FaTrash /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Modal isOpen={modal} onClose={()=>setModal(false)} title={editing?'Edit Notice':'Create Notice'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input className="input-field" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea className="input-field" rows={4} required value={form.content} onChange={e=>setForm({...form,content:e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <select className="input-field" value={form.target_audience} onChange={e=>setForm({...form,target_audience:e.target.value})}>
                <option>All</option><option>Students</option><option>Teachers</option><option>Parents</option>
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select className="input-field" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
              </select></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editing?'Update':'Publish'}</button>
            <button type="button" onClick={()=>setModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Notices;

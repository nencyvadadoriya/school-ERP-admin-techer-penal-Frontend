import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { examAPI, classAPI, subjectAPI } from '../../services/api';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';

const EMPTY = { exam_name:'', medium: '', class_code:'', subject_code:'', exam_date:'', start_time:'', end_time:'', total_marks:100, passing_marks:35, exam_type:'Unit Test', description:'' };

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

  const fetch = async () => {
    try { const r = await examAPI.getAll(); setExams(r.data.data || []); }
    catch(e){} finally { setLoading(false); }
  };

  const fetchMeta = async () => {
    try {
      const [cR, sR] = await Promise.all([
        classAPI.getAll(),
        subjectAPI.getAll(),
      ]);
      setClasses(cR.data.data || []);
      setSubjects(sR.data.data || []);
    } catch (e) {
      toast.error('Failed to load classes or subjects');
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    fetchMeta();
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (editing) { await examAPI.update(editing._id, form); toast.success('Updated'); }
      else { await examAPI.create(form); toast.success('Exam created'); }
      setModal(false); fetch();
    } catch(err) { toast.error(err.response?.data?.message||'Error'); }
  };

  const filtered = exams.filter(e => e.exam_name?.toLowerCase().includes(search.toLowerCase()) || e.class_code?.toLowerCase().includes(search.toLowerCase()));

  const classOptions = form.medium 
    ? classes.filter(c => c.medium === form.medium)
    : [];

  const selectedClass = classes.find(c => c.class_code === form.class_code);
  const subjectOptions = selectedClass?.subjects?.length
    ? subjects.filter(s => selectedClass.subjects.includes(s.subject_code))
    : subjects;

  if (loading) return <Spinner />;

  const typeColors = { 'Unit Test':'bg-blue-100 text-blue-700','Mid Term':'bg-yellow-100 text-yellow-700','Final':'bg-red-100 text-red-700','Practical':'bg-green-100 text-green-700','Assignment':'bg-purple-100 text-purple-700' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Exams</h1><p className="text-sm text-gray-500">Manage exam schedule</p></div>
        <button onClick={()=>{setEditing(null);setForm(EMPTY);setModal(true);}} className="btn-primary flex items-center gap-2"><FaPlus />Add Exam</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative mb-4">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search exams..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 text-left text-gray-500">
            <th className="pb-3 font-medium">Exam Name</th><th className="pb-3 font-medium">Medium</th><th className="pb-3 font-medium">Class</th>
            <th className="pb-3 font-medium">Subject</th><th className="pb-3 font-medium">Date</th>
            <th className="pb-3 font-medium">Type</th><th className="pb-3 font-medium">Marks</th>
            <th className="pb-3 font-medium">Actions</th>
          </tr></thead>
          <tbody>{filtered.length===0
            ? <tr><td colSpan={8} className="text-center py-8 text-gray-400">No exams</td></tr>
            : filtered.map(ex=>(
            <tr key={ex._id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 font-medium">{ex.exam_name}</td>
              <td className="py-3">{ex.medium || '—'}</td>
              <td className="py-3 text-primary-600 font-medium">{ex.class_code}</td>
              <td className="py-3">{ex.subject_code}</td>
              <td className="py-3">{new Date(ex.exam_date).toLocaleDateString()}</td>
              <td className="py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[ex.exam_type]||'bg-gray-100 text-gray-700'}`}>{ex.exam_type}</span></td>
              <td className="py-3 font-medium text-gray-700">{ex.total_marks} / {ex.passing_marks}</td>
              <td className="py-3">
                <div className="flex gap-2">
                  <button onClick={()=>{setEditing(ex);setForm({...ex,exam_date:ex.exam_date?.split('T')[0]});setModal(true);}} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><FaEdit /></button>
                  <button onClick={async()=>{if(window.confirm('Delete?')){await examAPI.delete(ex._id);toast.success('Deleted');fetch();}}} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><FaTrash /></button>
                </div>
              </td>
            </tr>))
          }</tbody>
        </table>
      </div>
      <Modal isOpen={modal} onClose={()=>setModal(false)} title={editing?'Edit Exam':'Add Exam'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Exam Name *</label>
              <input className="input-field" required value={form.exam_name} onChange={e=>setForm({...form,exam_name:e.target.value})} /></div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medium *</label>
              <select
                className="input-field"
                required
                value={form.medium}
                onChange={(e) => setForm({ ...form, medium: e.target.value, class_code: '', subject_code: '' })}
                disabled={metaLoading}
              >
                <option value="">Select medium</option>
                <option value="Gujarati">Gujarati</option>
                <option value="English">English</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Code *</label>
              <select
                className="input-field"
                required
                value={form.class_code}
                onChange={(e) => setForm({ ...form, class_code: e.target.value, subject_code: '' })}
                disabled={metaLoading || !form.medium}
              >
                <option value="">Select class</option>
                {classOptions.map((c) => (
                  <option key={c._id} value={c.class_code}>{c.class_code} (Std {c.standard})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code *</label>
              <select
                className="input-field"
                required
                value={form.subject_code}
                onChange={(e) => setForm({ ...form, subject_code: e.target.value })}
                disabled={metaLoading || !form.class_code}
              >
                <option value="">Select subject</option>
                {subjectOptions.map((s) => (
                  <option key={s._id} value={s.subject_code}>{s.subject_name} ({s.subject_code})</option>
                ))}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Exam Date *</label>
              <input type="date" className="input-field" required value={form.exam_date} onChange={e=>setForm({...form,exam_date:e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
              <select className="input-field" value={form.exam_type} onChange={e=>setForm({...form,exam_type:e.target.value})}>
                {['Unit Test','Mid Term','Final','Practical','Assignment'].map(t=><option key={t}>{t}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
              <input type="number" className="input-field" value={form.total_marks} onChange={e=>setForm({...form,total_marks: Number(e.target.value)})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Passing Marks</label>
              <input type="number" className="input-field" value={form.passing_marks} onChange={e=>setForm({...form,passing_marks: Number(e.target.value)})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="time" className="input-field" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input type="time" className="input-field" value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})} /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="input-field" rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editing?'Update':'Create'}</button>
            <button type="button" onClick={()=>setModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Exams;


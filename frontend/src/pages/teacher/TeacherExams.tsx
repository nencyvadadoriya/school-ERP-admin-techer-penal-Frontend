import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { examAPI, dashboardAPI, subjectAPI } from '../../services/api';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';

const EMPTY = { exam_name:'', medium: '', class_code:'', subject_code:'', exam_date:'', start_time:'', end_time:'', total_marks:100, passing_marks:35, exam_type:'Unit Test', description:'' };

const TeacherExams: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [metaLoading, setMetaLoading] = useState<boolean>(true);
  const [modal, setModal] = useState<boolean>(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState<string>('');

  const theme = {
    primary: '#002B5B',
    secondary: '#2D54A8',
    background: '#F0F2F5',
    white: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280'
  };

  const fetch = async () => {
    try { 
      const r = await examAPI.getAll({}); 
      setExams(r.data.data || []); 
    }
    catch(e){} finally { setLoading(false); }
  };

  const fetchMeta = async () => {
    try {
      const [dR, sR] = await Promise.all([
        dashboardAPI.teacher(),
        subjectAPI.getAll(),
      ]);
      const teacherData = dR.data.data || {};
      const myClasses = teacherData.myClasses || [];
      const subjectAssignments = teacherData.subjectAssignments || [];
      
      let filteredClasses = [];
      if (myClasses.length > 0) {
        filteredClasses = myClasses.filter((c: any) => {
          if (c.teacher_code && user?.teacher_code && String(c.teacher_code) === String(user?.teacher_code)) return true;
          return subjectAssignments.some((a: any) => {
            const classIdMatch = a.class_id && c._id && String(a.class_id) === String(c._id);
            const classNameMatch = a.class_name && c.class_code && String(a.class_name).includes(String(c.class_code));
            const standardStr = `${c.standard} - ${c.division}`;
            const formattedNameMatch = a.class_name && String(a.class_name).includes(standardStr);
            return classIdMatch || classNameMatch || formattedNameMatch;
          });
        });
      }

      if (filteredClasses.length === 0 && subjectAssignments.length > 0) {
        const derivedClasses = subjectAssignments.map((a: any) => ({
          _id: a.class_id,
          class_code: a.class_name,
          standard: a.class_name?.split('-')[0] || a.class_name,
          division: a.class_name?.split('-')[1] || '',
          medium: a.medium || 'English'
        }));
        filteredClasses = Array.from(new Map(derivedClasses.map(c => [c.class_code, c])).values());
      }

      if (filteredClasses.length === 0 && myClasses.length > 0) {
        filteredClasses = myClasses;
      }

      setClasses(filteredClasses);
      setSubjectAssignments(subjectAssignments);
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

  const handleClassChange = (classCode: string) => {
    const selected = classes.find(c => c.class_code === classCode);
    setForm({ 
      ...form, 
      class_code: classCode, 
      medium: selected?.medium || '', 
      subject_code: '' 
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const payload = { ...form, teacher_code: user?.teacher_code };
      if (editing) { 
        await examAPI.update(editing._id, payload); 
        toast.success('Exam updated'); 
      } else { 
        await examAPI.create(payload); 
        toast.success('Exam created'); 
      }
      setModal(false); 
      fetch();
    } catch(err: any) { 
      toast.error(err.response?.data?.message || 'Error saving exam'); 
    }
  };

  const filtered = exams.filter(e => 
    e.exam_name?.toLowerCase().includes(search.toLowerCase()) || 
    e.class_code?.toLowerCase().includes(search.toLowerCase()) ||
    e.subject_code?.toLowerCase().includes(search.toLowerCase())
  );

  const getFilteredSubjects = () => {
    if (!form.class_code) return [];
    const selectedClass = classes.find(c => 
      c.class_code === form.class_code || String(c.standard) === String(form.class_code)
    );
    if (!selectedClass) return [];
    const assignedForThisClass = subjectAssignments.filter(a => {
      if (a.class_id && selectedClass._id && String(a.class_id) === String(selectedClass._id)) return true;
      if (a.class_name && selectedClass.class_code && String(a.class_name).includes(selectedClass.class_code)) return true;
      const standardStr = `${selectedClass.standard} - ${selectedClass.division}`;
      if (a.class_name && a.class_name.includes(standardStr)) return true;
      return false;
    });
    if (assignedForThisClass.length > 0) {
      return assignedForThisClass.map(a => ({
        _id: a.subject_id,
        subject_name: a.subject_name,
        subject_code: a.subject_id
      }));
    }
    return subjects.filter(s => 
      String(s.std) === String(selectedClass.standard) && 
      s.medium === selectedClass.medium
    );
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: theme.primary }}></div>
      <p className="text-sm font-bold text-gray-500 animate-pulse">Loading exam schedules...</p>
    </div>
  );

  const typeColors: any = { 
    'Unit Test': 'bg-blue-50 text-blue-700',
    'Mid Term': 'bg-amber-50 text-amber-700',
    'Final': 'bg-red-50 text-red-700',
    'Practical': 'bg-green-50 text-green-700',
    'Assignment': 'bg-purple-50 text-purple-700' 
  };

  return (
    <div className="p-3 md:p-4 space-y-4 min-h-screen" style={{ backgroundColor: theme.background }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-lg font-black tracking-tight" style={{ color: theme.primary }}>Exam Management</h1>
          <p className="text-[10px] font-medium text-gray-500">Schedule and manage examinations for your classes</p>
        </div>
        <button 
          onClick={() => { setEditing(null); setForm(EMPTY); setModal(true); }} 
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white font-bold shadow-md transition-all active:scale-95 hover:brightness-110 text-xs"
          style={{ backgroundColor: theme.primary }}
        >
          <FaPlus size={12} />
          <span>Add New Exam</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <div className="relative group max-w-md">
            <FaSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
            <input 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none" 
              placeholder="Search by name, class, or subject..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-5 py-3">Exam Details</th>
                <th className="px-5 py-3">Class & Medium</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Schedule</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3 text-center">Marks</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[11px]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <p className="text-xs font-bold uppercase tracking-widest">No exams found</p>
                  </td>
                </tr>
              ) : (
                filtered.map(ex => (
                  <tr key={ex._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-3">
                      <p className="font-black text-gray-900 leading-tight">{ex.exam_name}</p>
                      <p className="text-[8px] text-gray-400 font-bold mt-0.5 uppercase tracking-tighter">ID: {ex._id.slice(-6)}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-primary-600">{ex.class_code}</span>
                        <span className="text-[9px] text-gray-500 font-medium">{ex.medium || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-gray-700">{ex.subject_name || ex.subject_code}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{new Date(ex.exam_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                        <span className="text-[9px] text-gray-500 font-medium uppercase">{ex.start_time || 'N/A'} - {ex.end_time || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[8px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider ${typeColors[ex.exam_type] || 'bg-gray-100 text-gray-700'}`}>
                        {ex.exam_type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex flex-col items-center mx-auto w-fit">
                        <span className="font-black text-gray-900">{ex.total_marks}</span>
                        <span className="text-[8px] font-bold text-green-600 uppercase tracking-tighter">Pass: {ex.passing_marks}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => { setEditing(ex); setForm({ ...ex, exam_date: ex.exam_date?.split('T')[0] }); setModal(true); }} 
                          className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all shadow-sm"
                        >
                          <FaEdit size={12} />
                        </button>
                        <button 
                          onClick={async () => { if (window.confirm('Delete exam?')) { await examAPI.delete(ex._id); toast.success('Deleted'); fetch(); } }} 
                          className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all shadow-sm"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Exam' : 'Add New Exam'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4 p-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Exam Name</label>
              <input 
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none" 
                required value={form.exam_name} onChange={e => setForm({ ...form, exam_name: e.target.value })} 
                placeholder="E.g., Quarterly Assessment"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assigned Class</label>
              <select
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none cursor-pointer disabled:opacity-50"
                required
                value={form.class_code}
                onChange={(e) => handleClassChange(e.target.value)}
                disabled={metaLoading}
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c._id || c.class_code} value={c.class_code}>
                    {c.class_code} (Std {c.standard}-{c.division})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Medium</label>
              <select
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none cursor-pointer disabled:opacity-50"
                required
                value={form.medium}
                onChange={(e) => setForm({ ...form, medium: e.target.value })}
                disabled={metaLoading}
              >
                <option value="">Select Medium</option>
                <option value="Gujarati">Gujarati</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject</label>
              <select
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none cursor-pointer disabled:opacity-50"
                required
                value={form.subject_code}
                onChange={(e) => setForm({ ...form, subject_code: e.target.value })}
                disabled={metaLoading || !form.class_code}
              >
                <option value="">Select Subject</option>
                {getFilteredSubjects().map((s, idx) => (
                  <option key={s._id || idx} value={s.subject_name}>{s.subject_name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Exam Date</label>
              <input type="date" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none" required value={form.exam_date} onChange={e => setForm({ ...form, exam_date: e.target.value })} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
              <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none" value={form.exam_type} onChange={e => setForm({ ...form, exam_type: e.target.value })}>
                {['Unit Test', 'Mid Term', 'Final', 'Practical', 'Assignment'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Max Marks</label>
              <input type="number" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none" value={form.total_marks} onChange={e => setForm({ ...form, total_marks: Number(e.target.value) })} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pass Marks</label>
              <input type="number" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none" value={form.passing_marks} onChange={e => setForm({ ...form, passing_marks: Number(e.target.value) })} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Starts At</label>
              <input type="time" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ends At</label>
              <input type="time" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Exam Instructions</label>
              <textarea 
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none resize-none" 
                rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} 
                placeholder="Notes..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => setModal(false)} 
              className="flex-1 py-2.5 rounded-xl text-xs font-black text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-2.5 rounded-xl text-xs font-black text-white shadow-md transition-all active:scale-95 hover:brightness-110"
              style={{ backgroundColor: theme.primary }}
            >
              {editing ? 'Update' : 'Schedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherExams;

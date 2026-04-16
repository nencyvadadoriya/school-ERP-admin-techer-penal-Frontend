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
      // Use classes from teacher dashboard data
      const teacherData = dR.data.data || {};
      const myClasses = teacherData.myClasses || [];
      const subjectAssignments = teacherData.subjectAssignments || [];
      
      console.log('Teacher Dashboard Data:', { myClasses, subjectAssignments });

      let filteredClasses = [];

      if (myClasses.length > 0) {
        filteredClasses = myClasses.filter((c: any) => {
          // 1. Match by teacher_code (if they are the class teacher)
          if (c.teacher_code && user?.teacher_code && String(c.teacher_code) === String(user?.teacher_code)) return true;
          
          // 2. Match by subject assignments
          return subjectAssignments.some((a: any) => {
            const classIdMatch = a.class_id && c._id && String(a.class_id) === String(c._id);
            const classNameMatch = a.class_name && c.class_code && String(a.class_name).includes(String(c.class_code));
            const standardStr = `${c.standard} - ${c.division}`;
            const formattedNameMatch = a.class_name && String(a.class_name).includes(standardStr);
            
            return classIdMatch || classNameMatch || formattedNameMatch;
          });
        });
      }

      // LAST RESORT: If filtered list is empty, but we have subject assignments, 
      // try to find classes from the assignments themselves if they aren't in myClasses
      if (filteredClasses.length === 0 && subjectAssignments.length > 0) {
        console.warn('Filtered classes empty, trying to derive from subject assignments');
        const derivedClasses = subjectAssignments.map((a: any) => ({
          _id: a.class_id,
          class_code: a.class_name,
          standard: a.class_name?.split('-')[0] || a.class_name,
          division: a.class_name?.split('-')[1] || '',
          medium: a.medium || 'English'
        }));
        
        // Unique by class_code/name
        filteredClasses = Array.from(new Map(derivedClasses.map(c => [c.class_code, c])).values());
      }

      // FINAL FALLBACK: If still empty, show all myClasses from dashboard
      if (filteredClasses.length === 0 && myClasses.length > 0) {
        console.warn('Fallback to all myClasses');
        filteredClasses = myClasses;
      }

      console.log('Final Filtered Classes:', filteredClasses);

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
    
    // Find the class from the teacher's classes list
    const selectedClass = classes.find(c => 
      c.class_code === form.class_code || String(c.standard) === String(form.class_code)
    );
    
    if (!selectedClass) return [];

    // Filter subjects based on admin assignments for THIS specific teacher
    // subjectAssignments comes from teacherData.subjectAssignments in fetchMeta()
    const assignedForThisClass = subjectAssignments.filter(a => {
      // Match by class_id if both exist
      if (a.class_id && selectedClass._id && String(a.class_id) === String(selectedClass._id)) {
        return true;
      }
      // Match by class_name/standard if IDs don't match or aren't available
      if (a.class_name && selectedClass.class_code && String(a.class_name).includes(selectedClass.class_code)) {
        return true;
      }
      // Match by standard name (e.g., "Std 1 - Div A")
      const standardStr = `${selectedClass.standard} - ${selectedClass.division}`;
      if (a.class_name && a.class_name.includes(standardStr)) {
        return true;
      }
      return false;
    });

    if (assignedForThisClass.length > 0) {
      return assignedForThisClass.map(a => ({
        _id: a.subject_id,
        subject_name: a.subject_name,
        subject_code: a.subject_id
      }));
    }

    // Fallback: If no specific assignments found, show subjects for this standard/medium
    return subjects.filter(s => 
      String(s.std) === String(selectedClass.standard) && 
      s.medium === selectedClass.medium
    );
  };

  if (loading) return <Spinner />;

  const typeColors: any = { 
    'Unit Test': 'bg-blue-100 text-blue-700',
    'Mid Term': 'bg-yellow-100 text-yellow-700',
    'Final': 'bg-red-100 text-red-700',
    'Practical': 'bg-green-100 text-green-700',
    'Assignment': 'bg-purple-100 text-purple-700' 
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
          <p className="text-sm text-gray-500">Manage exam schedule for your classes</p>
        </div>
        <button 
          onClick={() => { setEditing(null); setForm(EMPTY); setModal(true); }} 
          className="btn-primary flex items-center gap-2"
        >
          <FaPlus />Add Exam
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative mb-4">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input 
            className="input-field pl-9" 
            placeholder="Search exams by name, class, or subject..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="pb-3 font-medium">Exam Name</th>
                <th className="pb-3 font-medium">Medium</th>
                <th className="pb-3 font-medium">Class</th>
                <th className="pb-3 font-medium">Subject</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Marks</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No exams found for your classes</td></tr>
              ) : (
                filtered.map(ex => (
                  <tr key={ex._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{ex.exam_name}</td>
                    <td className="py-3">{ex.medium || '—'}</td>
                    <td className="py-3 text-primary-600 font-medium">{ex.class_code}</td>
                    <td className="py-3">{ex.subject_name || ex.subject_code}</td>
                    <td className="py-3">{new Date(ex.exam_date).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[ex.exam_type] || 'bg-gray-100 text-gray-700'}`}>
                        {ex.exam_type}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-gray-700">{ex.total_marks} / {ex.passing_marks}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setEditing(ex); setForm({ ...ex, exam_date: ex.exam_date?.split('T')[0] }); setModal(true); }} 
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={async () => { if (window.confirm('Delete exam?')) { await examAPI.delete(ex._id); toast.success('Deleted'); fetch(); } }} 
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <FaTrash />
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

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Exam' : 'Add Exam'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name *</label>
              <input className="input-field" required value={form.exam_name} onChange={e => setForm({ ...form, exam_name: e.target.value })} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
              <select
                className="input-field"
                required
                value={form.class_code}
                onChange={(e) => handleClassChange(e.target.value)}
                disabled={metaLoading}
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c._id || c.class_code} value={c.class_code}>
                    {c.class_code} (Std {c.standard}-{c.division} | {c.medium})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medium *</label>
              <select
                className="input-field"
                required
                value={form.medium}
                onChange={(e) => setForm({ ...form, medium: e.target.value })}
                disabled={metaLoading}
              >
                <option value="">Select medium</option>
                <option value="Gujarati">Gujarati</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <select
                className="input-field"
                required
                value={form.subject_code}
                onChange={(e) => setForm({ ...form, subject_code: e.target.value })}
                disabled={metaLoading || !form.class_code}
              >
                <option value="">Select subject</option>
                {getFilteredSubjects().map((s, idx) => (
                  <option key={s._id || idx} value={s.subject_name}>{s.subject_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Date *</label>
              <input type="date" className="input-field" required value={form.exam_date} onChange={e => setForm({ ...form, exam_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
              <select className="input-field" value={form.exam_type} onChange={e => setForm({ ...form, exam_type: e.target.value })}>
                {['Unit Test', 'Mid Term', 'Final', 'Practical', 'Assignment'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
              <input type="number" className="input-field" value={form.total_marks} onChange={e => setForm({ ...form, total_marks: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passing Marks</label>
              <input type="number" className="input-field" value={form.passing_marks} onChange={e => setForm({ ...form, passing_marks: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="time" className="input-field" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input type="time" className="input-field" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="input-field" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherExams;

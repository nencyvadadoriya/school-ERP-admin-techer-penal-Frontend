import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Calendar, BookOpen, User, GraduationCap, ChevronDown, Clock, Info, CalendarCheck, Trophy } from 'lucide-react';
import { toast } from 'react-toastify';
import Skeleton, { ListSkeleton, CardSkeleton } from '../../components/Skeleton';
import { examAPI, classAPI, subjectAPI, dashboardAPI } from '../../services/api';
import Modal from '../../components/Modal';
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
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('');

  const typeColors: any = { 
    'Unit Test': 'bg-blue-50 text-blue-700',
    'Mid Term': 'bg-amber-50 text-amber-700',
    'Final': 'bg-red-50 text-red-700',
    'Practical': 'bg-green-50 text-green-700',
    'Assignment': 'bg-purple-50 text-purple-700' 
  };

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
            const formattedNameMatch = a.class_name && a.class_name.includes(standardStr);
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

  const handleEdit = (ex: any) => {
    setEditing(ex);
    setForm({
      exam_name: ex.exam_name || '',
      medium: ex.medium || '',
      class_code: ex.class_code || '',
      subject_code: ex.subject_code || '',
      exam_date: ex.exam_date ? new Date(ex.exam_date).toISOString().split('T')[0] : '',
      start_time: ex.start_time || '',
      end_time: ex.end_time || '',
      total_marks: ex.total_marks || 100,
      passing_marks: ex.passing_marks || 35,
      exam_type: ex.exam_type || 'Unit Test',
      description: ex.description || ''
    });
    setModal(true);
  };

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

  const filtered = exams.filter(e => {
    const matchesSearch = !search || 
      e.exam_name?.toLowerCase().includes(search.toLowerCase()) || 
      e.class_code?.toLowerCase().includes(search.toLowerCase()) ||
      e.subject_code?.toLowerCase().includes(search.toLowerCase());
    
    const matchesClass = !selectedClassFilter || e.class_code === selectedClassFilter;
    const matchesSubject = !selectedSubjectFilter || e.subject_code === selectedSubjectFilter;
    
    return matchesSearch && matchesClass && matchesSubject;
  });

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
    <div className="bg-[#F0F2F5] min-h-screen">
      <CardSkeleton />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-24 md:pb-8">
      {/* Desktop Header Card */}
      <div className="hidden md:block px-8 pt-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex justify-between items-center relative overflow-hidden">
          <div className="max-w-[60%]">
            <h1 className="text-2xl font-black text-[#002B5B] tracking-tight">Exam Management</h1>
            <p className="text-gray-400 text-sm font-medium mt-1">Schedule and manage examinations for your classes</p>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <button 
              onClick={()=>{setEditing(null);setForm(EMPTY);setModal(true);}} 
              className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-[#002B5B] text-white shadow-lg rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#003B7B] transition-all active:scale-95"
            >
              <Plus size={14} />
              <span>Add New Exam</span>
            </button>
          </div>
          <div className="absolute -right-20 -top-20 w-48 h-48 bg-[#002B5B]/5 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Header Gradient (Mobile Only) */}
      <div className="md:hidden bg-[#002B5B] text-white px-5 pt-8 pb-12 rounded-b-[32px] relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-xl font-black tracking-tight">Exam Schedules</h1>
          <p className="text-[10px] text-white/70 font-medium uppercase tracking-widest mt-0.5">Manage Examinations</p>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="px-4 md:px-8 -mt-6 md:mt-6 relative z-20 space-y-4">
        {/* Mobile Action Button */}
        <div className="flex justify-center -mt-2 mb-4 md:hidden">
          <button 
            onClick={() => { setEditing(null); setForm(EMPTY); setModal(true); }}
            className="w-full max-w-[200px] flex items-center justify-center gap-2 py-3 bg-white text-[#002B5B] shadow-xl rounded-2xl text-[11px] font-black uppercase tracking-wider hover:bg-gray-50 transition-all active:scale-95 border border-gray-100"
          >
            <Plus size={16} />
            <span>Add New Exam</span>
          </button>
        </div>

        {/* Desktop Search & Filters */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Search exams..." 
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#002B5B]/10 transition-all outline-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="relative">
              <select 
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#002B5B]/10 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="">All Classes</option>
                {classes.map((c, idx) => (
                  <option key={idx} value={c.class_code}>{c.class_code}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>
            <div className="relative">
              <select 
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                className="w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#002B5B]/10 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="">All Subjects</option>
                {[...new Set(exams.map(i => i.subject_code))].map((s, idx) => (
                  <option key={idx} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>
          </div>
        </div>

        {/* Search - Mobile Only */}
        <div className="md:hidden bg-white rounded-xl shadow-sm border border-gray-100 p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
            <input 
              type="text" 
              placeholder="Search exam..." 
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold focus:ring-2 focus:ring-[#002B5B]/10 transition-all outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Exams Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-300">
                <CalendarCheck size={32} />
              </div>
              <h3 className="text-sm font-black text-gray-900 mb-1">No Exams Scheduled</h3>
              <p className="text-[10px] font-medium text-gray-400">Scheduled exams will appear here.</p>
            </div>
          ) : (
            filtered.map((ex) => (
              <div key={ex._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col group hover:shadow-md transition-all hover:border-[#002B5B]/10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex flex-col gap-1">
                    <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider inline-block w-fit ${typeColors[ex.exam_type] || 'bg-gray-50 text-gray-600'}`}>
                      {ex.exam_type}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                      {ex.class_code}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(ex)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all"><Edit size={12} /></button>
                    <button onClick={async () => { if (window.confirm('Delete exam?')) { try { await examAPI.delete(ex._id); toast.success('Deleted'); fetch(); } catch(e) { toast.error('Error'); } } }} className="p-2 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-all"><Trash2 size={12} /></button>
                  </div>
                </div>

                <h3 className="text-sm font-black text-gray-900 mb-1 leading-tight group-hover:text-[#002B5B] transition-colors">{ex.exam_name}</h3>
                
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-gray-50 rounded-xl p-2 md:p-2.5 border border-gray-100">
                    <p className="text-[7px] md:text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5 flex items-center gap-1"><BookOpen size={8} /> Subject</p>
                    <p className="text-[10px] md:text-xs font-black text-gray-800 truncate">{ex.subject_code}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2 md:p-2.5 border border-gray-100">
                    <p className="text-[7px] md:text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5 flex items-center gap-1"><Calendar size={8} /> Date</p>
                    <p className="text-[10px] md:text-xs font-black text-gray-800">{new Date(ex.exam_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2 md:p-2.5 border border-gray-100">
                    <p className="text-[7px] md:text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5 flex items-center gap-1"><Clock size={8} /> Time</p>
                    <p className="text-[10px] md:text-xs font-black text-gray-800 uppercase tracking-tight">{ex.start_time} - {ex.end_time}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2 md:p-2.5 border border-gray-100">
                    <p className="text-[7px] md:text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5 flex items-center gap-1"><Trophy size={8} /> Marks</p>
                    <p className="text-[10px] md:text-xs font-black text-[#002B5B] uppercase tracking-tight">{ex.total_marks} <span className="text-gray-400 font-medium">({ex.passing_marks})</span></p>
                  </div>
                </div>
              </div>
            ))
          )}
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
